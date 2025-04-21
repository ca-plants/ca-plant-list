import { ProgressMeter } from "../progressmeter.js";
import { chunk, sleep } from "../util.js";

/**
 * @typedef {"cc0" | "cc-by" | "cc-by-nc"} AllowedLicenseCode
 * @typedef {{place_id?:string,project_id?:string}} ObsPhotoLocationOptions
    @typedef {{
        id:number,
        observation_photos: {
            photo: import("./inat-tools.js").InatApiPhoto;
        }[];
    }} InatApiObservationPhotos
  @typedef {{
    id: string;
    obsId?:string;
    ext: string;
    licenseCode: AllowedLicenseCode;
    attrName: string | undefined;
}} InatPhotoInfo
 @typedef {{
    id: number;
    attribution: string;
    license_code: string;
    medium_url?: string;
    url?: string;
}} InatApiPhoto
 @typedef {{
    id: number;
    taxon_photos: {
        photo: InatApiPhoto;
    }[];
}} InatApiTaxon
 @typedef {{name: string;} & InatPhotoInfo} InatCsvPhoto
 */

const ALLOWED_LICENSE_CODES = ["cc0", "cc-by", "cc-by-nc"];
const FIELDS_OBS_PHOTO =
    "(id:!t,observation_photos:(photo:(url:!t,attribution:!t,license_code:!t)))";

/**
 * @param {InatApiPhoto} apiPhoto
 * @returns {InatPhotoInfo|undefined}
 */
export function convertToCSVPhoto(apiPhoto) {
    const licenseCode = getAllowedLicenseCode(apiPhoto.license_code);
    if (licenseCode === undefined) {
        return;
    }
    const url = apiPhoto.medium_url || apiPhoto.url;
    if (!url) {
        return;
    }
    const ext = url.split(".").at(-1);
    if (!ext) {
        return;
    }
    /** @type {InatPhotoInfo} */
    return {
        id: apiPhoto.id.toString(),
        ext: ext,
        licenseCode: licenseCode,
        attrName: getAttribution(apiPhoto.attribution),
    };
}

/**
 * @param {string[]} inatTaxonIDs
 * @return {Promise<InatApiTaxon[]>}
 */
async function fetchInatTaxa(inatTaxonIDs) {
    const url = `https://api.inaturalist.org/v2/taxa/${inatTaxonIDs.join(",")}?fields=(taxon_photos:(photo:(medium_url:!t,attribution:!t,license_code:!t)))`;
    const resp = await fetch(url);
    if (!resp.ok) {
        const error = await resp.text();
        throw new Error(`Failed to fetch taxa from iNat: ${error}`);
    }
    const json = await resp.json();
    return json.results;
}

/**
 * @param {import("../types.js").Taxon} taxon
 * @param {{place_id?:string,project_id?:string}} locationOptions
 * @return {Promise<InatApiObservationPhotos[]|Error>}
 */
async function fetchObservationsForTaxon(
    taxon,
    locationOptions = { place_id: "14" },
) {
    const inatTaxonId = taxon.getINatID();
    if (!inatTaxonId) return [];
    let url = new URL(
        `https://api.inaturalist.org/v2/observations/?taxon_id=${inatTaxonId}` +
            "&photo_license=" +
            ALLOWED_LICENSE_CODES.join(",") +
            "&order=desc" +
            "&order_by=votes" +
            "&per_page=5",
    );
    url.searchParams.set("fields", FIELDS_OBS_PHOTO);
    if (locationOptions.place_id) {
        url.searchParams.set("place_id", locationOptions.place_id);
    }
    if (locationOptions.project_id) {
        url.searchParams.set("project_id", locationOptions.project_id);
    }
    const resp = await getResponse(url);
    if (resp instanceof Error) {
        return resp;
    }

    if (!resp.ok) {
        return new Error(await resp.text());
    }
    const json = await resp.json();
    return json.results;
}

/**
 * @param {string[]} obsIds
 * @returns {Promise<InatApiObservationPhotos[]|Error>}
 */
export async function getObsPhotosForIds(obsIds) {
    let url = new URL("https://api.inaturalist.org/v2/observations/");
    url.searchParams.set("fields", FIELDS_OBS_PHOTO);
    url.searchParams.set("id", obsIds.join(","));
    url.searchParams.set("per_page", obsIds.length.toString());

    const resp = await getResponse(url);
    if (resp instanceof Error) {
        return resp;
    }

    if (!resp.ok) {
        return new Error(await resp.text());
    }
    const json = await resp.json();
    return json.results;
}

/**
 * @param {import("../types.js").Taxon[]} taxaToUpdate
 * @param {ObsPhotoLocationOptions|undefined} locationOptions
 * @returns {Promise<Map<string,InatPhotoInfo[]>>}
 */
export async function getObsPhotosForTaxa(taxaToUpdate, locationOptions) {
    /** @type {Map<string,InatPhotoInfo[]>} */
    const photos = new Map();

    const meter = new ProgressMeter(
        "retrieving observation photos",
        taxaToUpdate.length,
    );

    for (let index = 0; index < taxaToUpdate.length; index++) {
        const taxon = taxaToUpdate[index];
        const observations = await fetchObservationsForTaxon(
            taxon,
            locationOptions,
        );
        if (observations instanceof Error) {
            console.error(observations.message);
            continue;
        }

        // Just get the CC-licensed ones, 5 per taxon should be fine (max is 20 on iNat). Whether or not
        const rawPhotoInfo = observations
            .map((obs) =>
                obs.observation_photos.map((op) => {
                    return { obsId: obs.id, ...op.photo };
                }),
            )
            .flat();

        /** @type {InatPhotoInfo[]} */
        const processedPhotoInfo = [];
        for (const photo of rawPhotoInfo) {
            if (processedPhotoInfo.length >= 5) {
                break;
            }
            const obj = convertToCSVPhoto(photo);
            if (!obj) {
                continue;
            }
            processedPhotoInfo.push(obj);
        }
        photos.set(taxon.getName(), processedPhotoInfo);

        meter.update(index + 1);
    }

    meter.stop();

    return photos;
}

/**
 * @param {import("../types.js").Taxon[]} taxaToUpdate
 * @returns {Promise<Map<string,InatPhotoInfo[]>>}
 */
export async function getTaxonPhotos(taxaToUpdate) {
    /** @type {Map<string,string>} */
    const idMap = new Map();

    for (const taxon of taxaToUpdate) {
        if (taxon.getINatID()) {
            idMap.set(taxon.getINatID(), taxon.getName());
        }
    }

    /** @type {Map<string,InatPhotoInfo[]>} */
    const photos = new Map();

    const meter = new ProgressMeter("retrieving taxa", taxaToUpdate.length);
    let taxaRetrieved = 0;

    for (const batch of chunk(taxaToUpdate, 30)) {
        const inatTaxa = await fetchInatTaxa(batch.map((t) => t.getINatID()));
        for (const iNatTaxon of inatTaxa) {
            const taxonName = idMap.get(iNatTaxon.id.toString());
            if (!taxonName) {
                throw new Error(`iNat id ${iNatTaxon.id} not found`);
            }
            /** @type {InatPhotoInfo[]} */
            const taxonPhotos = [];
            for (const taxonPhoto of iNatTaxon.taxon_photos) {
                const obj = convertToCSVPhoto(taxonPhoto.photo);
                if (!obj) {
                    continue;
                }
                taxonPhotos.push(obj);
            }
            photos.set(taxonName, taxonPhotos);
        }
        taxaRetrieved += batch.length;
        meter.update(taxaRetrieved);
        await sleep(1_100);
    }

    meter.stop();

    return photos;
}

/**
 * @param {string} licenseCode
 * @returns {AllowedLicenseCode|undefined}
 */
function getAllowedLicenseCode(licenseCode) {
    switch (licenseCode) {
        case "cc0":
        case "cc-by":
        case "cc-by-nc":
            return licenseCode;
    }
}

/**
 * @param {string} rawAttribution
 * @returns {string|undefined}
 */
function getAttribution(rawAttribution) {
    // Photographers retain copyright for most CC licenses,
    // except CC0, so attribution is a bit different
    return (
        rawAttribution.match(/\(c\) (.*?),/)?.[1] ||
        rawAttribution.match(/uploaded by (.*)/)?.[1]
    );
}

let lastQueryTime = Date.now();
/**
 * @param {URL} url
 * @returns {Promise<Response|Error>}
 */
async function getResponse(url) {
    // If less than one second since last query, delay.
    const delayTime = 1050 - (Date.now() - lastQueryTime);
    if (delayTime > 0) {
        await sleep(delayTime);
    }

    try {
        lastQueryTime = Date.now();
        return await fetch(url);
    } catch (error) {
        if (error instanceof Error) {
            return error;
        }
        throw error;
    }
}

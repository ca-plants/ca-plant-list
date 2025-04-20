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
    }} InatApiObservation
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
 * @return {Promise<InatApiObservation[]|undefined>}
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
            "&per_page=5" +
            "&fields=(id:!t,observation_photos:(photo:(url:!t,attribution:!t,license_code:!t)))",
    );
    if (locationOptions.place_id) {
        url.searchParams.set("place_id", locationOptions.place_id);
    }
    if (locationOptions.project_id) {
        url.searchParams.set("project_id", locationOptions.project_id);
    }
    let resp;
    try {
        resp = await fetch(url);
    } catch (error) {
        console.error(`Error retrieving observations for ${taxon.getName()}`);
        if (error instanceof Error) {
            console.error(error.message);
            console.error(error.stack);
        }
        return;
    }
    if (!resp.ok) {
        const error = await resp.text();
        console.error(`Failed to fetch taxa from iNat: ${error}`);
        return;
    }
    const json = await resp.json();
    return json.results;
}

/**
 * @param {import("../types.js").Taxon[]} taxaToUpdate
 * @param {ObsPhotoLocationOptions|undefined} locationOptions
 * @returns {Promise<Map<string,InatPhotoInfo[]>>}
 */
export async function getObsPhotos(taxaToUpdate, locationOptions) {
    /** @type {Map<string,InatPhotoInfo[]>} */
    const photos = new Map();

    const meter = new ProgressMeter(
        "retrieving observation photos",
        taxaToUpdate.length,
    );

    for (let index = 0; index < taxaToUpdate.length; index++) {
        const taxon = taxaToUpdate[index];
        const time = Date.now();
        const observations = await fetchObservationsForTaxon(
            taxon,
            locationOptions,
        );
        if (!observations) {
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

            const licenseCode = getAllowedLicenseCode(photo.license_code);
            if (licenseCode === undefined) {
                continue;
            }

            if (!photo.url) {
                continue;
            }
            const ext = photo.url.split(".").at(-1);
            if (!ext) {
                continue;
            }
            processedPhotoInfo.push({
                id: photo.id.toString(),
                obsId: photo.obsId.toString(),
                ext: ext,
                licenseCode: licenseCode,
                attrName: getAttribution(photo.attribution),
            });
        }
        photos.set(taxon.getName(), processedPhotoInfo);

        meter.update(index + 1);

        const sleepTime = 1050 - (Date.now() - time);
        if (sleepTime > 0) {
            await sleep(sleepTime);
        }
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
                const licenseCode = getAllowedLicenseCode(
                    taxonPhoto.photo.license_code,
                );
                if (licenseCode === undefined) {
                    continue;
                }
                const url = taxonPhoto.photo.medium_url || taxonPhoto.photo.url;
                if (!url) {
                    continue;
                }
                const ext = url.split(".").at(-1);
                if (!ext) {
                    continue;
                }
                /** @type {InatPhotoInfo} */
                const obj = {
                    id: taxonPhoto.photo.id.toString(),
                    ext: ext,
                    licenseCode: licenseCode,
                    attrName: getAttribution(taxonPhoto.photo.attribution),
                };

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

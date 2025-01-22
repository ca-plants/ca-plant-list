import { ProgressMeter } from "../progressmeter.js";
import { chunk, sleep } from "../util.js";

/**
  @typedef {"cc-by-nc-sa"
    | "cc-by-nc"
    | "cc-by-nc-nd"
    | "cc-by"
    | "cc-by-sa"
    | "cc-by-nd"
    | "pd"
    | "gdfl"
    | "cc0"} InatLicenseCode
  @typedef {{
    id: string;
    ext: string;
    licenseCode: string;
    attrName: string | undefined;
}} InatPhotoInfo
 @typedef {{
    id: number;
    attribution: string;
    license_code: InatLicenseCode;
    medium_url?: string;
    url?: string;
}} InatApiPhoto
 @typedef {{
    id: number;
    taxon_photos: {
        photo: InatApiPhoto;
    }[];
}} InatApiTaxon
 @typedef {{
    name: string;
    id: number;
    ext: string;
    licenseCode: InatLicenseCode;
    attrName: string;
    }} InatCsvPhoto
 */
const ALLOWED_LICENSE_CODES = ["cc0", "cc-by", "cc-by-nc"];

/**
 * @param {import("../taxon.js").Taxon[]} taxa
 * @return {Promise<InatApiTaxon[]>}
 */
async function fetchInatTaxa(taxa) {
    const inatTaxonIDs = taxa.map((taxon) => taxon.getINatID()).filter(Boolean);
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
 * @param {import("../taxon.js").Taxon[]} taxaToUpdate
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
        const inatTaxa = await fetchInatTaxa(batch);
        for (const iNatTaxon of inatTaxa) {
            const iNatTaxonPhotos = iNatTaxon.taxon_photos
                .filter((tp) =>
                    ALLOWED_LICENSE_CODES.includes(tp.photo.license_code),
                )
                .slice(0, 5);

            const taxonName = idMap.get(iNatTaxon.id.toString());
            if (!taxonName) {
                throw new Error(`iNat id ${iNatTaxon.id} not found`);
            }
            /** @type {InatPhotoInfo[]} */
            const taxonPhotos = [];
            for (const taxonPhoto of iNatTaxonPhotos) {
                const url = taxonPhoto.photo.medium_url || taxonPhoto.photo.url;
                if (!url) continue;
                const ext = url.split(".").at(-1);
                if (!ext) continue;
                /** @type {InatPhotoInfo} */
                const obj = {
                    id: taxonPhoto.photo.id.toString(),
                    ext: ext,
                    licenseCode: taxonPhoto.photo.license_code,
                    attrName:
                        // Photographers retain copyright for most CC licenses,
                        // except CC0, so attribution is a bit different
                        taxonPhoto.photo.attribution.match(
                            /\(c\) (.*?),/,
                        )?.[1] ||
                        taxonPhoto.photo.attribution.match(
                            /uploaded by (.*)/,
                        )?.[1],
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

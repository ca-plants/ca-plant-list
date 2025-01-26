import path from "node:path";
import { CSV } from "../csv.js";
import { TaxaCSV } from "./taxacsv.js";

/**
 * @typedef {{id:string}} CCHTaxon
 * @typedef {Map<string,CCHTaxon>} CCHTaxa
 */

export class CCH2 {
    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../taxa.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static async analyze(toolsDataDir, dataDir, taxa, errorLog, update) {
        const toolsDataPath = path.join(toolsDataDir, "cch2");

        const cchTaxa = await getCCHTaxa(toolsDataPath, taxa);

        const idsToUpdate = new Map();
        for (const taxon of taxa.getTaxonList()) {
            const cchTaxon = cchTaxa.get(taxon.getName());
            if (!cchTaxon) {
                errorLog.log(taxon.getName(), "not found in CCH data");
                continue;
            }
            if (cchTaxon.id !== taxon.getCCH2ID()) {
                errorLog.log(
                    taxon.getName(),
                    "id in CCH data does not match id in taxa.csv",
                    cchTaxon.id,
                    taxon.getCCH2ID(),
                );
                idsToUpdate.set(taxon.getName(), cchTaxon.id);
            }
        }

        if (update) {
            updateTaxaCSV(dataDir, idsToUpdate);
        }
    }
}

/**
 * @param {string} toolsDataPath
 * @param {import("../taxa.js").Taxa} taxa
 * @returns {Promise<CCHTaxa>}
 */
async function getCCHTaxa(toolsDataPath, taxa) {
    /**
     * @param {{taxonID:string,scientificName:string,rankID:string,acceptance:"0"|"1",acceptedTaxonID:string}} record
     */
    function callback(record) {
        if (parseInt(record.rankID) < 220) {
            // Ignore ranks above species.
            return;
        }
        if (record.acceptance !== "1") {
            return;
        }
        if (!taxa.getTaxon(record.scientificName)) {
            // If we're not tracking the taxon, ignore it.
            return;
        }
        data.set(record.scientificName, { id: record.acceptedTaxonID });
    }

    const fileName = path.join(toolsDataPath, "taxa.csv");
    const data = new Map();

    await CSV.parseFileStream(fileName, callback);

    return data;
}

/**
 * @param {string} dataDir
 * @param {Map<string,string>} idsToUpdate
 */
function updateTaxaCSV(dataDir, idsToUpdate) {
    const taxa = new TaxaCSV(dataDir);

    for (const taxonData of taxa.getTaxa()) {
        const id = idsToUpdate.get(taxonData.taxon_name);
        if (!id) {
            continue;
        }
        taxonData.cch2_id = id;
    }

    taxa.write();
}

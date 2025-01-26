import path from "node:path";
import { CSV } from "../csv.js";

/**
 * @typedef {{id:string}} CCHTaxon
 * @typedef {Map<string,CCHTaxon>} CCHTaxa
 */

export class CCH2 {
    /**
     * @param {string} toolsDataDir
     * @param {import("../taxa.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     */
    static async analyze(toolsDataDir, taxa, errorLog) {
        const toolsDataPath = path.join(toolsDataDir, "cch2");

        const cchTaxa = await getCCHTaxa(toolsDataPath, taxa);

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
            }
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

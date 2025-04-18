import path from "node:path";
import { Files } from "../files.js";
import { CSV } from "../csv.js";
import { sleep } from "../util.js";
import { TaxaCSV } from "./taxacsv.js";
import { SynCSV } from "./syncsv.js";

/**
 * @typedef {{id:string,
 * name:string,
 * phylum:string,
 * rank:string,
 * scientificName:string,
 * specificEpithet:string
 * }} INatCSVData
 */

export class INat {
    /** @type {Object<string,InatTaxon>} */
    static #taxa = {};

    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {string} csvFileName
     * @param {boolean} update
     */
    static async analyze(
        toolsDataDir,
        dataDir,
        taxa,
        exceptions,
        errorLog,
        csvFileName,
        update,
    ) {
        const inatDataDir = toolsDataDir + "/inat";
        const csvFilePath = inatDataDir + "/" + csvFileName;

        // Create data directory if it's not there.
        Files.mkdir(inatDataDir);

        // Download the data file if it doesn't exist.
        if (!Files.exists(csvFilePath)) {
            const url =
                "https://www.inaturalist.org/taxa/inaturalist-taxonomy.dwca.zip";
            const zipFileName = path.basename(url);
            const zipFilePath = inatDataDir + "/" + zipFileName;
            console.log("retrieving iNaturalist species");
            await Files.fetch(url, zipFilePath);
            await Files.zipFileExtract(zipFilePath, "taxa.csv", csvFilePath);
        }

        console.log("loading iNaturalist species");
        await CSV.parseStream(
            inatDataDir,
            csvFileName,
            undefined,
            undefined,
            this.#checkTaxon,
        );
        console.log("iNat: " + Object.keys(this.#taxa).length + " taxa loaded");

        const missingTaxa = [];

        /** @type {Map<string,string>} */
        const idsToUpdate = new Map();
        /** @type {import("./syncsv.js").SynData[]} */
        const synonymsToAdd = [];

        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            if (name.includes(" unknown")) {
                continue;
            }
            const iNatName = taxon.getINatName();
            const iNatTaxon = this.#taxa[iNatName];
            if (!iNatTaxon) {
                if (!exceptions.hasException(name, "inat", "notintaxondata")) {
                    errorLog.log(name, "not found in " + csvFileName, iNatName);
                }
                missingTaxa.push({ name: name, iNatName: iNatName });
                continue;
            }
            if (iNatTaxon.getID() !== taxon.getINatID()) {
                errorLog.log(
                    name,
                    "iNat ID in " +
                        csvFileName +
                        " does not match ID in taxa.csv",
                    iNatTaxon.getID(),
                    taxon.getINatID(),
                );
                idsToUpdate.set(name, iNatTaxon.getID());
            }
        }

        console.log("iNat: looking up missing names");
        for (const data of missingTaxa) {
            await this.#findCurrentName(
                taxa,
                exceptions,
                errorLog,
                data.name,
                data.iNatName,
                synonymsToAdd,
            );
        }

        this.#checkExceptions(taxa, exceptions, errorLog);

        if (update) {
            updateSynCSV(dataDir, synonymsToAdd);
            updateTaxaCSV(dataDir, idsToUpdate);
        }
    }

    /**
     *
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     */
    static #checkExceptions(taxa, exceptions, errorLog) {
        // Check the iNat exceptions and make sure they still apply.
        for (const [name, v] of exceptions.getExceptions()) {
            const exceptions = v.inat;
            if (!exceptions) {
                continue;
            }

            // Make sure the taxon is still in our list.
            const taxon = taxa.getTaxon(name);
            if (!taxon) {
                // Don't process global exceptions if taxon is not in local list.
                if (taxa.isSubset() && !v.local) {
                    continue;
                }
                errorLog.log(name, "has iNat exceptions but not in taxa.tsv");
                continue;
            }

            for (const [k] of Object.entries(exceptions)) {
                const iNatData = INat.#taxa[name];
                switch (k) {
                    case "notintaxondata":
                        if (iNatData) {
                            errorLog.log(
                                name,
                                "found in iNat data but has notintaxondata exception",
                            );
                        }
                        break;
                    default:
                        errorLog.log(name, "unrecognized iNat exception", k);
                }
            }
        }
    }

    /**
     * @param {INatCSVData} record
     */
    static #checkTaxon(record) {
        if (record["phylum"] === "Tracheophyta" && record["specificEpithet"]) {
            const name = record["scientificName"];
            INat.#taxa[name] = new InatTaxon(record["id"]);
        }
    }

    /**
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {string} name
     * @param {string} iNatName
     * @param {import("./syncsv.js").SynData[]} synonymsToAdd
     */
    static async #findCurrentName(
        taxa,
        exceptions,
        errorLog,
        name,
        iNatName,
        synonymsToAdd,
    ) {
        /**
         * @param {{matched_term:string,name:string,rank:string}[]} results
         * @param {string} iNatName
         */
        function findMatchingResult(results, iNatName) {
            if (results.length === 1) {
                return results[0];
            }
            let match;
            for (const result of results) {
                if (result.matched_term === iNatName) {
                    if (match) {
                        errorLog.log(
                            iNatName,
                            "found more than one matched_term",
                            match.matched_term,
                            result.matched_term,
                        );
                        return;
                    }
                    match = result;
                }
            }
            return match;
        }

        const url = new URL("https://api.inaturalist.org/v1/taxa");
        url.searchParams.set("q", iNatName);

        const response = await fetch(url);
        const data = await response.json();

        /** @type {{name:string,rank:string}|undefined} */
        let result = findMatchingResult(data.results, iNatName);
        if (result === undefined) {
            const parts = iNatName.split(" ");
            switch (parts.length) {
                case 2:
                    // If it's "genus species", try "genus species species".
                    parts.push(parts[1]);
                    iNatName = parts.join(" ");
                    result = findMatchingResult(data.results, iNatName);
                    break;
                case 3:
                    // If it's "genus species species", try "genus species".
                    if (parts[1] === parts[2]) {
                        iNatName = parts[0] + " " + parts[1];
                        result = findMatchingResult(data.results, iNatName);
                    }
                    break;
            }
        }

        if (result === undefined) {
            if (!exceptions.hasException(name, "inat", "notintaxondata")) {
                errorLog.log(name, "iNat lookup found no results");
                // Make sure this doesn't have an iNat ID.
                const iNatID = taxa.getTaxon(name).getINatID();
                if (iNatID) {
                    errorLog.log(
                        name,
                        "iNat lookup failed but has iNat ID",
                        iNatID,
                    );
                }
            }
        } else {
            const formerName = this.makeSynonymName(result, errorLog);
            errorLog.log(
                name,
                "found iNat synonym",
                formerName + "," + name + ",INAT",
            );
            synonymsToAdd.push({
                Former: formerName,
                Current: name,
                Type: "INAT",
            });
        }

        // Delay to throttle queries to iNat API.
        await sleep(800);
    }

    /**
     * @param {{name:string,rank:string}} iNatResult
     * @param {import("../errorlog.js").ErrorLog} errorLog
     */
    static makeSynonymName(iNatResult, errorLog) {
        const synParts = iNatResult.name.split(" ");
        if (synParts.length === 3) {
            switch (iNatResult.rank) {
                case "subspecies":
                case "variety":
                    synParts[3] = synParts[2];
                    synParts[2] =
                        iNatResult.rank === "variety" ? "var." : "subsp.";
                    break;
                case "hybrid":
                    // Leave as is.
                    break;
                default:
                    errorLog.log(
                        iNatResult.name,
                        "unrecognized iNat rank",
                        iNatResult.rank,
                    );
            }
        }
        return synParts.join(" ");
    }
}

class InatTaxon {
    #id;

    /**
     * @param {string} id
     */
    constructor(id) {
        this.#id = id;
    }

    getID() {
        return this.#id;
    }
}

/**
 * @param {string} dataDir
 * @param {import("./syncsv.js").SynData[]} synonymsToAdd
 */
function updateSynCSV(dataDir, synonymsToAdd) {
    const csv = new SynCSV(dataDir);
    const data = csv.getData();
    data.push(...synonymsToAdd);
    csv.write();
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
        taxonData["inat id"] = id;
    }

    taxa.write();
}

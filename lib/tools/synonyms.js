import path from "node:path";
import { CSV } from "../csv.js";
import { SynCSV } from "./syncsv.js";

export class Synonyms {
    /**
     * @param {string} dataDir
     * @param {import("../types.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static analyze(dataDir, taxa, errorLog, update) {
        /** @type {import("./syncsv.js").SynData[]} */
        const synCSV = CSV.readFile(path.join(dataDir, "synonyms.csv"));
        /** @type {import("./syncsv.js").SynData[]} */
        const newData = [];

        for (const synData of synCSV) {
            const taxon = taxa.getTaxon(synData.Current);
            if (taxon === undefined) {
                errorLog.log(synData.Current, "is not a valid synonym target");
                continue;
            }
            if (synData.Current === synData.Former) {
                errorLog.log(synData.Current, "has identical former name");
                continue;
            }
            newData.push(synData);
        }

        if (update) {
            this.#updateSynCSV(newData);
        }
    }

    /**
     * @param {import("./syncsv.js").SynData[]} newData
     */
    static #updateSynCSV(newData) {
        const csv = new SynCSV("./data");
        csv.setData(newData);
        csv.write();
    }
}

import path from "path";
import { CSV } from "../csv.js";

export class TaxaCSV {
    #headers;
    /** @type {TaxonData[]} */
    #taxa;

    /**
     * @param {string} dataDir
     */
    constructor(dataDir) {
        const csv = CSV.readFileAndHeaders(path.join(dataDir, "taxa.csv"));
        // @ts-ignore
        this.#taxa = csv.data;
        this.#headers = csv.headers;
    }

    /**
     * @returns {TaxonData[]}
     */
    getTaxa() {
        return this.#taxa;
    }
}

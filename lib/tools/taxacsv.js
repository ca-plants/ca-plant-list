import path from "path";
import { CSV } from "../csv.js";

export class TaxaCSV {
    #filePath;
    #headers;
    /** @type {TaxonData[]} */
    #taxa;

    /**
     * @param {string} dataDir
     */
    constructor(dataDir) {
        this.#filePath = path.join(dataDir, "taxa.csv");
        const csv = CSV.readFileAndHeaders(this.#filePath);
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

    write() {
        CSV.writeFileObject(this.#filePath, this.#taxa, this.#headers);
    }
}

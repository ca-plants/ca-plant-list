import path from "path";
import { CSV } from "../csv.js";

/**
 * @typedef {{Former:string,Current:string,Type?:"INAT"|undefined}} SynData
 */

export class SynCSV {
    #filePath;
    #headers;
    /** @type {SynData[]} */
    #data;

    /**
     * @param {string} dataDir
     */
    constructor(dataDir) {
        this.#filePath = path.join(dataDir, "synonyms.csv");
        const csv = CSV.readFileAndHeaders(this.#filePath);
        this.#data = csv.data;
        this.#headers = csv.headers;
    }

    /**
     * @returns {SynData[]}
     */
    getData() {
        return this.#data;
    }

    write() {
        this.#data.sort((a, b) => {
            const former = a.Former.localeCompare(b.Former);
            if (former !== 0) {
                return former;
            }
            return a.Current.localeCompare(b.Current);
        });
        CSV.writeFileObject(this.#filePath, this.#data, this.#headers);
    }
}

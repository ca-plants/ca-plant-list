import path from "path";
import { CSV } from "../csv.js";

const HEADERS = [
    "taxon_name",
    "common name",
    "status",
    "life_cycle",
    "flower_color",
    "bloom_start",
    "bloom_end",
    "jepson id",
    "calrecnum",
    "inat id",
    "cch2_id",
    "fna",
    "calscape_cn",
    "calipc",
    "RPI ID",
    "CRPR",
    "CESA",
    "FESA",
    "SRank",
    "GRank",
];

export class TaxaCSV {
    #filePath;
    /** @type {import("../index.js").TaxonData[]} */
    #taxa;

    /**
     * @param {string} dataDir
     */
    constructor(dataDir) {
        this.#filePath = path.join(dataDir, "taxa.csv");
        const csv = CSV.readFileAndHeaders(this.#filePath);
        this.#taxa = csv.data;
    }

    /**
     * @returns {import("../index.js").TaxonData[]}
     */
    getTaxa() {
        return this.#taxa;
    }

    write() {
        CSV.writeFileObject(this.#filePath, this.#taxa, HEADERS);
    }
}

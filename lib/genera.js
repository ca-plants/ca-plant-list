import { Config } from "./config.js";
import { Files } from "./files.js";

class Genera {
    #families;
    #genera;

    /**
     * @param {import("./types.js").Families} families
     */
    constructor(families) {
        const dataDir = Config.getPackageDir() + "/data";
        this.#genera = JSON.parse(Files.read(dataDir + "/genera.json"));
        this.#families = families;
    }

    /**
     * @param {import("./types.js").Taxon} taxon
     */
    addTaxon(taxon) {
        const genusName = taxon.getGenusName();
        const genusData = this.#genera[genusName];
        if (!genusData) {
            throw new Error(taxon.getName() + " genus not found");
        }

        if (genusData.familyObj === undefined) {
            // Initialize genus data.
            genusData.familyObj = this.#families.getFamily(genusData.family);
            genusData.taxa = [];
        }
        genusData.familyObj.addTaxon(taxon);

        genusData.taxa.push(taxon);
    }

    /**
     * @param {string} genusName
     */
    getGenus(genusName) {
        return new Genus(this.#genera[genusName]);
    }
}

class Genus {
    #data;

    /**
     * @param {{family:string,familyObj:import("./types.js").Family,taxa:import("./types.js").Taxon[]}} data
     */
    constructor(data) {
        this.#data = data;
    }

    getFamily() {
        return this.#data.familyObj;
    }

    /**
     * @returns {import("./types.js").Taxon[]}
     */
    getTaxa() {
        return this.#data.taxa.sort((a, b) =>
            a.getName().localeCompare(b.getName()),
        );
    }
}

export { Genera };

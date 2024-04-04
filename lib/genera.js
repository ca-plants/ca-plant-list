import { Config } from "./config.js";
import { Families } from "./families.js";
import { Files } from "./files.js";
// eslint-disable-next-line no-unused-vars
import { Taxon } from "./taxon.js";

class Genera {
    #families;
    #genera;

    /**
     * @param {Families} families
     */
    constructor(families) {
        const dataDir = Config.getPackageDir() + "/data";
        this.#genera = JSON.parse(Files.read(dataDir + "/genera.json"));
        this.#families = families;
    }

    /**
     * @param {Taxon} taxon
     */
    addTaxon(taxon) {
        const genusName = taxon.getGenusName();
        const genusData = this.#genera[genusName];
        if (!genusData) {
            console.log(taxon.getName() + " genus not found");
            return;
        }

        if (genusData.taxa === undefined) {
            genusData.taxa = [];
        }
        genusData.taxa.push(taxon);

        const family = this.getFamily(genusName);
        if (!family) {
            console.log(taxon.getName() + " family not found");
            return;
        }
        family.addTaxon(taxon);
    }

    /**
     * @param {string} genusName
     */
    getGenus(genusName) {
        return new Genus(this.#genera[genusName]);
    }

    /**
     * @param {string} genusName
     */
    getFamily(genusName) {
        const genus = this.#genera[genusName];
        if (genus) {
            return this.#families.getFamily(genus.family);
        }
    }
}

class Genus {
    #data;

    constructor(data) {
        this.#data = data;
    }

    getTaxa() {
        return this.#data.taxa.sort((a, b) =>
            a.getName().localeCompare(b.getName())
        );
    }
}

export { Genera };

import { Files } from "../files.js";
import { Config } from "../config.js";
import { Taxonomy } from "./taxonomy.js";

/**
 * @typedef {{id:string,section:string,taxa?:import("../types.js").Taxon[]}} FamilyData
 */

export class Family extends Taxonomy {
    #name;
    #data;

    /**
     * @param {string} name
     * @param {FamilyData} data
     */
    constructor(name, data) {
        super({ "jepson id": data.id });
        this.#name = name;
        this.#data = data;
    }

    /**
     * @param {import("../types.js").Taxon} taxon
     */
    addTaxon(taxon) {
        if (!this.#data.taxa) {
            this.#data.taxa = [];
        }
        this.#data.taxa.push(taxon);
        Sections.addTaxon(this.getSectionName(), taxon);
    }

    getBaseFileName() {
        return this.getName();
    }

    getFileName(ext = "html") {
        return this.getBaseFileName() + "." + ext;
    }

    getName() {
        return this.#name;
    }

    getSectionName() {
        return this.#data.section;
    }

    getTaxa() {
        return this.#data.taxa;
    }
}

export class Families {
    #families;

    constructor() {
        const dataDir = Config.getPackageDir() + "/data";

        this.#families = JSON.parse(Files.read(dataDir + "/families.json"));
        for (const [k, v] of Object.entries(this.#families)) {
            this.#families[k] = new Family(k, v);
        }
    }

    /**
     * @returns {Family[]}
     */
    getFamilies() {
        return Object.values(this.#families).sort((a, b) =>
            a.getName().localeCompare(b.getName()),
        );
    }

    /**
     * @param {string} familyName
     */
    getFamily(familyName) {
        return this.#families[familyName];
    }
}

export class Sections {
    /** @type {Object<string,import("../types.js").Taxon[]>} */
    static #sections = {};

    /**
     * @param {string} name
     * @param {import("../types.js").Taxon} taxon
     */
    static addTaxon(name, taxon) {
        let section = this.#sections[name];
        if (!section) {
            section = [];
            this.#sections[name] = section;
        }
        section.push(taxon);
    }

    static getSections() {
        return this.#sections;
    }
}

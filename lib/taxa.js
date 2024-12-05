import * as fs from "node:fs";
import path from "node:path";

import { Config } from "./config.js";
import { CSV } from "./csv.js";
import { Genera } from "./genera.js";
import { Taxon } from "./taxon.js";
import { Families } from "./families.js";
import { FlowerColor } from "./flowercolor.js";
import { InatPhoto } from "./inat_photo.js";
import { TaxaCSV } from "./tools/taxacsv.js";

const FLOWER_COLORS = [
    { name: "white", color: "white" },
    { name: "red", color: "red" },
    { name: "pink", color: "#ff69b4" },
    { name: "orange", color: "orange" },
    { name: "yellow", color: "yellow" },
    { name: "blue", color: "blue" },
    { name: "purple", color: "purple" },
    { name: "green", color: "green" },
    { name: "brown", color: "brown" },
];

class Taxa {
    #families;
    #errorLog;
    /** @type {Object<string,Taxon>} */
    #taxa = {};
    /** @type {Object<string,FlowerColor>} */
    #flower_colors = {};
    #sortedTaxa;
    #synonyms = new Set();
    #isSubset;

    /**
     * @param {Object<string,TaxonData>|true} inclusionList
     * @param {ErrorLog} errorLog
     * @param {boolean} showFlowerErrors
     * @param {function(TaxonData,Genera):Taxon} taxonFactory
     * @param {TaxonData[]} [extraTaxa=[]]
     * @param {SynonymData[]} [extraSynonyms=[]]
     * @param {boolean} includePhotos
     */
    constructor(
        inclusionList,
        errorLog,
        showFlowerErrors,
        taxonFactory = (td, g) => new Taxon(td, g),
        extraTaxa = [],
        extraSynonyms = [],
        includePhotos = true,
    ) {
        this.#isSubset = inclusionList !== true;

        this.#errorLog = errorLog;

        for (const color of FLOWER_COLORS) {
            this.#flower_colors[color.name] = new FlowerColor(color.name);
        }

        const dataDir = Config.getPackageDir() + "/data";

        this.#families = new Families();

        const taxaCSV = new TaxaCSV(dataDir);
        this.#loadTaxa(
            taxaCSV.getTaxa(),
            inclusionList,
            taxonFactory,
            showFlowerErrors,
        );
        this.#loadTaxa(
            extraTaxa,
            inclusionList,
            taxonFactory,
            showFlowerErrors,
        );

        // Make sure everything in the inclusionList has been loaded.
        for (const name of Object.keys(inclusionList)) {
            if (!this.getTaxon(name)) {
                this.#errorLog.log(name, "not found in taxon list");
            }
        }

        this.#sortedTaxa = Object.values(this.#taxa).sort((a, b) =>
            a.getName().localeCompare(b.getName()),
        );

        if (includePhotos) {
            this.#loadInatPhotos(dataDir);
        }

        const synCSV = CSV.parseFile(dataDir, "synonyms.csv");
        this.#loadSyns(synCSV, inclusionList);
        this.#loadSyns(extraSynonyms, inclusionList);
    }

    /**
     * @param {string} dataDir
     */
    #loadInatPhotos(dataDir) {
        const photosFileName = "inattaxonphotos.csv";
        if (fs.existsSync(path.join(dataDir, photosFileName))) {
            /** @type {InatCsvPhoto[]} */
            const csvPhotos = CSV.parseFile(dataDir, photosFileName);
            for (const csvPhoto of csvPhotos) {
                const taxon = this.getTaxon(csvPhoto.name);
                if (!taxon) {
                    continue;
                }
                taxon.addPhoto(
                    new InatPhoto(
                        csvPhoto.id,
                        csvPhoto.ext,
                        csvPhoto.licenseCode,
                        csvPhoto.attrName,
                    ),
                );
            }
        }
    }

    getFamilies() {
        return this.#families;
    }

    getFlowerColors() {
        return Object.values(this.#flower_colors).filter(
            (fc) => fc.getTaxa().length > 0,
        );
    }

    /**
     * @param {string} name
     */
    getTaxon(name) {
        return this.#taxa[name];
    }

    getTaxonList() {
        return this.#sortedTaxa;
    }

    /**
     * @param {string} formerName
     */
    hasSynonym(formerName) {
        return this.#synonyms.has(formerName);
    }

    /**
     * true if an inclusion list was supplied when reading the taxa.
     * @returns {boolean}
     */
    isSubset() {
        return this.#isSubset;
    }

    /**
     * @param {SynonymData[]} synCSV
     * @param {Object<string,TaxonData>|boolean} inclusionList
     */
    #loadSyns(synCSV, inclusionList) {
        for (const syn of synCSV) {
            const currName = syn["Current"];
            const taxon = this.getTaxon(currName);
            if (!taxon) {
                if (inclusionList === true && !syn.Type) {
                    // If including all taxa, note the error - the target is not defined, and this is not
                    // a synonym for a non-Jepson system.
                    console.log("synonym target not found: " + currName);
                }
                continue;
            }
            const formerName = syn["Former"];
            this.#synonyms.add(formerName);
            taxon.addSynonym(formerName, syn["Type"]);
        }
    }

    /**
     * @param {TaxonData[]} taxaCSV
     * @param {Object<string,TaxonData>|true} inclusionList
     * @param {function(TaxonData,Genera):Taxon} taxonFactory
     * @param {boolean} showFlowerErrors
     */
    #loadTaxa(taxaCSV, inclusionList, taxonFactory, showFlowerErrors) {
        const genera = new Genera(this.#families);
        for (const row of taxaCSV) {
            const name = row["taxon_name"];

            /** @type {TaxonData|{status?:string}} */
            let taxon_overrides = {};
            if (inclusionList !== true) {
                taxon_overrides = inclusionList[name];
                if (!taxon_overrides) {
                    continue;
                }
            }

            if (this.#taxa[name]) {
                this.#errorLog.log(name, "has multiple entries");
            }

            const status = taxon_overrides["status"];
            if (status !== undefined) {
                row["status"] = status;
            }
            const taxon = taxonFactory(row, genera);
            this.#taxa[name] = taxon;
            const colors = taxon.getFlowerColors();
            if (colors) {
                for (const colorName of colors) {
                    const color = this.#flower_colors[colorName];
                    if (!color) {
                        throw new Error(
                            'flower color "' +
                                colorName +
                                '" not found for ' +
                                name,
                        );
                    }
                    color.addTaxon(taxon);
                }
            }

            if (showFlowerErrors) {
                // Make sure flower colors/bloom times are present or not depending on taxon.
                if (taxon.shouldHaveFlowers()) {
                    if (
                        !colors ||
                        !taxon.getBloomStart() ||
                        !taxon.getBloomEnd()
                    ) {
                        this.#errorLog.log(
                            name,
                            "does not have all flower info",
                        );
                    }
                } else {
                    if (
                        colors ||
                        taxon.getBloomStart() ||
                        taxon.getBloomEnd()
                    ) {
                        this.#errorLog.log(name, "should not have flower info");
                    }
                }
            }
        }
    }
}

export { Taxa };

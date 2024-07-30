import { Config } from "./config.js";
import { HTML } from "./html.js";
import { CSV } from "./csv.js";
import { RarePlants } from "./rareplants.js";
import { Genera } from "./genera.js";
import { TextUtils } from "./textutils.js";
import { Taxon } from "./taxon.js";
import { Families } from "./families.js";

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

/**
 * @type {Object<string,{title:string,data:function (Taxon):string}>}
 */
const TAXA_LIST_COLS = {
    CESA: {
        title: "California",
        data: (t) => RarePlants.getCESADescription(t.getCESA()),
    },
    COMMON_NAME: {
        title: "Common Name",
        data: (t) => t.getCommonNames().join(", "),
    },
    CNPS_RANK: {
        title: "CNPS Rank",
        data: (t) =>
            HTML.getToolTip(
                HTML.textElement("span", t.getRPIRankAndThreat()),
                t.getRPIRankAndThreatTooltip()
            ),
    },
    FESA: {
        title: "Federal",
        data: (t) => RarePlants.getFESADescription(t.getFESA()),
    },
    SPECIES: {
        title: "Species",
        data: (t) => t.getHTMLLink(true, true),
    },
    SPECIES_BARE: {
        title: "Species",
        data: (t) => t.getHTMLLink(true, false),
    },
};

const DEFAULT_COLUMNS = [TAXA_LIST_COLS.SPECIES, TAXA_LIST_COLS.COMMON_NAME];

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
     * @param {string[]|boolean} inclusionList
     * @param {ErrorLog} errorLog
     * @param {boolean} showFlowerErrors
     * @param {Taxon} taxonClass
     */
    constructor(
        inclusionList,
        errorLog,
        showFlowerErrors,
        taxaMeta = {},
        taxonClass = Taxon,
        extraTaxa = [],
        extraSynonyms = []
    ) {
        this.#isSubset = inclusionList !== true;

        this.#errorLog = errorLog;

        for (const color of FLOWER_COLORS) {
            this.#flower_colors[color.name] = new FlowerColor(color.name);
        }

        const dataDir = Config.getPackageDir() + "/data";

        this.#families = new Families();

        const taxaCSV = CSV.parseFile(dataDir, "taxa.csv");
        this.#loadTaxa(
            taxaCSV,
            inclusionList,
            taxaMeta,
            taxonClass,
            showFlowerErrors
        );
        this.#loadTaxa(
            extraTaxa,
            inclusionList,
            taxaMeta,
            taxonClass,
            showFlowerErrors
        );

        // Make sure everything in the inclusionList has been loaded.
        for (const name of Object.keys(inclusionList)) {
            if (!this.getTaxon(name)) {
                this.#errorLog.log(name, "not found in taxon list");
            }
        }

        this.#sortedTaxa = Object.values(this.#taxa).sort((a, b) =>
            a.getName().localeCompare(b.getName())
        );

        const synCSV = CSV.parseFile(dataDir, "synonyms.csv");
        this.#loadSyns(synCSV, inclusionList);
        this.#loadSyns(extraSynonyms, inclusionList);
    }

    /**
     * @param {Taxon[]} taxa
     * @param {TaxaCol[]} columns
     */
    static getHTMLTable(taxa, columns = DEFAULT_COLUMNS) {
        let html = "<table><thead>";
        for (const col of columns) {
            const className = col.class;
            const atts = className !== undefined ? className : {};
            html += HTML.textElement("th", col.title, atts);
        }
        html += "</thead>";
        html += "<tbody>";

        for (const taxon of taxa) {
            html += "<tr>";
            for (const col of columns) {
                const data = col.data(taxon);
                const className = col.class;
                const atts = className !== undefined ? className : {};
                html += HTML.wrap("td", data, atts);
            }
            html += "</tr>";
        }

        html += "</tbody>";
        html += "</table>";

        return html;
    }

    getFamilies() {
        return this.#families;
    }

    getFlowerColors() {
        return Object.values(this.#flower_colors).filter(
            (fc) => fc.getTaxa().length > 0
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
     * @param {*} synCSV
     * @param {*} inclusionList
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
     * @param {true|Object<string,Object<string,string>>} inclusionList
     * @param {Taxon} taxonClass
     * @param {boolean} showFlowerErrors
     */
    #loadTaxa(taxaCSV, inclusionList, taxaMeta, taxonClass, showFlowerErrors) {
        const genera = new Genera(this.#families);
        for (const row of taxaCSV) {
            const name = row["taxon_name"];

            /** @type {Object<string,string>} */
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
            const taxon = new taxonClass(row, genera, taxaMeta[name]);
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
                                name
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
                            "does not have all flower info"
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

class FlowerColor {
    #colorName;
    #colorCode;
    /** @type {Taxon[]} */
    #taxa = [];

    /**
     * @param {string} colorName
     * @param {string} [colorCode]
     */
    constructor(colorName, colorCode) {
        this.#colorName = colorName;
        this.#colorCode = colorCode ? colorCode : colorName;
    }

    /**
     * @param {Taxon} taxon
     */
    addTaxon(taxon) {
        this.#taxa.push(taxon);
    }

    getColorCode() {
        return this.#colorCode;
    }

    getColorName(uc = false) {
        return uc ? TextUtils.ucFirst(this.#colorName) : this.#colorName;
    }

    getFileName() {
        return "list_fc_" + this.#colorName + ".html";
    }

    getTaxa() {
        return this.#taxa;
    }
}

export { Taxa, TAXA_LIST_COLS };

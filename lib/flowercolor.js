import { TextUtils } from "./textutils.js";

export class FlowerColor {
    #colorName;
    #colorCode;
    /** @type {import("./types.js").Taxon[]} */
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
     * @param {import("./types.js").Taxon} taxon
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

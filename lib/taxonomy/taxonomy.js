export class Taxonomy {
    #data;

    /**
     * @param {import("../index.js").TaxonomyData} data
     */
    constructor(data) {
        this.#data = data;
    }

    /**
     * @returns {string}
     */
    getJepsonID() {
        return this.#data["jepson id"];
    }
}

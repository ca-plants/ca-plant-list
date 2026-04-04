export class Taxonomy {
    #jepsonID;

    /**
     * @param {string} jepsonID
     */
    constructor(jepsonID) {
        this.#jepsonID = jepsonID;
    }

    /**
     * @returns {string}
     */
    getJepsonID() {
        return this.#jepsonID;
    }
}

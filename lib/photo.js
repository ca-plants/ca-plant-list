export class Photo {
    /** @type {string?} */
    #url;
    /** @type {string} */
    #rightsHolder;
    /** @type {PhotoRights} */
    #rights;

    /**
     * @param {string?} url
     * @param {string} rightsHolder
     * @param {PhotoRights} rights
     */
    constructor(url, rightsHolder, rights) {
        this.#url = url;
        this.#rightsHolder = rightsHolder;
        this.#rights = rights;
    }

    /**
     * @returns {string}
     */
    getAttribution() {
        if (this.#rights === "CC0") {
            if (this.#rightsHolder) {
                return `By ${this.#rightsHolder} (${this.#rights})`;
            }
            return this.#rights;
        }
        if (this.#rightsHolder) {
            return `(c) ${this.#rightsHolder} (${this.#rights})`;
        }
        return `(c) (${this.#rights})`;
    }

    getUrl() {
        return this.#url;
    }
}

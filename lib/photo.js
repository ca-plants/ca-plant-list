/**
 * @typedef {"CC0" | "CC BY" | "CC BY-NC" | "C" | null} PhotoRights
 * @typedef { "cc-by-nc-sa"
    | "cc-by-nc"
    | "cc-by-nc-nd"
    | "cc-by"
    | "cc-by-sa"
    | "cc-by-nd"
    | "pd"
    | "gdfl"
    | "cc0"} InatLicenseCode
 */

export class Photo {
    #id;
    #ext;
    #rightsHolder;
    /** @type {PhotoRights} */
    #rights;

    /**
     * @param {number} id
     * @param {string} ext
     * @param {InatLicenseCode} licenseCode
     * @param {string} rightsHolder
     */
    constructor(id, ext, licenseCode, rightsHolder) {
        this.#id = id;
        this.#ext = ext;
        this.#rightsHolder = rightsHolder;
        if (licenseCode === "cc0") this.#rights = "CC0";
        else if (licenseCode === "cc-by") this.#rights = "CC BY";
        else if (licenseCode === "cc-by-nc") this.#rights = "CC BY-NC";
        else this.#rights = "C";
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

    getExt() {
        return this.#ext;
    }

    getId() {
        return this.#id;
    }

    /**
     * @returns {string} The URL of the iNaturalist page with details about the image.
     */
    getSourceUrl() {
        return `https://www.inaturalist.org/photos/${this.#id}`;
    }

    /**
     * @returns {string} The URL to retrieve the image file.
     */
    getUrl() {
        return `https://inaturalist-open-data.s3.amazonaws.com/photos/${this.#id}/medium.${this.#ext}`;
    }
}

const CC0 = "CC0";
const CC_BY = "CC BY";
const CC_BY_NC = "CC BY-NC";
const COPYRIGHT = "C";

// type PhotoRights = typeof COPYRIGHT | typeof CC_BY | typeof CC_BY_NC | typeof CC0;

class Photo {
    /** @type {string?} */
    #url;
    /** @type {string?} */
    rightsHolder;
    /** @type {undefined | typeof COPYRIGHT | typeof CC_BY | typeof CC_BY_NC | typeof CC0} */
    rights;

    /**
     * @param {string?} url
     * @param {string?} rightsHolder
     * @param {undefined | typeof COPYRIGHT | typeof CC_BY | typeof CC_BY_NC | typeof CC0} rights
     */
    constructor( url, rightsHolder, rights ) {
        this.#url = url;
        this.rightsHolder = rightsHolder;
        this.rights = rights;
    }

    getUrl() {
        return this.#url;
    }

    /**
     * Return URL of page from whence this photo came
     * @return {string?}
     */
    getSourceUrl() {
        return null;
    }
}

export {
    CC0,
    CC_BY,
    CC_BY_NC,
    COPYRIGHT,
    Photo
};

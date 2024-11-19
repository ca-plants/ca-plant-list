import { CC0, CC_BY, CC_BY_NC, COPYRIGHT, Photo } from "./photo.js";

class InatPhoto extends Photo {
    /** @type {number} */
    inatPhotoId;
    /** @type {string} */
    ext;

    /**
     * @param {number} id
     * @param {string} ext
     * @param {InatLicenseCode} licenseCode
     * @param {string} attrName
     */
    constructor(id, ext, licenseCode, attrName) {
        /** @type {typeof COPYRIGHT | typeof CC_BY | typeof CC_BY_NC | typeof CC0} */
        let rights = COPYRIGHT;
        if (licenseCode === "cc0") rights = CC0;
        else if (licenseCode === "cc-by") rights = CC_BY;
        else if (licenseCode === "cc-by-nc") rights = CC_BY_NC;
        super(null, attrName, rights);
        this.inatPhotoId = id;
        this.ext = ext;
    }

    getExt() {
        return this.ext;
    }

    getId() {
        return this.inatPhotoId;
    }

    getUrl() {
        return `https://inaturalist-open-data.s3.amazonaws.com/photos/${this.inatPhotoId}/medium.${this.ext}`;
    }

    getSourceUrl() {
        return `https://www.inaturalist.org/photos/${this.inatPhotoId}`;
    }
}

export { InatPhoto };

import { Photo } from "./photo.js";

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
        /** @type {PhotoRights} */
        let rights = "C";
        if (licenseCode === "cc0") rights = "CC0";
        else if (licenseCode === "cc-by") rights = "CC BY";
        else if (licenseCode === "cc-by-nc") rights = "CC BY-NC";
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

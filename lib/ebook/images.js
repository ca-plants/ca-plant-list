import * as fs from "node:fs";

import sharp from "sharp";

import { EBook } from "./ebook.js";
import { Files } from "../files.js";

class Images {
    #siteGenerator;
    #contentDir;
    #taxa;
    #photoDirTarget;

    /**
     * @param {SiteGenerator} siteGenerator
     * @param {string} contentDir
     * @param {Taxa} taxa
     */
    constructor(siteGenerator, contentDir, taxa) {
        this.#siteGenerator = siteGenerator;
        this.#contentDir = contentDir;
        this.#taxa = taxa;
        this.#photoDirTarget = this.#contentDir + "/i";
    }

    /**
     * @param {Taxon[]} taxa
     */
    async createImages(taxa) {
        const photoDirSrc = "external_data/photos";
        fs.mkdirSync(photoDirSrc, { recursive: true });
        fs.mkdirSync(this.#photoDirTarget, { recursive: true });

        for (const taxon of taxa) {
            const photos = Images.getTaxonPhotos(taxon);
            for (const photo of photos) {
                const ext = photo.getExt();
                const srcFileName = `${photoDirSrc}/${photo.getId()}${ext ? `.${ext}` : ""}`;

                if (!fs.existsSync(srcFileName)) {
                    // File is not there; retrieve it.
                    console.log("retrieving " + srcFileName);
                    await Files.fetch(photo.getUrl(), srcFileName);
                }

                await sharp(srcFileName)
                    .resize({ width: 300 })
                    .jpeg({ quality: 40 })
                    .toFile(this.getCompressedFilePath(photo));
            }
        }

        this.#siteGenerator.copyIllustrations(this.#taxa.getFlowerColors());
    }

    getManifestEntries() {
        const entries = [];
        const images = Files.getDirEntries(this.#contentDir + "/i").sort();

        for (let index = 0; index < images.length; index++) {
            const fileName = images[index];
            const ext = fileName.split(".")[1];
            entries.push(
                EBook.getManifestEntry(
                    "i" + index,
                    "i/" + fileName,
                    EBook.getMediaTypeForExt(ext),
                ),
            );
        }

        return entries.join("");
    }

    /**
     * @param {Photo} photo
     * @returns {string}
     */
    getCompressedFilePath(photo) {
        return `${this.#contentDir}/${this.getCompressedImagePath(photo)}`;
    }

    /**
     * @param {Photo} photo
     * @returns {string}
     */
    getCompressedImagePath(photo) {
        const ext = photo.getExt().toLowerCase();
        const path = `i/${photo.getId()}`;
        return ext ? `${path}.${ext}` : path;
    }

    /**
     * @param {Taxon} taxon
     * @returns {Photo[]}
     */
    static getTaxonPhotos(taxon) {
        const photos = taxon
            .getPhotos()
            .filter((photo) =>
                ["jpg", "jpeg"].includes(photo.getExt().toLowerCase()),
            );
        return photos.length > 0 ? [photos[0]] : photos;
    }
}

export { Images };

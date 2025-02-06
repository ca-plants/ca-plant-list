import * as fs from "node:fs";

import sharp from "sharp";

import { EBook } from "./ebook.js";
import { Files } from "../files.js";
import { ProgressMeter } from "../progressmeter.js";

class Images {
    #siteGenerator;
    #contentDir;
    #taxa;

    /**
     * @param {import("../sitegenerator.js").SiteGenerator} siteGenerator
     * @param {string} contentDir
     * @param {import("../taxa.js").Taxa} taxa
     */
    constructor(siteGenerator, contentDir, taxa) {
        this.#siteGenerator = siteGenerator;
        this.#contentDir = contentDir;
        this.#taxa = taxa;
    }

    /**
     * @param {import("../taxonomy/taxon.js").Taxon[]} taxa
     */
    async createImages(taxa) {
        const meter = new ProgressMeter("processing photos", taxa.length);

        const width = 300;
        const quality = 40;

        const photoDirSrc = "external_data/photos";
        const photoDirCache = `external_data/photos-${width}-${quality}`;
        [photoDirSrc, photoDirCache, this.#contentDir + "/i"].forEach((dir) =>
            fs.mkdirSync(dir, { recursive: true }),
        );

        let downloadCount = 0;
        let compressCount = 0;
        let copyCount = 0;

        for (let index = 0; index < taxa.length; index++) {
            const taxon = taxa[index];
            const photos = Images.getTaxonPhotos(taxon);
            for (const photo of photos) {
                const ext = photo.getExt();
                const cachedFileName = `${photoDirCache}/${this.getCompressedImageName(photo)}`;

                if (!fs.existsSync(cachedFileName)) {
                    const srcFileName = `${photoDirSrc}/${photo.getId()}.${ext}`;
                    // Compress and cache source file.
                    if (!fs.existsSync(srcFileName)) {
                        // Retrieve original file.
                        if (!fs.existsSync(srcFileName)) {
                            // File is not there; retrieve it.
                            await Files.fetch(photo.getUrl(), srcFileName);
                            downloadCount++;
                        }
                    }
                    await sharp(srcFileName)
                        .resize({ width: width })
                        .jpeg({ quality: quality })
                        .toFile(cachedFileName);
                    compressCount++;
                }

                fs.copyFileSync(
                    cachedFileName,
                    this.getCompressedFilePath(photo),
                );
                copyCount++;
            }
            meter.update(index + 1, {
                custom: ` | ${copyCount} copied - ${compressCount} compressed - ${downloadCount} downloaded`,
            });
        }

        meter.stop();

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
     * @param {import("../photo.js").Photo} photo
     * @returns {string}
     */
    getCompressedFilePath(photo) {
        return `${this.#contentDir}/i/${this.getCompressedImageName(photo)}`;
    }

    /**
     * @param {import("../photo.js").Photo} photo
     * @returns {string}
     */
    getCompressedImageName(photo) {
        return `${photo.getId()}.${photo.getExt().toLowerCase()}`;
    }

    /**
     * @param {import("../taxonomy/taxon.js").Taxon} taxon
     * @returns {import("../photo.js").Photo[]}
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

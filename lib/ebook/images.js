import * as fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { EBook } from "./ebook.js";
import { Config } from "../config.js";
import { CSV } from "../csv.js";
import { Files } from "../files.js";
import { TaxonImage } from "./taxonimage.js";

class Images {
    #siteGenerator;
    #contentDir;
    #taxa;
    /** @type {Object<string,TaxonImage[]>} */
    #images = {};

    /**
     * @param {SiteGenerator} siteGenerator
     * @param {string} contentDir
     * @param {Taxa} taxa
     */
    constructor(siteGenerator, contentDir, taxa) {
        this.#siteGenerator = siteGenerator;
        this.#contentDir = contentDir;
        this.#taxa = taxa;
    }

    async createImages() {
        const photoDirSrc = "external_data/photos";
        const imagePrefix = "i";
        const photoDirTarget = this.#contentDir + "/" + imagePrefix;
        fs.mkdirSync(photoDirSrc, { recursive: true });
        fs.mkdirSync(photoDirTarget, { recursive: true });

        const rows = CSV.parseFile(
            Config.getPackageDir() + "/data",
            "photos.csv"
        );
        for (const row of rows) {
            const name = row["taxon_name"];
            const taxon = this.#taxa.getTaxon(name);
            if (!taxon) {
                continue;
            }

            let imageList = this.#images[name];
            if (!imageList) {
                imageList = [];
                this.#images[name] = imageList;
            }

            const src = new URL(row["source"]);
            const parts = path.parse(src.pathname).dir.split("/");
            const prefix = src.host.includes("calflora") ? "cf-" : "inat-";
            const filename = prefix + parts.slice(-1)[0] + ".jpg";
            const srcFileName = photoDirSrc + "/" + filename;
            const targetFileName = photoDirTarget + "/" + filename;

            if (!fs.existsSync(srcFileName)) {
                // File is not there; retrieve it.
                console.log("retrieving " + srcFileName);
                await Files.fetch(src, srcFileName);
            }

            await sharp(srcFileName)
                .resize({ width: 300 })
                .jpeg({ quality: 40 })
                .toFile(targetFileName);

            imageList.push(
                new TaxonImage(imagePrefix + "/" + filename, row["credit"])
            );
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
                    EBook.getMediaTypeForExt(ext)
                )
            );
        }

        return entries.join("");
    }

    /**
     * @param {string} name
     */
    getTaxonImages(name) {
        return this.#images[name];
    }
}

export { Images };

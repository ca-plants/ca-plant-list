import { optimize } from "svgo-ll";

import { Config } from "./config.js";
import { Files } from "./files.js";
import path from "node:path";

export class SiteGenerator {
    #baseDir;

    /**
     * @param {string} baseDir
     */
    constructor(baseDir) {
        this.#baseDir = baseDir;
    }

    copyGeneratorFiles() {
        throw new Error("must be implemented by subclass");
    }

    /**
     * @param {import("./flowercolor.js").FlowerColor[]} flowerColors
     */
    copyIllustrations(flowerColors) {
        /**
         * @param {string} outputDir
         * @param {import("./flowercolor.js").FlowerColor[]} flowerColors
         */
        function createFlowerColorIcons(outputDir, flowerColors) {
            // Read generic input.
            const inputFileName = Files.join(outputDir, "flower.svg");
            const srcSVG = Files.read(inputFileName);
            for (const color of flowerColors) {
                Files.write(
                    Files.join(outputDir, "f-" + color.getColorName() + ".svg"),
                    srcSVG.replace("#ff0", color.getColorCode()),
                );
            }
            // Delete input file.
            Files.rmDir(inputFileName);
        }

        /**
         * @param {string} outputDir
         */
        function optimizeSVG(outputDir) {
            const srcDir =
                Config.getPackageDir() + "/data/illustrations/inkscape";
            const entries = Files.getDirEntries(srcDir);
            for (const entry of entries) {
                const srcFile = Files.join(srcDir, entry);
                const srcSVG = Files.read(srcFile);
                const result = optimize(srcSVG, {
                    plugins: ["preset-default", "removeDimensions"],
                });
                Files.write(Files.join(outputDir, entry), result.data);
            }
        }

        const outputDir = Files.join(this.#baseDir, "i");
        Files.mkdir(outputDir);

        optimizeSVG(outputDir);
        createFlowerColorIcons(outputDir, flowerColors);
    }

    copyStaticFiles() {
        // First copy default files from ca-plant-list.
        Files.copyDir(
            path.join(Config.getPackageDir(), "static"),
            this.#baseDir,
        );
        // Then copy files from current directory (which may override default files).
        Files.copyDir("./static", this.#baseDir);
    }

    getBaseDir() {
        return this.#baseDir;
    }

    /**
     * @param {Object<string,string|undefined>} atts
     * @returns {string}
     */
    // eslint-disable-next-line no-unused-vars
    getFrontMatter(atts) {
        return "";
    }

    /**
     * @param {string} path
     */
    mkdir(path) {
        Files.mkdir(Files.join(this.#baseDir, path));
    }

    /**
     * @param {string} content
     * @param {{title:string}} attributes
     * @param {string} filename
     */
    // eslint-disable-next-line no-unused-vars
    writeTemplate(content, attributes, filename) {
        throw new Error("must be implemented by subclass");
    }
}

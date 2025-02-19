import path from "node:path";
import { optimize } from "svgo-ll";

import { Config } from "./config.js";
import { Files } from "./files.js";

const FRONT_DELIM = "---";

export class SiteGenerator {
    #config;
    #baseDir;

    /**
     * @param {Config} config
     * @param {string} baseDir
     */
    constructor(config, baseDir) {
        this.#config = config;
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
            const inputFileName = path.join(outputDir, "flower.svg");
            const srcSVG = Files.read(inputFileName);
            for (const color of flowerColors) {
                Files.write(
                    path.join(outputDir, "f-" + color.getColorName() + ".svg"),
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

    /**
     * @param {string} webDir
     */
    // eslint-disable-next-line no-unused-vars
    async generate(webDir) {
        throw new Error("must be implemented by subclass");
    }

    getBaseDir() {
        return this.#baseDir;
    }

    getConfig() {
        return this.#config;
    }

    /**
     * @param {Object<string,string|undefined>} atts
     */
    getFrontMatter(atts) {
        const lines = [FRONT_DELIM];
        for (const [k, v] of Object.entries(atts)) {
            if (v) {
                lines.push(k + ': "' + v + '"');
            }
        }
        lines.push(FRONT_DELIM);
        return lines.join("\n") + "\n\n";
    }

    /**
     * @param {string} outputSubdir
     */
    mkdir(outputSubdir) {
        Files.mkdir(path.join(this.#baseDir, outputSubdir));
    }

    /**
     * @param {string} content
     * @param {Object<string,string>} attributes
     * @param {string} filename
     */
    writeTemplate(content, attributes, filename) {
        Files.write(
            path.join(this.getBaseDir(), filename),
            this.getFrontMatter(attributes) + content,
        );
    }
}

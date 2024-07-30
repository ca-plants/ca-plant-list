import { optimize } from "svgo";

import { Config } from "./config.js";
import { Files } from "./files.js";

class SiteGenerator {
    #baseDir;

    /**
     * @param {string} baseDir
     */
    constructor(baseDir) {
        this.#baseDir = baseDir;
    }

    /**
     * @param {FlowerColor[]} flowerColors
     */
    copyIllustrations(flowerColors) {
        /**
         * @param {string} outputDir
         * @param {FlowerColor[]} flowerColors
         */
        function createFlowerColorIcons(outputDir, flowerColors) {
            // Read generic input.
            const inputFileName = Files.join(outputDir, "flower.svg");
            const srcSVG = Files.read(inputFileName);
            for (const color of flowerColors) {
                Files.write(
                    Files.join(outputDir, "f-" + color.getColorName() + ".svg"),
                    srcSVG.replace("#ff0", color.getColorCode())
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
                    plugins: [
                        {
                            name: "preset-default",
                            params: {
                                overrides: {
                                    // minifyStyles changes font-weight: normal to 400, which keeps it from being removed as a default.
                                    // Disable it here and run it last.
                                    minifyStyles: false,
                                    removeViewBox: false,
                                },
                            },
                        },
                        "convertStyleToAttrs",
                        {
                            name: "removeAttrs",
                            params: {
                                attrs: "(style)",
                            },
                        },
                        "removeDimensions",
                        "minifyStyles",
                    ],
                    multipass: true,
                });
                Files.write(Files.join(outputDir, entry), result.data);
            }
        }

        const outputDir = Files.join(this.#baseDir, "i");
        Files.mkdir(outputDir);

        optimizeSVG(outputDir);
        createFlowerColorIcons(outputDir, flowerColors);
    }

    getBaseDir() {
        return this.#baseDir;
    }

    /**
     * @param {string} path
     */
    mkdir(path) {
        Files.mkdir(Files.join(this.#baseDir, path));
    }
}

export { SiteGenerator };

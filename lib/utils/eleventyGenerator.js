// @ts-ignore
import { Eleventy } from "@11ty/eleventy";
import { SiteGenerator } from "../sitegenerator.js";
import path from "node:path";
import { Files } from "../files.js";
import { Config } from "../config.js";

export class EleventyGenerator extends SiteGenerator {
    copyGeneratorFiles() {
        // First copy default files from package.
        const layoutSrc = "./generators/eleventy/layouts";
        const commonSrc = "./generators/_includes";
        const dest = path.join(this.getBaseDir(), "_includes");

        Files.copyDir(path.join(Config.getPackageDir(), commonSrc), dest);
        Files.copyDir(path.join(Config.getPackageDir(), layoutSrc), dest);

        // Then copy files from current dir (which may override default files).
        if (Files.isDir(commonSrc)) {
            Files.copyDir(commonSrc, dest);
        }
        if (Files.isDir(layoutSrc)) {
            Files.copyDir(layoutSrc, dest);
        }
    }

    /**
     * @param {string} webDir
     */
    async generate(webDir) {
        const srcDir = this.getBaseDir();
        const config = this.getConfig();
        const generator = this;
        let elev = new Eleventy(srcDir, webDir, {
            quietMode: true,
            config:
                // @ts-ignore
                function (eleventyConfig) {
                    // Not running in project root, so using .gitignore will break things.
                    eleventyConfig.setUseGitIgnore(false);

                    // Don't change file system structure when writing output files.
                    eleventyConfig.addGlobalData("permalink", () => {
                        // @ts-ignore
                        return (data) => {
                            // Include directories in the generated content.
                            const inputPath = path.relative(
                                srcDir,
                                data.page.inputPath,
                            );
                            // Remove the file extension.
                            const parsed = path.parse(inputPath);
                            return path.join(parsed.dir, `${parsed.name}.html`);
                        };
                    });

                    // Use layout with <h1> by default.
                    eleventyConfig.addGlobalData("layout", "h1.njk");

                    // Set site name for use in nav bar.
                    eleventyConfig.addGlobalData(
                        "siteName",
                        config.getSiteName(),
                    );

                    const passThroughPatterns = [
                        "assets",
                        "i",
                        "calflora_list_*.txt",
                        "inat_list_*.txt",
                        "errors.tsv",
                        ...generator.getPassThroughPatterns(),
                    ];
                    for (const pattern of passThroughPatterns) {
                        eleventyConfig.addPassthroughCopy(
                            // Eleventy apparently can't handle windows paths in globs, so change it.
                            path.join(srcDir, pattern).replaceAll("\\", "/"),
                        );
                    }
                },
        });
        await elev.write();
    }
}

import path from "node:path";
import { Config } from "./config.js";
import { Files } from "./files.js";
import { GlossaryPages } from "./web/glossarypages.js";
import { PageFamilyList } from "./web/pageFamily.js";

export class BasePageRenderer {
    /**
     * @param {import("./types.js").SiteGenerator} siteGenerator
     * @param {import("./types.js").Taxa} taxa
     * @param {import("./types.js").TaxaColDef[]} [familyCols]
     */
    static renderBasePages(siteGenerator, taxa, familyCols) {
        const outputDir = siteGenerator.getBaseDir();

        // Copy static files
        // First copy default Jekyll files from package.
        Files.copyDir(Config.getPackageDir() + "/jekyll", outputDir);
        // Then copy Jekyll files from current dir (which may override default files).
        Files.copyDir("jekyll", outputDir);

        // Copy illustrations.
        siteGenerator.copyIllustrations(taxa.getFlowerColors());

        const fl = new PageFamilyList(
            siteGenerator,
            taxa.getFamilies().getFamilies(),
        );
        fl.render(familyCols);
        fl.renderPages(siteGenerator, familyCols);

        new GlossaryPages(siteGenerator).renderPages();

        this.renderTools(outputDir, taxa);
    }

    /**
     * @param {string} outputDir
     * @param {import("./types.js").Taxa} taxa
     */
    static renderTools(outputDir, taxa) {
        const names = [];
        for (const taxon of taxa.getTaxonList()) {
            /** @type {(import("./types.js").NameSearchData)} */
            const row = { t: taxon.getName() };
            const cn = taxon.getCommonNames().join(", ");
            if (cn) {
                row.c = cn;
            }
            const synonyms = [];
            for (const syn of taxon.getSynonyms()) {
                synonyms.push(syn);
            }
            if (synonyms.length > 0) {
                row.s = synonyms;
            }
            names.push(row);
        }

        Files.write(
            path.join(outputDir, "./assets/js/nameSearchData.js"),
            `export const NAMES = ${JSON.stringify(names)};`,
            true,
        );
    }
}

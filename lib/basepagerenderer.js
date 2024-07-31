import { Config } from "./config.js";
import { Files } from "./files.js";
import { Jekyll } from "./jekyll.js";
import { GlossaryPages } from "./web/glossarypages.js";

class BasePageRenderer {
    /**
     * @param {string} outputDir
     * @param {Taxa} taxa
     * @param {TaxaCol[]} [familyCols]
     */
    static renderBasePages(outputDir, taxa, familyCols) {
        const siteGenerator = new Jekyll(outputDir);

        // Copy static files
        // First copy default Jekyll files from package.
        Files.copyDir(Config.getPackageDir() + "/jekyll", outputDir);
        // Then copy Jekyll files from current dir (which may override default files).
        Files.copyDir("jekyll", outputDir);

        // Copy illustrations.
        siteGenerator.copyIllustrations(taxa.getFlowerColors());

        taxa.getFamilies().renderPages(outputDir, familyCols);

        new GlossaryPages(siteGenerator).renderPages();

        this.renderTools(outputDir, taxa);
    }

    /**
     * @param {string} outputDir
     * @param {Taxa} taxa
     */
    static renderTools(outputDir, taxa) {
        const names = [];
        for (const taxon of taxa.getTaxonList()) {
            const row = [];
            row.push(taxon.getName());
            const cn = taxon.getCommonNames().join(", ");
            if (cn) {
                row.push(cn);
            }
            const synonyms = [];
            for (const syn of taxon.getSynonyms()) {
                synonyms.push(syn);
            }
            if (synonyms.length > 0) {
                row[2] = synonyms;
            }
            names.push(row);
        }

        Files.write(outputDir + "/_includes/names.json", JSON.stringify(names));
    }
}

export { BasePageRenderer };

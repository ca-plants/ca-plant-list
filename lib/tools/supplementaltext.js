import { Files } from "../files.js";

const VALID_EXTENSIONS = new Set(["md", "footer.md"]);

export class SupplementalText {
    /**
     *
     * @param {import("../taxa.js").Taxa} taxa
     * @param {import("../errorlog.js").ErrorLog} errorLog
     */
    static analyze(taxa, errorLog) {
        /**
         * @param {string} fileName
         */
        function fileNameToTaxonName(fileName) {
            const parts = fileName.split(".");
            const ext = parts.slice(1).join(".");
            const taxonName = parts[0]
                .replace("-", " ")
                .replace("-var-", " var. ")
                .replace("-subsp-", " subsp. ");
            return { taxonName: taxonName, ext: ext };
        }

        const dirName = "data/text";

        if (!Files.isDir(dirName)) {
            return;
        }

        const entries = Files.getDirEntries(dirName);
        for (const entry of entries) {
            const parsed = fileNameToTaxonName(entry);
            const taxon = taxa.getTaxon(parsed.taxonName);
            if (!taxon) {
                errorLog.log(dirName + "/" + entry, "not found in taxa.csv");
            }
            if (!VALID_EXTENSIONS.has(parsed.ext)) {
                errorLog.log(dirName + "/" + entry, "has invalid extension");
            }
        }
    }
}

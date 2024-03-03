import { GenericTaxaLoader } from "./generictaxaloader.js";
import { CSV, Files, Taxa } from "./index.js";

class TaxaLoader extends GenericTaxaLoader {
    /**
     * @param {*} options
     */
    constructor(options) {
        super(options);
    }

    /**
     * @return {Promise<Taxa>}
     */
    async loadTaxa() {
        /**
         *
         * @param {string} dataDir
         * @returns
         */
        function getIncludeList(dataDir) {
            // Read inclusion list.
            const includeFileName = "taxa_include.csv";
            const includeFilePath = dataDir + "/" + includeFileName;
            if (!Files.exists(includeFilePath)) {
                console.log(includeFilePath + " not found; loading all taxa");
                return true;
            }
            /**@type { import("./index.js").TaxonData[]} */
            const includeCSV = CSV.parseFile(dataDir, includeFileName);
            /** @type {Object<string,import("./index.js").TaxonData>} */
            const include = {};
            for (const row of includeCSV) {
                include[row["taxon_name"]] = row;
            }
            return include;
        }

        const options = this.getOptions();
        return new Taxa(
            getIncludeList(options.datadir),
            this.getErrorLog(),
            options["show-flower-errors"]
        );
    }
}

export { TaxaLoader };

import { Command } from "commander";
import { Files } from "./files.js";
import { CSV } from "./csv.js";

class Program {
    /**
     * @param {string} dataDir
     */
    static getIncludeList(dataDir) {
        // Read inclusion list.
        const includeFileName = "taxa_include.csv";
        const includeFilePath = dataDir + "/" + includeFileName;
        if (!Files.exists(includeFilePath)) {
            console.log(includeFilePath + " not found; loading all taxa");
            return true;
        }
        const includeCSV = CSV.parseFile(dataDir, includeFileName);
        /** @type {Object<string,TaxonData>} */
        const include = {};
        for (const row of includeCSV) {
            include[row["taxon_name"]] = row;
        }
        return include;
    }

    static getProgram() {
        const program = new Command();
        program
            .option(
                "-d, --datadir <dir>",
                "directory containing plant data",
                "./data"
            )
            .option(
                "-f, --show-flower-errors",
                "include missing flower color/flowering time in error log"
            )
            .option(
                "-o, --outputdir <dir>",
                "directory to which output should be written",
                "./output"
            );
        return program;
    }
}

export { Program };

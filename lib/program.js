import { Command } from "commander";
import { Files } from "./files.js";
import { CSV } from "./csv.js";
import path from "node:path";

/**
 * @typedef {{
    datadir: string;
    outputdir: string;
    "show-flower-errors": boolean;
}} CommandLineOptions
 */

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

        /** @type {import("./index.js").TaxonData[]} */
        // @ts-ignore
        const includeCSV = CSV.readFile(path.join(dataDir, includeFileName));
        /** @type {Object<string,import("./index.js").TaxonData>} */
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
                "The directory containing plant data.",
                "./data",
            )
            .option(
                "-f, --show-flower-errors",
                "Include missing flower color/flowering time in the error log when loading taxa.",
            )
            .option(
                "-o, --outputdir <dir>",
                "The directory to which output should be written.",
                "./output",
            );
        return program;
    }
}

export { Program };

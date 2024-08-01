#!/usr/bin/env node

import { Command } from "commander";
import { Config } from "../lib/config.js";
import { CSV, ErrorLog, Files, PlantBook, Taxa } from "../lib/index.js";

const program = new Command();

program
    .option("-d, --datadir <dir>", "directory containing plant data", "./data")
    .option(
        "-f, --show-flower-errors",
        "include missing flower color/flowering time in error log"
    )
    .option("-l, --locationsdir <dir>", "directory containing location data")
    .option(
        "-o, --outputdir <dir>",
        "directory to which output should be written",
        "./output"
    )
    .action(build);

await program.parseAsync();

/**
 * @param {import("commander").OptionValues} options
 */
async function build(options) {
    const locationsDir = options.locationsdir;

    // If there is a "locations" directory, generate a book for all subdirectories.
    if (locationsDir) {
        // Generate ebook for each location.
        const outputBase = options.outputdir;
        const subdirs = Files.getDirEntries(locationsDir);
        for (const subdir of subdirs) {
            console.log("Generating " + subdir);
            const suffix = "/" + subdir;
            const path = locationsDir + suffix;
            if (Files.isDir(path)) {
                await buildBook(
                    outputBase + suffix,
                    path,
                    options.showFlowerErrors
                );
            }
        }
    } else {
        // Otherwise use the default directory.
        await buildBook(
            options.outputdir,
            options.datadir,
            options.showFlowerErrors
        );
    }
}

/**
 * @param {string} outputDir
 * @param {string} dataDir
 * @param {boolean} showFlowerErrors
 */
async function buildBook(outputDir, dataDir, showFlowerErrors) {
    /**
     * @param {string} dataDir
     */
    function getIncludeList(dataDir) {
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

    const errorLog = new ErrorLog(outputDir + "/errors.tsv");

    const taxa = new Taxa(getIncludeList(dataDir), errorLog, showFlowerErrors);

    const config = new Config(dataDir);
    const ebook = new PlantBook(outputDir, config, taxa);
    await ebook.create();
    errorLog.write();
}

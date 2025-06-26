#!/usr/bin/env node

import { Config } from "../lib/config.js";
import { ErrorLog } from "../lib/errorlog.js";
import { Files } from "../lib/files.js";
import { PlantBook } from "../lib/ebook/plantbook.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxonomy/taxa.js";

const program = Program.getProgram();
program.option(
    "-l, --locationsdir <dir>",
    "directory containing location data",
);
program.option("--max-taxa <number>", "maximum number of taxa to include");
program.action(build);

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
                    options.showFlowerErrors,
                    options.maxTaxa,
                );
            }
        }
    } else {
        // Otherwise use the default directory.
        await buildBook(
            options.outputdir,
            options.datadir,
            options.showFlowerErrors,
            options.maxTaxa,
        );
    }
}

/**
 * @param {string} outputDir
 * @param {string} dataDir
 * @param {boolean} showFlowerErrors
 * @param {number|undefined} maxTaxa
 */
async function buildBook(outputDir, dataDir, showFlowerErrors, maxTaxa) {
    const errorLog = new ErrorLog(outputDir + "/errors.tsv");

    const taxa = new Taxa(
        Program.getIncludeList(dataDir),
        errorLog,
        showFlowerErrors,
    );

    const config = new Config(dataDir);
    const ebook = new PlantBook(outputDir, config, taxa, maxTaxa);
    await ebook.create();
    errorLog.write();
}

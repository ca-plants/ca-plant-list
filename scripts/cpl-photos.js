#!/usr/bin/env node

import path from "path";
import { ErrorLog } from "../lib/errorlog.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxa.js";
import { Argument } from "commander";

const OPT_LOADER = "loader";

const MAX_PHOTOS = 5;

/**
 * @param {import("commander").OptionValues} options
 * @param {string} type
 * @param {import("commander").OptionValues} cmdOptions
 */
async function check(options, type, cmdOptions) {
    const taxa = await getTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);

    switch (type) {
        case "numphotos":
            checkNumPhotos(errorLog, taxa, cmdOptions.minphotos);
            break;
        default:
            throw new Error(`invalid check type: ${type}`);
    }

    errorLog.write();
}

/**
 * @param {ErrorLog} errorLog
 * @param {Taxa} taxa
 * @param {number|undefined} minPhotos
 */
function checkNumPhotos(errorLog, taxa, minPhotos) {
    for (const taxon of taxa.getTaxonList()) {
        const photos = taxon.getPhotos();
        if (
            minPhotos === undefined
                ? photos.length !== MAX_PHOTOS
                : photos.length < minPhotos
        ) {
            errorLog.log(taxon.getName(), photos.length.toString());
        }
    }
}

/**
 * @param {import("commander").OptionValues} options
 * @return {Promise<Taxa>}
 */
async function getTaxa(options) {
    const errorLog = new ErrorLog(options.outputdir + "/errors.tsv", true);

    const loader = options[OPT_LOADER];
    let taxa;
    if (loader) {
        const taxaLoaderClass = await import("file:" + path.resolve(loader));
        taxa = await taxaLoaderClass.TaxaLoader.loadTaxa(options, errorLog);
    } else {
        taxa = new Taxa(
            Program.getIncludeList(options.datadir),
            errorLog,
            options.showFlowerErrors,
        );
    }

    errorLog.write();
    return taxa;
}

/**
 * @param {import("commander").OptionValues} options
 * @param {string} type
 */
async function update(options, type) {
    console.log(options);
    console.log(type);
}

const program = Program.getProgram();
program
    .command("check")
    .description("Check photo file for problems.")
    .addArgument(
        new Argument("<type>", "Type of check to perform.").choices([
            "numphotos",
        ]),
    )
    .option(
        "--minphotos <number>",
        "Minimum number of photos. Taxa with fewer than this number will be listed.",
    )
    .action((type, options) => check(program.opts(), type, options));
if (process.env.npm_package_name === "@ca-plant-list/ca-plant-list") {
    // Only allow updates in ca-plant-list.
    program
        .command("update <type>")
        .action((type) => update(program.opts(), type));
}
program.option(
    "--loader <path>",
    "The path (relative to the current directory) of the JavaScript file containing the TaxaLoader class. If not provided, the default TaxaLoader will be used.",
);
await program.parseAsync();

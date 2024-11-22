#!/usr/bin/env node

import path from "path";
import { ErrorLog } from "../lib/errorlog.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxa.js";

const OPT_LOADER = "loader";

const MAX_PHOTOS = 5;

/**
 * @param {import("commander").Command} program
 * @param {import("commander").OptionValues} options
 */
async function photos(program, options) {
    const taxa = await getTaxa(options);
    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);

    auditTaxaWithoutMaxPhotos(errorLog, taxa);

    errorLog.write();
}

/**
 * @param {ErrorLog} errorLog
 * @param {Taxa} taxa
 */
function auditTaxaWithoutMaxPhotos(errorLog, taxa) {
    for (const taxon of taxa.getTaxonList()) {
        const photos = taxon.getPhotos();
        if (photos.length !== MAX_PHOTOS) {
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

const program = Program.getProgram();
program.option(
    "--loader <path>",
    "The path (relative to the current directory) of the JavaScript file containing the TaxaLoader class. If not provided, the default TaxaLoader will be used.",
);
program.action((options) => photos(program, options));
await program.parseAsync();

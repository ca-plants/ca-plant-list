#!/usr/bin/env node

import { PlantBook } from "@ca-plant-list/ca-plant-list";
import { Config } from "../lib/config.js";
import { Files } from "../lib/files.js";
import { TaxaProcessor } from "../lib/taxaprocessor.js";
import { CommandProcessor } from "../lib/commandprocessor.js";

const OPTION_DEFS = [{ name: "locationsdir", type: String }];

const OPTION_HELP = [
    {
        name: "locationsdir",
        type: String,
        typeLabel: "{underline path}",
        description:
            "If this option is specified, multiple ebooks will be generated. {bold locationsdir} must be a subdirectory" +
            " of the current directory, and each subdirectory of {bold locationsdir} is processed in turn to generate an ebook." +
            " Each ebook is placed in a subdirectory of {bold outputdir}.",
    },
];

class BookCommand extends CommandProcessor {
    constructor() {
        super(
            "ca-plant-book",
            "A tool to generate an ebook with local plant data.",
            OPTION_DEFS,
            OPTION_HELP
        );
    }
}

/**
 * @param {TaxaProcessor} tp
 */
async function commandRunner(tp) {
    const options = tp.getOptions();
    const ebook = new PlantBook(
        options.outputdir,
        new Config(options.datadir),
        tp.getTaxa()
    );
    await ebook.create();
}

async function generateEBooks(options) {
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
                options.datadir = path;
                options.outputdir = outputBase + suffix;
                const gen = new TaxaProcessor(options);
                await gen.process(commandRunner);
            }
        }
    } else {
        // Otherwise use the default directory.
        const gen = new TaxaProcessor(options);
        await gen.process(commandRunner);
    }
}

const cmd = new BookCommand();
const options = cmd.getOptions();
if (!options.help) {
    await generateEBooks(options);
}

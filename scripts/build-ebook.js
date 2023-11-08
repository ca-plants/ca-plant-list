#!/usr/bin/env node

import { CommandRunner, PlantBook } from "@ca-plant-list/ca-plant-list";
import { DataLoader } from "../lib/dataloader.js";
import { Config } from "../lib/config.js";
import { Files } from "../lib/files.js";

const OUTPUT_DIR = "./output";
const LOC_DIR = "./locations";

const OPTION_DEFS = [
    { name: "datadir", type: String },
];

const OPTION_HELP = [
    {
        name: "datadir",
        type: String,
        typeLabel: "{underline path}",
        description: "The directory in which the data files for the local plant list are located. If no directory is specified:\n"
            + "- if there is a {bold locations} subdirectory in the current directory, each subdirectory of the {bold locations} subdirectory"
            + " will be used as the data directory from which to generate an ebook (multiple ebooks will be generated)\n"
            + "- otherwise {bold ./data} will be used as the {bold datadir}"
    },
];

const cr = new CommandRunner(
    "ca-plant-book",
    "A tool to generate an ebook with local plant data.",
    OPTION_DEFS,
    OPTION_HELP,
    undefined,
    generateEBooks,
);
await cr.processCommandLine();

async function generateEBooks( options ) {

    const dataDir = options.datadir;

    // If a data directory was specified, use it.
    if ( dataDir ) {
        await generateEBook( options );
        return;
    }

    // If there is a "locations" directory, generate a book for all subdirectories.
    const hasLocations = Files.isDir( LOC_DIR );
    if ( hasLocations ) {
        // Generate ebook for each location.
        const subdirs = Files.getDirEntries( LOC_DIR );
        for ( const subdir of subdirs ) {
            const suffix = "/" + subdir;
            const path = LOC_DIR + suffix;
            if ( Files.isDir( path ) ) {
                options.datadir = path;
                await generateEBook( options, suffix );
            }
        }
        return;
    }

    // Otherwise use the default directory.
    options.datadir = "./data";
    await generateEBook( options );

}

async function generateEBook( options, outputSuffix = "" ) {
    const ebook = new PlantBook( OUTPUT_DIR + outputSuffix, new Config( options.datadir ), DataLoader.load( options ) );
    await ebook.create();
    DataLoader.writeErrorLog();
}


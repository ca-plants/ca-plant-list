#!/usr/bin/env node

import commandLineArgs from "command-line-args";
import { PlantBook } from "@ca-plant-list/ca-plant-list";
import { DataLoader } from "../lib/dataloader.js";
import { Config } from "../lib/config.js";
import { Files } from "../lib/files.js";
import { ErrorLog } from "../lib/errorlog.js";

const OUTPUT_DIR = "./output";
const LOC_DIR = "./locations";

const options = commandLineArgs( DataLoader.getOptionDefs() );

await generateEBooks( options.datadir );

ErrorLog.write( OUTPUT_DIR + "/errors.tsv" );

async function generateEBooks( dataDir ) {

    // If a data directory was specified, use it.
    if ( dataDir ) {
        await generateEBook( dataDir );
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
                await generateEBook( path, suffix );
            }
        }
        return;
    }

    // Otherwise use the default directory.
    await generateEBook( "./data" );

}

async function generateEBook( dataDir, outputSuffix = "" ) {
    const ebook = new PlantBook( OUTPUT_DIR + outputSuffix, new Config( dataDir ), DataLoader.load( dataDir ) );
    await ebook.create();
}
#!/usr/bin/env node

import { Config } from "../lib/config.js";
import { DataLoader } from "../lib/dataloader.js";
import { PageRenderer } from "../lib/pagerenderer.js";
import { CommandRunner } from "../lib/commandrunner.js";
import { ErrorLog } from "../lib/errorlog.js";

const OUTPUT_DIR = "./output";

const OPTION_DEFS = [
    { name: "datadir", type: String, defaultValue: "./data" },
];

const OPTION_HELP = [
    {
        name: "datadir",
        type: String,
        typeLabel: "{underline path}",
        description: "The directory in which the data files for the local plant list are located. Defaults to {bold ./data}."

    },
];

const cr = new CommandRunner(
    "ca-plant-list",
    "A tool to generate a website with local plant data.",
    OPTION_DEFS,
    OPTION_HELP,
    undefined,
    generateSite,
);
await cr.processCommandLine();

function generateSite( options ) {
    const dataDir = options.datadir;
    PageRenderer.render( OUTPUT_DIR, new Config( dataDir ), DataLoader.load( dataDir ) );
    ErrorLog.write( OUTPUT_DIR + "/errors.tsv" );
}


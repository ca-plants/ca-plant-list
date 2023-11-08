#!/usr/bin/env node

import * as child_process from "node:child_process";
import * as path from "node:path";
import { Files } from "@ca-plant-list/ca-plant-list";
import { Config } from "../lib/config.js";
import { DataLoader } from "../lib/dataloader.js";
import { PageRenderer } from "../lib/pagerenderer.js";
import { CommandRunner } from "../lib/commandrunner.js";

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

class JekyllRenderer {

    #srcDir = "./output";
    #destDir = "./public";

    async renderPages() {

        function addConfigFile( configFiles, dir, name ) {
            const fullPath = path.join( dir, name );
            if ( Files.exists( fullPath ) ) {
                configFiles.push( fullPath );
            }
        }

        // Remove existing files.
        Files.rmDir( this.#destDir );

        const options = [ "--source", this.#srcDir, "--destination", this.#destDir ];

        // Find out what config files are available.
        const configFiles = [];
        addConfigFile( configFiles, this.#srcDir, "_config.yml" );
        addConfigFile( configFiles, this.#srcDir, "_config-local.yml" );
        addConfigFile( configFiles, ".", "_config-dev.yml" );
        options.push( "--config", "\"" + configFiles.join() + "\"" );

        const result = child_process.execSync( "bundle exec jekyll build " + options.join( " " ) );
        console.log( result.toString() );
    }

}

const cr = new CommandRunner(
    "ca-plant-list",
    "A tool to generate a website with local plant data.",
    OPTION_DEFS,
    OPTION_HELP,
    undefined,
    generateSite,
);
await cr.processCommandLine();

async function generateSite( options ) {
    const dataDir = options.datadir;
    PageRenderer.render( OUTPUT_DIR, new Config( dataDir ), DataLoader.load( options ) );
    DataLoader.writeErrorLog();

    console.log( "generating site" );
    const r = new JekyllRenderer();
    await r.renderPages();
}


#!/usr/bin/env node

import { Config } from "./lib/config.js";
import { DataLoader } from "./lib/dataloader.js";
import { ErrorLog } from "./lib/errorlog.js";
import { PageRenderer } from "./lib/pagerenderer.js";
import commandLineArgs from "command-line-args";

const OPTION_DEFS = [
    { name: "datadir", type: String, defaultValue: "./data" },
];

const options = commandLineArgs( OPTION_DEFS );

const TAXA_DATA_DIR = options.datadir;
const CONFIG_DATA_DIR = "./data";
const OUTPUT_DIR = "./output";

Config.init( CONFIG_DATA_DIR );
DataLoader.load( TAXA_DATA_DIR );
PageRenderer.render( OUTPUT_DIR );

ErrorLog.write( OUTPUT_DIR + "/errors.txt" );

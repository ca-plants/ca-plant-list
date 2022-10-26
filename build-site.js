#!/usr/bin/env node

import * as path from "node:path";
import * as url from "node:url";
import { Config } from "./lib/config.js";
import { DataLoader } from "./lib/dataloader.js";
import { ErrorLog } from "./lib/errorlog.js";
import { PageRenderer } from "./lib/pagerenderer.js";
import commandLineArgs from "command-line-args";

const OPTION_DEFS = [
    { name: "data", type: String, defaultValue: "./data" },
];

const options = commandLineArgs( OPTION_DEFS );

const TAXA_DATA_DIR = options.data;
const CONFIG_DATA_DIR = "./data";
const PACKAGE_DIR = path.dirname( url.fileURLToPath( import.meta.url ) );
const DEFAULT_DATA_DIR = PACKAGE_DIR + "/data";
const OUTPUT_DIR = "./output";

Config.init( CONFIG_DATA_DIR );
DataLoader.load( TAXA_DATA_DIR, DEFAULT_DATA_DIR );
PageRenderer.render( PACKAGE_DIR, OUTPUT_DIR );

ErrorLog.write( OUTPUT_DIR + "/errors.txt" );

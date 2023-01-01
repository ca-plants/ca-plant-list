#!/usr/bin/env node

import { Config } from "./lib/config.js";
import { DataLoader } from "./lib/dataloader.js";
import { ErrorLog } from "./lib/errorlog.js";
import { PageRenderer } from "./lib/pagerenderer.js";
import commandLineArgs from "command-line-args";

const options = commandLineArgs( DataLoader.getOptionDefs() );

const CONFIG_DATA_DIR = "./data";
const OUTPUT_DIR = "./output";

Config.init( CONFIG_DATA_DIR );
DataLoader.load( options );
PageRenderer.render( OUTPUT_DIR );

ErrorLog.write( OUTPUT_DIR + "/errors.tsv" );

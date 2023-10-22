#!/usr/bin/env node

import { Config } from "../lib/config.js";
import { DataLoader } from "../lib/dataloader.js";
import { ErrorLog } from "../lib/errorlog.js";
import { PageRenderer } from "../lib/pagerenderer.js";
import commandLineArgs from "command-line-args";

const options = commandLineArgs( DataLoader.getOptionDefs() );

const dataDir = options.datadir ? options.datadir : "./data";

const OUTPUT_DIR = "./output";

PageRenderer.render( OUTPUT_DIR, new Config( dataDir ), DataLoader.load( dataDir ) );

ErrorLog.write( OUTPUT_DIR + "/errors.tsv" );

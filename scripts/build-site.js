#!/usr/bin/env node

import { DataLoader } from "../lib/dataloader.js";
import { ErrorLog } from "../lib/errorlog.js";
import { PageRenderer } from "../lib/pagerenderer.js";
import commandLineArgs from "command-line-args";

const options = commandLineArgs( DataLoader.getOptionDefs() );

const OUTPUT_DIR = "./output";

PageRenderer.render( OUTPUT_DIR, DataLoader.load( options ) );

ErrorLog.write( OUTPUT_DIR + "/errors.tsv" );

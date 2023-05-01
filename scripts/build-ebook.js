#!/usr/bin/env node

import commandLineArgs from "command-line-args";
import { PlantBook } from "@ca-plant-list/ca-plant-list";
import { DataLoader } from "../lib/dataloader.js";

const options = commandLineArgs( DataLoader.getOptionDefs() );

DataLoader.load( options );

const ebook = new PlantBook();
await ebook.create();

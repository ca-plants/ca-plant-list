#!/usr/bin/env node

import { Config } from "../lib/config.js";
import { PageRenderer } from "../lib/web/renderAllPages.js";
import { Files } from "../lib/files.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxonomy/taxa.js";
import { ErrorLog } from "../lib/errorlog.js";

/**
 * @param {{outputdir:string,datadir:string,webdir:string,showFlowerErrors:boolean,render:boolean}} options
 */
async function build(options) {
    console.info("generating templates");
    const outputDir = options.outputdir;
    Files.rmDir(outputDir);
    const errorLog = new ErrorLog(outputDir + "/errors.tsv");
    const taxa = new Taxa(
        Program.getIncludeList(options.datadir),
        errorLog,
        options.showFlowerErrors,
    );
    const config = new Config(options.datadir);
    const generator = PageRenderer.newSiteGenerator(config, outputDir);
    PageRenderer.renderAll(generator, config, taxa);
    errorLog.write();

    if (options.render) {
        console.info("generating site");
        Files.rmDir(options.webdir);
        await generator.generate(options.webdir);
    }
}

const program = Program.getProgram();
program.option(
    "--no-render",
    "Do not render full HTML output (only build the templates)",
);
program.option("-w, --webdir", "Directory for fully processed files", "public");

program.action(build);

await program.parseAsync();

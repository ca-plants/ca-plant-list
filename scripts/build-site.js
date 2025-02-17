#!/usr/bin/env node

import * as child_process from "node:child_process";
import * as path from "node:path";
import { Config } from "../lib/config.js";
import { PageRenderer } from "../lib/web/renderAllPages.js";
import { Files } from "../lib/files.js";
import { Program } from "../lib/program.js";
import { Taxa } from "../lib/taxonomy/taxa.js";
import { ErrorLog } from "../lib/errorlog.js";

class JekyllRenderer {
    #srcDir = "./output";
    #destDir = "./public";

    async renderPages() {
        /**
         * @param {string[]} configFiles
         * @param {string} dir
         * @param {string} name
         */
        function addConfigFile(configFiles, dir, name) {
            const fullPath = path.join(dir, name);
            if (Files.exists(fullPath)) {
                configFiles.push(fullPath);
            }
        }

        // Remove existing files.
        Files.rmDir(this.#destDir);

        const options = [
            "--source",
            this.#srcDir,
            "--destination",
            this.#destDir,
        ];

        // Find out what config files are available.
        /** @type {string[]} */
        const configFiles = [];
        addConfigFile(configFiles, this.#srcDir, "_config.yml");
        addConfigFile(configFiles, this.#srcDir, "_config-local.yml");
        addConfigFile(configFiles, ".", "_config-dev.yml");
        options.push("--config", `"${configFiles.join()}"`);

        const result = child_process.execSync(
            "bundle exec jekyll build " + options.join(" "),
        );
        console.log(result.toString());
    }
}

/**
 * @param {import("commander").OptionValues} options
 */
async function build(options) {
    console.info("generating templates");
    /** @type {string} */
    const outputDir = options.outputdir;
    Files.rmDir(outputDir);
    const errorLog = new ErrorLog(outputDir + "/errors.tsv");
    const taxa = new Taxa(
        Program.getIncludeList(options.datadir),
        errorLog,
        options.showFlowerErrors,
    );
    PageRenderer.renderAll(
        PageRenderer.newSiteGenerator(outputDir),
        new Config(options.datadir),
        taxa,
    );
    errorLog.write();

    if (options.render) {
        console.info("generating site");
        const r = new JekyllRenderer();
        await r.renderPages();
    }
}

const program = Program.getProgram();
program.option(
    "--no-render",
    "Do not render full HTML output (only build the templates)",
);

program.action(build);

await program.parseAsync();

#!/usr/bin/env node

import * as child_process from "node:child_process";
import * as path from "node:path";
import { Config } from "../lib/config.js";
import { PageRenderer } from "../lib/pagerenderer.js";
import { CommandAndTaxaProcessor } from "../lib/commandandtaxaprocessor.js";
import { Files } from "../lib/files.js";

class JekyllRenderer {
    #srcDir = "./output";
    #destDir = "./public";

    async renderPages() {
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
        const configFiles = [];
        addConfigFile(configFiles, this.#srcDir, "_config.yml");
        addConfigFile(configFiles, this.#srcDir, "_config-local.yml");
        addConfigFile(configFiles, ".", "_config-dev.yml");
        options.push("--config", '"' + configFiles.join() + '"');

        const result = child_process.execSync(
            "bundle exec jekyll build " + options.join(" ")
        );
        console.log(result.toString());
    }
}

async function generateSite(taxaProcessor) {
    const options = taxaProcessor.getOptions();

    PageRenderer.render(
        options.outputdir,
        new Config(options.datadir),
        taxaProcessor.getTaxa()
    );

    console.log("generating site");
    const r = new JekyllRenderer();
    await r.renderPages();
}

const gen = new CommandAndTaxaProcessor(
    "ca-plant-list",
    "A tool to generate a website with local plant data.",
    generateSite
);
await gen.process(generateSite);

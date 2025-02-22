import * as child_process from "node:child_process";
import * as path from "node:path";
import { Files } from "./files.js";
import { SiteGenerator } from "./sitegenerator.js";
import { Config } from "./config.js";

export class Jekyll extends SiteGenerator {
    copyGeneratorFiles() {
        // First copy default files from package.
        Files.copyDir(
            path.join(Config.getPackageDir(), "./generators/jekyll"),
            this.getBaseDir(),
        );
        // Then copy files from current dir (which may override default files).
        Files.copyDir("./generators/jekyll", this.getBaseDir());
    }

    async generate() {
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

        const srcDir = "./output";
        const destDir = "./public";

        // Remove existing files.
        Files.rmDir(destDir);

        const options = ["--source", srcDir, "--destination", destDir];

        // Find out what config files are available.
        /** @type {string[]} */
        const configFiles = [];
        addConfigFile(configFiles, srcDir, "_config.yml");
        addConfigFile(configFiles, srcDir, "_config-local.yml");
        addConfigFile(configFiles, ".", "_config-dev.yml");
        options.push("--config", `"${configFiles.join()}"`);

        const result = child_process.execSync(
            "bundle exec jekyll build " + options.join(" "),
        );
        console.log(result.toString());
    }
}

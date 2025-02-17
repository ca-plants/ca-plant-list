import path from "node:path";
import { Files } from "./files.js";
import { SiteGenerator } from "./sitegenerator.js";
import { Config } from "./config.js";

const FRONT_DELIM = "---";

export class Jekyll extends SiteGenerator {
    /**
     * @param {string} baseDir
     */
    constructor(baseDir) {
        super(baseDir);
    }

    copyGeneratorFiles() {
        // First copy default Jekyll files from package.
        Files.copyDir(
            path.join(Config.getPackageDir(), "./generators/jekyll"),
            this.getBaseDir(),
        );
        // Then copy Jekyll files from current dir (which may override default files).
        Files.copyDir("./generators/jekyll", this.getBaseDir());
    }

    /**
     * @param {Object<string,string>} atts
     */
    getFrontMatter(atts) {
        const lines = [FRONT_DELIM];
        for (const [k, v] of Object.entries(atts)) {
            if (v) {
                lines.push(k + ': "' + v + '"');
            }
        }
        lines.push(FRONT_DELIM);
        return lines.join("\n") + "\n";
    }

    /**
     * @param {string} content
     * @param {Object<string,string>} attributes
     * @param {string} filename
     */
    writeTemplate(content, attributes, filename) {
        Files.write(
            path.join(this.getBaseDir(), filename),
            this.getFrontMatter(attributes) + content,
        );
    }
}

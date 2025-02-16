import { Files } from "./files.js";
import { SiteGenerator } from "./sitegenerator.js";

const FRONT_DELIM = "---";

class Jekyll extends SiteGenerator {
    /**
     * @param {string} baseDir
     */
    constructor(baseDir) {
        super(baseDir);
    }

    /**
     * @param {Object<string,string>} atts
     */
    static getFrontMatter(atts) {
        const lines = [FRONT_DELIM];
        for (const [k, v] of Object.entries(atts)) {
            lines.push(k + ': "' + v + '"');
        }
        if (!atts.layout) {
            lines.push("layout: default");
        }
        lines.push(FRONT_DELIM);
        return lines.join("\n") + "\n";
    }

    /**
     * @param {string} baseDir
     * @param {string} path
     * @param {string} data
     */
    static writeInclude(baseDir, path, data) {
        Files.write(baseDir + "/_includes/" + path, data);
    }

    /**
     * @param {string} content
     * @param {Object<string,string>} attributes
     * @param {string} filename
     */
    writeTemplate(content, attributes, filename) {
        Files.write(
            Files.join(this.getBaseDir(), filename),
            Jekyll.getFrontMatter(attributes) + content,
        );
    }
}

export { Jekyll };

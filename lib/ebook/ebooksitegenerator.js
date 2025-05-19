import path from "node:path";
import { Files } from "../files.js";
import { SiteGenerator } from "../sitegenerator.js";
import { XHTML } from "./xhtml.js";

export class EBookSiteGenerator extends SiteGenerator {
    #pageEnd() {
        return "</body></html>";
    }

    /**
     * @param {number} depth
     * @param {{title:string}} attributes
     */
    #pageStart(depth, attributes) {
        let html = '<?xml version="1.0" encoding="utf-8"?>\n';
        html +=
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">';
        html += "<head><title>" + attributes.title + "</title>";
        html +=
            '<link href="' +
            "../".repeat(depth) +
            'css/main.css" rel="stylesheet" />';
        html += "</head><body>";
        html += XHTML.wrap("h1", attributes.title);
        return html;
    }

    /**
     * @param {number} depth
     * @param {string} content
     * @param {{title:string}} attributes
     */
    #wrap(depth, content, attributes) {
        return this.#pageStart(depth, attributes) + content + this.#pageEnd();
    }

    /**
     * @param {string} content
     * @param {{title:string}} attributes
     * @param {string} filename
     */
    writeTemplate(content, attributes, filename) {
        const depth = (filename.match(/\//g) || []).length;
        Files.write(
            path.join(this.getBaseDir(), filename),
            this.#wrap(depth, content, attributes),
        );
    }
}

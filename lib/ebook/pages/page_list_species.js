import { HTMLTaxon } from "../../htmltaxon.js";
import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";

class PageListSpecies extends EBookPage {
    #taxa;

    /**
     *
     * @param {string} outputDir
     * @param {import("../../taxonomy/taxon.js").Taxon[]} taxa
     * @param {string} filename
     * @param {string} title
     */
    constructor(outputDir, taxa, filename, title) {
        super(outputDir + "/" + filename, title);
        this.#taxa = taxa;
    }

    renderPageBody() {
        const html = XHTML.textElement("h1", this.getTitle());

        const links = [];
        for (const taxon of this.#taxa) {
            links.push(HTMLTaxon.getLink(taxon));
        }

        return html + XHTML.wrap("ol", XHTML.arrayToLI(links));
    }
}

export { PageListSpecies };

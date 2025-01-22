import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { PageListFlowers } from "./page_list_flowers.js";

class TOCPage extends EBookPage {
    #taxa;

    /**
     * @param {string} outputDir
     * @param {import("../../taxa.js").Taxa} taxa
     */
    constructor(outputDir, taxa) {
        super(outputDir + "/toc.xhtml", "Table of Contents");
        this.#taxa = taxa;
    }

    renderPageBody() {
        let html = '<nav id="toc" role="doc-toc" epub:type="toc">';
        html += '<h1 epub:type="title">Table of Contents</h1>';

        const mainLinks = [];
        mainLinks.push(this.#getFlowerColorLinks());
        mainLinks.push(this.#getFlowerTimeLinks());
        mainLinks.push(XHTML.getLink("./list_families.html", "All Families"));
        mainLinks.push(XHTML.getLink("./list_species.html", "All Species"));
        mainLinks.push(XHTML.getLink("./glossary.html", "Glossary"));
        html += XHTML.wrap("ol", XHTML.arrayToLI(mainLinks));

        html += "</nav>";

        return html;
    }

    #getFlowerColorLinks() {
        const html = XHTML.textElement("span", "Flower Color");
        const links = [];
        for (const color of this.#taxa.getFlowerColors()) {
            const colorName = color.getColorName();
            links.push(
                XHTML.getLink("list_fc_" + colorName + ".html", colorName),
            );
        }
        return html + XHTML.wrap("ol", XHTML.arrayToLI(links));
    }

    #getFlowerTimeLinks() {
        const html = XHTML.getLink("fm.html", "Flowering Times");
        return html + PageListFlowers.renderMonthLinks();
    }
}

export { TOCPage };

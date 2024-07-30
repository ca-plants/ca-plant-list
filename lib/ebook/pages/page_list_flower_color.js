import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";

class PageListFlowerColor extends EBookPage {
    #color;

    /**
     * @param {string} outputDir
     * @param {FlowerColor} color
     */
    constructor(outputDir, color) {
        super(
            outputDir + "/" + color.getFileName(),
            color.getColorName(true) + " Flowers"
        );
        this.#color = color;
    }

    renderPageBody() {
        const html = XHTML.textElement("h1", this.getTitle());

        const links = [];
        for (const taxon of this.#color.getTaxa()) {
            links.push(XHTML.getLink(taxon.getFileName(), taxon.getName()));
        }

        return html + XHTML.wrap("ol", XHTML.arrayToLI(links));
    }
}

export { PageListFlowerColor };

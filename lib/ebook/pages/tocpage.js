import { HTML } from "@ca-plant-list/ca-plant-list";
import { EBookPage } from "../ebookpage.js";

class TOCPage extends EBookPage {

    #taxa;

    constructor( outputDir, taxa ) {
        super( outputDir + "/toc.xhtml", "Table of Contents" );
        this.#taxa = taxa;
    }

    renderPageBody() {

        let html = "<nav id=\"toc\" role=\"doc-toc\" epub:type=\"toc\">";
        html += "<h2 epub:type=\"title\">Table of Contents</h2>";

        html += "<ol>";
        for ( const taxon of this.#taxa ) {
            html += "<li>" + HTML.getLink( "./" + taxon.getFileName(), taxon.getName() ) + "</li>";
        }
        html += "</ol>";

        html += "</nav>";

        return html;
    }
}

export { TOCPage };
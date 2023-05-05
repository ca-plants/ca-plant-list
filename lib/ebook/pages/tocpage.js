import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { FLOWER_COLOR_NAMES } from "../../taxa.js";

class TOCPage extends EBookPage {

    constructor( outputDir ) {
        super( outputDir + "/toc.xhtml", "Table of Contents" );
    }

    renderPageBody() {

        let html = "<nav id=\"toc\" role=\"doc-toc\" epub:type=\"toc\">";
        html += "<h1 epub:type=\"title\">Table of Contents</h1>";

        const mainLinks = [];
        mainLinks.push( this.#getFlowerColorLinks() );
        mainLinks.push( XHTML.getLink( "./list_species.html", "All Species" ) );
        html += "<ol>";
        html += XHTML.arrayToLI( mainLinks );
        html += "</ol>";

        html += "</nav>";

        return html;
    }

    #getFlowerColorLinks() {
        const html = XHTML.textElement( "span", "Flower Color" );
        const links = [];
        for ( const colorName of FLOWER_COLOR_NAMES ) {
            links.push( XHTML.getLink( "list_fc_" + colorName + ".html", colorName ) );
        }
        return html + XHTML.wrap( "ol", XHTML.arrayToLI( links ) );
    }
}

export { TOCPage };
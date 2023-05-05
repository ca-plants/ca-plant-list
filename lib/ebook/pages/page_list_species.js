import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";

class PageListSpecies extends EBookPage {

    #taxa;

    constructor( outputDir, taxa ) {
        super( outputDir + "/list_species.html", "All Species" );
        this.#taxa = taxa;
    }

    renderPageBody() {

        let html = XHTML.textElement( "h1", this.getTitle() );

        html += "<ol>";
        for ( const taxon of this.#taxa ) {
            html += "<li>" + XHTML.getLink( "./" + taxon.getFileName(), taxon.getName() ) + "</li>";
        }
        html += "</ol>";

        return html;
    }
}

export { PageListSpecies };
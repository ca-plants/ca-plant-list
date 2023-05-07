import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";

class PageListSpecies extends EBookPage {

    #taxa;

    constructor( outputDir, taxa, filename, title ) {
        super( outputDir + "/" + filename, title );
        this.#taxa = taxa;
    }

    renderPageBody() {

        const html = XHTML.textElement( "h1", this.getTitle() );

        const links = [];
        for ( const taxon of this.#taxa ) {
            links.push( XHTML.getLink( taxon.getFileName(), taxon.getName() ) );
        }

        return html + XHTML.wrap( "ol", XHTML.arrayToLI( links ) );
    }
}

export { PageListSpecies };
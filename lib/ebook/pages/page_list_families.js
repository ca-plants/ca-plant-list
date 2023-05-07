import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { Families } from "../../families.js";

class PageListFamilies extends EBookPage {

    constructor( outputDir ) {
        super( outputDir + "/list_families.html", "All Families" );
    }

    renderPageBody() {

        const html = XHTML.textElement( "h1", this.getTitle() );

        const links = [];
        for ( const family of Families.getFamilies() ) {
            if ( !family.getTaxa() ) {
                continue;
            }
            links.push( XHTML.getLink( family.getFileName(), family.getName() ) );
        }

        return html + XHTML.wrap( "ol", XHTML.arrayToLI( links ) );
    }
}

export { PageListFamilies };
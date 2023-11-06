import sizeOf from "image-size";
import { Config, Files } from "@ca-plant-list/ca-plant-list";
import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { Markdown } from "../../markdown.js";
import { DateUtils } from "../../dateutils.js";

class TaxonPage extends EBookPage {

    #outputDir;
    #taxon;
    #photos;

    constructor( outputDir, taxon, photos ) {
        super( outputDir + "/" + taxon.getFileName(), taxon.getName() );
        this.#outputDir = outputDir;
        this.#taxon = taxon;
        this.#photos = photos;
    }

    renderPageBody() {

        function renderBloomInfo( taxon ) {
            const colors = taxon.getFlowerColors();
            const monthStart = taxon.getBloomStart();
            const monthEnd = taxon.getBloomEnd();
            if ( !colors && !monthStart ) {
                return "";
            }
            let html = "";
            if ( colors ) {
                for ( const color of colors ) {
                    html += XHTML.textElement( "img", "", { src: "./i/f-" + color + ".svg", class: "flr" } );
                }
            }
            if ( monthStart ) {
                html += XHTML.textElement( "div", DateUtils.getMonthName( monthStart ) + "-" + DateUtils.getMonthName( monthEnd ) );

            }
            return XHTML.wrap( "div", html, { class: "flr" } );
        }


        function renderCustomText( name ) {
            // See if there is custom text.
            const fileName = Config.getPackageDir() + "/data/text/" + name + ".md";
            if ( !Files.exists( fileName ) ) {
                return "";
            }
            const text = Files.read( fileName );
            return Markdown.strToHTML( text );
        }

        const name = this.#taxon.getName();
        let html = XHTML.textElement( "h1", name );

        const family = this.#taxon.getFamily();
        html += XHTML.wrap( "div", XHTML.getLink( family.getFileName(), family.getName() ) );

        const cn = this.#taxon.getCommonNames();
        if ( cn && cn.length > 0 ) {
            html += XHTML.textElement( "p", cn.join( ", " ) );
        }

        html += renderBloomInfo( this.#taxon );

        html += renderCustomText( this.#taxon.getBaseFileName() );

        if ( this.#photos ) {
            for ( const photo of this.#photos ) {
                const src = photo.getSrc();
                const dimensions = sizeOf( this.#outputDir + "/" + src );
                let img = XHTML.textElement( "img", "", { src: src, style: "max-width:" + dimensions.width + "px" } );
                const caption = photo.getCaption();
                if ( caption ) {
                    img += XHTML.textElement( "figcaption", caption );
                }
                html += XHTML.wrap( "figure", img );
            }
        }

        return html;
    }

}

export { TaxonPage };
import sizeOf from "image-size";
import markdownIt from "markdown-it";
import { Config, Files } from "@ca-plant-list/ca-plant-list";
import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";

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

        function renderColors( colors ) {
            if ( !colors ) {
                return "";
            }
            let html = "";
            for ( const color of colors ) {
                // html += XHTML.textElement( "span", "", { class: "color " + color } );
                html += XHTML.textElement( "img", "", { src: "./i/f-" + color + ".svg", class: "flr" } );
            }
            return html;
        }


        function renderCustomText( name ) {
            // See if there is custom text.
            const fileName = Config.getPackageDir() + "/data/text/" + name + ".md";
            if ( !Files.exists( fileName ) ) {
                return "";
            }
            const text = Files.read( fileName );
            const md = new markdownIt();
            return md.render( text );
        }

        const name = this.#taxon.getName();
        let html = XHTML.textElement( "h1", name );

        const family = this.#taxon.getFamily();
        html += XHTML.wrap( "div", XHTML.getLink( family.getFileName(), family.getName() ) );

        const cn = this.#taxon.getCommonNames();
        if ( cn && cn.length > 0 ) {
            html += XHTML.textElement( "p", cn.join( ", " ) );
        }

        html += renderColors( this.#taxon.getFlowerColors() );

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
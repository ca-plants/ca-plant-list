import { Files } from "../files.js";
import { SiteGenerator } from "../sitegenerator.js";

class EBookSiteGenerator extends SiteGenerator {

    constructor( baseDir ) {
        super( baseDir );
    }

    #pageEnd() {
        return "</body></html>";
    }

    #pageStart( depth, attributes ) {
        let html = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
        html += "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">";
        html += "<head><title>" + attributes.title + "</title>";
        html += "<link href=\"" + "../".repeat( depth ) + "css/main.css\" rel=\"stylesheet\" />";
        html += "</head><body>";
        return html;
    }

    #wrap( depth, content, attributes ) {
        return this.#pageStart( depth, attributes ) + content + this.#pageEnd();
    }

    writeTemplate( content, attributes, filename ) {
        const depth = ( filename.match( /\//g ) || [] ).length;
        Files.write( Files.join( this.getBaseDir(), filename ), this.#wrap( depth, content, attributes ) );
    }

}

export { EBookSiteGenerator };
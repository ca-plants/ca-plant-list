import * as fs from "node:fs";

class EBookPage {

    #fileName;
    #title;
    #rootPrefix;

    constructor( fileName, title, rootPrefix = "" ) {
        this.#fileName = fileName;
        this.#title = title;
        this.#rootPrefix = rootPrefix;
    }

    create() {
        let html = this.#renderPageStart( this.#title );
        html += this.renderPageBody();
        html += this.#renderPageEnd();
        fs.writeFileSync( this.#fileName, html );
    }

    getTitle() {
        return this.#title;
    }

    #renderBodyStart() {
        return "<body>";
    }

    renderPageBody() {
        throw new Error( "must be implemented by subclass" );
    }

    #renderPageEnd() {
        return "</body></html>";
    }

    #renderPageStart( title ) {
        let html = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
        html += "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">";
        html += "<head><title>" + title + "</title>";
        html += "<link href=\"" + this.#rootPrefix + "css/main.css\" rel=\"stylesheet\" />";
        html += "</head>" + this.#renderBodyStart();
        return html;
    }

}

export { EBookPage };
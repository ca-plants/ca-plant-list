import { Files, HTML, Jekyll } from "@ca-plant-list/ca-plant-list";

class GenericPage {

    #outputDir;
    #title;
    #baseFileName;
    #js;

    constructor( outputDir, title, baseFileName, js ) {
        this.#outputDir = outputDir;
        this.#title = title;
        this.#baseFileName = baseFileName;
        this.#js = js;
    }

    getDefaultIntro() {
        let html = this.#getFrontMatter();
        html += HTML.textElement( "h1", this.#title );
        const introPath = "lists/" + this.#baseFileName + "-intro.md";
        if ( Jekyll.hasInclude( this.#outputDir, introPath ) ) {
            html += HTML.wrap( "div", Jekyll.include( introPath ), { class: "section" } );
        }
        return html;
    }

    #getFrontMatter() {
        return "---\n"
            + "title: \"" + this.#title + "\"\n"
            + ( this.#js ? ( "js: " + this.#js + "\n" ) : "" )
            + "---\n";
    }

    getOutputDir() {
        return this.#outputDir;
    }

    getTitle() {
        return this.#title;
    }

    writeFile( html ) {
        Files.write( this.#outputDir + "/" + this.#baseFileName + ".html", html );
    }

}

export { GenericPage };
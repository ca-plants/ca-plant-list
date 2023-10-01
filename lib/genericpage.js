import { Config, Files, HTML, Jekyll } from "@ca-plant-list/ca-plant-list";
import { Markdown } from "./markdown.js";

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

    getBaseFileName() {
        return this.#baseFileName;
    }

    getDefaultIntro() {
        let html = this.getFrontMatter();
        return html + this.getMarkdown();
    }

    getFrontMatter() {
        return "---\n"
            + "title: \"" + this.#title + "\"\n"
            + ( this.#js ? ( "js: " + this.#js + "\n" ) : "" )
            + "---\n";
    }

    getMarkdown() {
        // Include site-specific markdown.
        let html = this.#getMarkdown( "intros" );

        // Include package markdown.
        const mdPath = Config.getPackageDir() + "/data/text/" + this.#baseFileName + ".md";
        if ( Files.exists( mdPath ) ) {
            html += HTML.wrap( "div", Markdown.fileToHTML( mdPath ), { class: "section" } );
        }

        return html;
    }

    #getMarkdown( path ) {
        const textPath = path + "/" + this.#baseFileName + ".md";
        if ( !Jekyll.hasInclude( this.#outputDir, textPath ) ) {
            return "";
        }
        return HTML.wrap( "div", Jekyll.include( textPath ), { class: "section" } );
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
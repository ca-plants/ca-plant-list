import { Files } from "./files.js";

/**
 * @deprecated
 */
class HTMLPage {

    getFrontMatter( title, js ) {
        return "---\n"
            + "title: \"" + title + "\"\n"
            + ( js ? ( "js: " + js + "\n" ) : "" )
            + "---\n";
    }

    writeFile( outputDir, fileName, html ) {
        Files.write( outputDir + "/" + fileName, html );
    }

}

export { HTMLPage };
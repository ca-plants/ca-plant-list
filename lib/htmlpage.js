import * as fs from "node:fs";

class HTMLPage {

    getFrontMatter( title, js ) {
        return "---\n"
            + "title: \"" + title + "\"\n"
            + ( js ? ( "js: " + js + "\n" ) : "" )
            + "---\n";
    }

    writeFile( outputDir, fileName, html ) {
        fs.writeFileSync( outputDir + "/" + fileName, html );
    }

}

export { HTMLPage };
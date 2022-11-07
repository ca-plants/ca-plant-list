import * as fs from "node:fs";

class Files {

    static async fetch( url, targetFileName ) {
        const response = await fetch( url );
        const data = await response.text();
        fs.writeFileSync( targetFileName, data );
    }

    static read( path ) {
        return fs.readFileSync( path, "utf8" );
    }

}

export { Files };
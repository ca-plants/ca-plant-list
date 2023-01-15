import * as fs from "node:fs";
import { default as unzipper } from "unzipper";

class Files {

    static copyDir( srcDir, targetDir ) {
        fs.cpSync( srcDir, targetDir, { recursive: true } );
    }

    static createFileFromStream( fileName, inStream ) {

        function implementation( fileName, inStream, resolve ) {
            const outStream = fs.createWriteStream( fileName );
            outStream.on( "finish", () => { resolve( true ); } );
            inStream.pipe( outStream );
        }

        return new Promise( ( resolve ) => { implementation( fileName, inStream, resolve ); } );
    }

    static exists( path ) {
        return fs.existsSync( path );
    }

    /**
     * Retrieve data from a URL and write it to a file. If the response status is anything other than 200, an Error is thrown.
     * @param {string|URL} url 
     * @param {string|undefined} targetFileName If targetFileName is undefined, the data will be retrieved but not written to a file.
     * @param {Object} [headers={}] Request Headers.
     * @returns {Promise<Headers>} The Response headers.
     */
    static async fetch( url, targetFileName, headers = {} ) {
        const response = await fetch( url, headers );
        if ( response.status !== 200 ) {
            throw new Error( response.status + " retrieving " + url );
        }
        const data = await response.blob();
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from( arrayBuffer );
        if ( targetFileName ) {
            fs.writeFileSync( targetFileName, buffer );
        }
        return response.headers;
    }

    static mkdir( path ) {
        fs.mkdirSync( path, { recursive: true } );
    }

    static read( path ) {
        return fs.readFileSync( path, "utf8" );
    }

    static rmDir( dir ) {
        fs.rmSync( dir, { force: true, recursive: true, maxRetries: 2, retryDelay: 1000 } );
    }

    static write( path, data, overwrite = false ) {
        if ( !overwrite && this.exists( path ) ) {
            throw new Error( path + " already exists" );
        }
        fs.writeFileSync( path, data );
    }

    static async zipFileExtract( zipFilePath, fileNameToUnzip, targetFilePath ) {

        const zipDir = await unzipper.Open.file( zipFilePath );
        for ( const entry of zipDir.files ) {
            if ( entry.path === fileNameToUnzip ) {
                await this.createFileFromStream( targetFilePath, entry.stream() );
                break;
            }
        }

    }

}

export { Files };
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

    static async fetch( url, targetFileName ) {
        const response = await fetch( url );
        const data = await response.blob();
        const buffer = await data.arrayBuffer();
        fs.writeFileSync( targetFileName, Buffer.from( buffer ) );
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
import * as fs from "node:fs";
import path from "node:path";
import { finished } from "stream/promises";
import { parse as parseSync } from "csv-parse/sync";
import { parse } from "csv-parse";

class CSV {

    static getMap( dir, fileName ) {

        let headers;

        function setHeaders( h ) {
            headers = h;
            return h;
        }

        const csv = this.parseFile( dir, fileName, setHeaders );
        const map = {};
        for ( const row of csv ) {
            map[ row[ headers[ 0 ] ] ] = row[ headers[ 1 ] ];
        }

        return map;
    }

    static #getOptions( fileName, columns, delimiter ) {
        const options = { relax_column_count_less: true };
        options.columns = columns;
        if ( path.extname( fileName ) === ".tsv" ) {
            options.delimiter = "\t";
            options.quote = false;
        } else {
            options.delimiter = delimiter ? delimiter : ",";
        }
        if ( options.delimiter === "\t" ) {
            options.quote = null;
        }
        return options;
    }

    /**
     * @param {string} dir 
     * @param {string} fileName 
     * @param {boolean|undefined} [columns] 
     * @param {string|undefined} [delimiter] 
     */
    static parseFile( dir, fileName, columns = true, delimiter ) {
        const content = fs.readFileSync( dir + "/" + fileName );

        const options = this.#getOptions( fileName, columns, delimiter );
        return parseSync( content, options );
    }

    /**
     * @param {string} dir 
     * @param {string} fileName 
     * @param {boolean|undefined} columns 
     * @param {string|undefined} delimiter 
     * @param {*} callback 
     */
    static async parseStream( dir, fileName, columns = true, delimiter, callback ) {
        const options = this.#getOptions( fileName, columns, delimiter );
        const processFile = async () => {
            const records = [];
            const parser = fs
                .createReadStream( dir + "/" + fileName )
                .pipe( parse( options ) );
            parser.on( "readable", function () {
                let record;
                while ( ( record = parser.read() ) !== null ) {
                    callback( record );
                }
            } );
            await finished( parser );
            return records;
        };
        // Parse the CSV content
        await processFile();

    }

}

export { CSV };
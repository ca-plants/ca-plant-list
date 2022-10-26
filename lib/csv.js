import * as fs from "node:fs";
import { parse } from "csv-parse/sync";
import path from "node:path";

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

    static parseFile( dir, fileName, columns = true, delimiter ) {
        const content = fs.readFileSync( dir + "/" + fileName );

        const options = { relax_column_count_less: true };
        options.columns = columns;
        if ( path.extname( fileName ) === ".tsv" ) {
            options.delimiter = "\t";
            options.quote = false;
        } else {
            options.delimiter = delimiter ? delimiter : ",";
        }
        return parse( content, options );
    }

}

export { CSV };
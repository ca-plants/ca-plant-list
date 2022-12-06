import * as fs from "node:fs";
import { Config } from "./config.js";
import { Families } from "./families.js";

class BasePageRenderer {

    static render( outputDir, Taxa ) {

        // Copy static files
        fs.rmSync( outputDir, { force: true, recursive: true, maxRetries: 2, retryDelay: 1000 } );
        // First copy default Jekyll files from package.
        fs.cpSync( Config.getPackageDir() + "/jekyll", outputDir, { recursive: true } );
        // Then copy Jekyll files from current dir (which may override default files).
        fs.cpSync( "jekyll", outputDir, { recursive: true } );

        Families.renderPages( outputDir );

        this.renderTools( outputDir, Taxa );

    }

    static renderTools( outputDir, Taxa ) {

        const names = [];
        for ( const taxon of Taxa.getTaxa() ) {
            const row = [];
            row.push( taxon.getName() );
            const cn = taxon.getCommonNames().join( "," );
            if ( cn ) {
                row.push( cn );
            }
            const synonyms = [];
            for ( const syn of taxon.getSynonyms() ) {
                synonyms.push( syn );
            }
            if ( synonyms.length > 0 ) {
                row[ 2 ] = synonyms;
            }
            names.push( row );
        }

        fs.writeFileSync( outputDir + "/_includes/names.json", JSON.stringify( names ) );

    }


}

export { BasePageRenderer };
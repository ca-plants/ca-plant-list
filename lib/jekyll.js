import { Files } from "./files.js";

const FRONT_DELIM = "---";

class Jekyll {

    #baseDir;

    constructor( baseDir ) {
        this.#baseDir = baseDir;
    }

    static getFrontMatter( atts ) {
        const lines = [ FRONT_DELIM ];
        for ( const [ k, v ] of Object.entries( atts ) ) {
            lines.push( k + ": \"" + v + "\"" );
        }
        if ( !atts.layout ) {
            lines.push( "layout: default" );
        }
        lines.push( FRONT_DELIM );
        return lines.join( "\n" ) + "\n";
    }

    static hasInclude( baseDir, path ) {
        return Files.exists( baseDir + "/_includes/" + path );
    }

    static include( path ) {
        // This works for .md includes; should have conditional logic to detect other types.
        return "{% capture my_include %}{% include " + path + " %}{% endcapture %}{{ my_include | markdownify }}";
    }

    mkdir( path ) {
        Files.mkdir( Files.join( this.#baseDir, path ) );
    }

    static writeInclude( baseDir, path, data ) {
        Files.write( baseDir + "/_includes/" + path, data );
    }

    writeTemplate( content, attributes, filename ) {
        Files.write( Files.join( this.#baseDir, filename ), Jekyll.getFrontMatter( attributes ) + content );
    }

}

export { Jekyll };
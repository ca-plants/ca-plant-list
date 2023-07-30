import { Files } from "./files.js";

const FRONT_DELIM = "---";

class Jekyll {

    static getFrontMatter( atts ) {
        const lines = [ FRONT_DELIM ];
        for ( const [ k, v ] of Object.entries( atts ) ) {
            lines.push( k + ": \"" + v + "\"" );
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

    static writeInclude( baseDir, path, data ) {
        Files.write( baseDir + "/_includes/" + path, data );
    }

}

export { Jekyll };
import { optimize } from "svgo";
import { Config } from "./config.js";
import { Files } from "./files.js";

const FRONT_DELIM = "---";

class Jekyll {

    #baseDir;

    constructor( baseDir ) {
        this.#baseDir = baseDir;
    }

    copyIllustrations() {
        // Files.copyDir( Config.getPackageDir() + "/data/illustrations/optimized", outputDir + "/i" );
        const outputDir = Files.join( this.#baseDir, "i" );
        Files.mkdir( outputDir );
        const srcDir = Config.getPackageDir() + "/data/illustrations/inkscape";
        const entries = Files.getDirEntries( srcDir );
        for ( const entry of entries ) {
            const srcFile = Files.join( srcDir, entry );
            const srcSVG = Files.read( srcFile );
            const result = optimize(
                srcSVG,
                {
                    plugins: [
                        "preset-default",
                        "convertStyleToAttrs",
                        {
                            name: "removeAttrs",
                            params: {
                                attrs: "(style)"
                            }
                        },
                    ],
                    multipass: true
                }
            );
            Files.write( Files.join( outputDir, entry ), result.data );
        }
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
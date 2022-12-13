import { Files } from "./files.js";

class Jekyll {

    static hasInclude( baseDir, path ) {
        return Files.exists( baseDir + "/_includes/" + path );
    }

    static include( path ) {
        return "{%include " + path + "%}";
    }

    static writeInclude( baseDir, path, data ) {
        Files.write( baseDir + "/_includes/" + path, data );
    }

}

export { Jekyll };
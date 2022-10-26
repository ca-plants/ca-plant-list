import { HTML, HTML_OPTIONS } from "./html.js";

class Jepson {

    static getEFloraLink( id ) {

        return HTML.getLink(
            "https://ucjeps.berkeley.edu/eflora/eflora_display.php?tid=" + id,
            "Jepson eFlora",
            {},
            HTML_OPTIONS.OPEN_NEW
        );

    }

}

export { Jepson };
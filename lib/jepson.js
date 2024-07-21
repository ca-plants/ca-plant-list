import { HTML } from "./html.js";

class Jepson {
    /**
     * @param {string} id
     */
    static getEFloraLink(id) {
        return HTML.getLink(
            "https://ucjeps.berkeley.edu/eflora/eflora_display.php?tid=" + id,
            "Jepson eFlora",
            {},
            true
        );
    }
}

export { Jepson };

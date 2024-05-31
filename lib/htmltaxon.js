import { DateUtils } from "./dateutils.js";
import { HTML } from "./html.js";
// eslint-disable-next-line no-unused-vars
import { Taxon } from "./taxon.js";
import { TextUtils } from "./textutils.js";

class HTMLTaxon {
    /**
     * @param {Taxon} taxon
     * @param {string} classNames
     */
    static getFlowerInfo(taxon, classNames = "section") {
        const lifeCycle = taxon.getLifeCycle();
        const colors = taxon.getFlowerColors();
        const monthStart = taxon.getBloomStart();
        const monthEnd = taxon.getBloomEnd();

        const parts = [];
        if (lifeCycle) {
            const text =
                HTML.wrap("span", TextUtils.ucFirst(lifeCycle), "lc") + ".";
            parts.push(HTML.wrap("span", text, "lcs"));
        }

        if (colors || monthStart) {
            let html = "Flowers: ";
            if (colors) {
                for (const color of colors) {
                    html += HTML.textElement("img", "", {
                        src: "./i/f-" + color + ".svg",
                        alt: color + " flowers",
                        title: color,
                        class: "flr-color",
                    });
                }
            }
            if (monthStart && monthEnd) {
                html += HTML.wrap(
                    "span",
                    DateUtils.getMonthName(monthStart) +
                        "-" +
                        DateUtils.getMonthName(monthEnd),
                    { class: "flr-time" }
                );
            }
            parts.push(HTML.wrap("span", html));
        }
        return HTML.wrap("div", parts.join(""), { class: classNames });
    }
}

export { HTMLTaxon };

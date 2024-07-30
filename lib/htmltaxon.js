import { DateUtils } from "./dateutils.js";
import { HTML } from "./html.js";
import { TextUtils } from "./textutils.js";

class HTMLTaxon {
    /**
     * @param {string[]} colors
     */
    static getFlowerColors(colors, includeColorLink = true) {
        let html = "";
        if (colors) {
            for (const color of colors) {
                const img = HTML.textElement("img", "", {
                    src: "./i/f-" + color + ".svg",
                    alt: color + " flowers",
                    title: color,
                    class: "flr-color",
                });
                if (includeColorLink) {
                    html += HTML.wrap("a", img, {
                        href: "./list_fc_" + color + ".html",
                    });
                } else {
                    html += img;
                }
            }
        }
        return html;
    }

    /**
     * @param {Taxon} taxon
     * @param {string} classNames
     * @param {boolean} [includeColorLink=true]
     */
    static getFlowerInfo(
        taxon,
        classNames = "section",
        includeColorLink = true
    ) {
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
            html += this.getFlowerColors(colors, includeColorLink);
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

    /**
     * @param {Taxon} taxon
     */
    static getLink(taxon) {
        return (
            HTML.getLink(taxon.getFileName(), taxon.getName()) +
            this.getFlowerColors(taxon.getFlowerColors())
        );
    }
}

export { HTMLTaxon };

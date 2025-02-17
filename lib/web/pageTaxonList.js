import { GenericPage } from "./pageGeneric.js";
import { HTML } from "../html.js";
import { HTMLTaxon } from "../htmltaxon.js";

export class PageTaxonList extends GenericPage {
    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {string} title
     * @param {string} baseName
     */
    constructor(siteGenerator, title, baseName) {
        super(siteGenerator, title, baseName);
    }

    /**
     *
     * @param {import("../types.js").Taxon[]} taxa
     * @param {import("../types.js").TaxaColDef[]|undefined} columns
     */
    render(taxa, columns) {
        let html = this.getDefaultIntro();

        html += '<div class="wrapper">';

        html += '<div class="section">';
        html += HTMLTaxon.getTaxaTable(taxa, columns);
        html += "</div>";

        html += '<div class="section nobullet">';
        html += HTML.textElement("h2", "Download");
        html += "<ul>";
        html +=
            "<li>" +
            HTML.getLink(
                "./calflora_" + this.getBaseFileName() + ".txt",
                "Calflora List",
            ) +
            "</li>";
        html +=
            "<li>" +
            HTML.getLink(
                "./inat_" + this.getBaseFileName() + ".txt",
                "iNaturalist List",
            ) +
            "</li>";
        html += "</ul>";
        html += "</div>";

        html += "</div>";

        this.writeFile(html);
    }
}

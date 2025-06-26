import { RarePlants } from "../rareplants.js";
import { GenericPage } from "./pageGeneric.js";
import { HTML } from "../html.js";
import { HTMLTaxon } from "../htmltaxon.js";

export class PageTaxon extends GenericPage {
    #config;
    #taxon;

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {import("../config.js").Config} config
     * @param {import("../types.js").Taxon} taxon
     */
    constructor(siteGenerator, config, taxon) {
        super(siteGenerator, taxon.getName(), taxon.getBaseFileName());
        this.#config = config;
        this.#taxon = taxon;
    }

    #getInfoLinks() {
        /** @type {string[]} */
        const links = [];
        HTMLTaxon.addRefLink(links, this.#taxon, "jepson");
        HTMLTaxon.addRefLink(links, this.#taxon, "calflora");
        HTMLTaxon.addRefLink(
            links,
            this.#taxon,
            "inat",
            this.#taxon.getINatSyn()
                ? " (" + this.#taxon.getINatSyn() + ")"
                : "",
        );
        HTMLTaxon.addRefLink(links, this.#taxon, "rpi");
        HTMLTaxon.addRefLink(links, this.#taxon, "fna");
        HTMLTaxon.addRefLink(links, this.#taxon, "cch");
        HTMLTaxon.addRefLink(links, this.#taxon, "calscape");
        HTMLTaxon.addRefLink(links, this.#taxon, "calipc");
        return links;
    }

    #getObsLinks() {
        /** @type {string[]} */
        const links = [];
        HTMLTaxon.addObsLink(links, this.#taxon, this.#config, "inat");
        HTMLTaxon.addObsLink(links, this.#taxon, this.#config, "calflora");
        HTMLTaxon.addObsLink(links, this.#taxon, this.#config, "cch");
        return links;
    }

    #getRarityInfo() {
        const cnpsRank = this.#taxon.getRPIRankAndThreat();
        if (!cnpsRank) {
            return "";
        }
        const ranks = [];

        ranks.push(
            HTML.textElement("span", "CNPS Rare Plant Rank:", {
                class: "label",
            }) +
                HTML.getToolTip(
                    cnpsRank,
                    HTMLTaxon.getRPIRankAndThreatTooltip(this.#taxon),
                ),
        );
        if (this.#taxon.getCESA()) {
            ranks.push(
                HTML.textElement("span", "CESA:", { class: "label" }) +
                    RarePlants.getCESADescription(this.#taxon.getCESA()),
            );
        }

        return HTML.wrap("div", "<ul>" + HTML.arrayToLI(ranks) + "</ul>", {
            class: "section nobullet",
        });
    }

    #getRelatedTaxaLinks() {
        const links = [];
        const genus = this.#taxon.getGenus();
        if (genus) {
            const taxa = genus.getTaxa();
            if (taxa.length > 1) {
                for (const taxon of taxa) {
                    links.push(
                        HTMLTaxon.getHTMLLink(
                            taxon,
                            taxon.getName() !== this.#taxon.getName(),
                        ),
                    );
                }
            }
        }
        return links;
    }

    #getSynonyms() {
        return this.#taxon.getSynonyms();
    }

    render() {
        let html = this.getFrontMatter();

        html += '<div class="wrapper">';

        const cn = this.#taxon.getCommonNames();
        if (cn.length > 0) {
            html += HTML.textElement("div", cn.join(", "), {
                class: "section common-names",
            });
        }

        html += HTML.textElement(
            "div",
            this.#taxon.getStatusDescription(this.#config),
            { class: "section native-status" },
        );

        const family = this.#taxon.getFamily();
        html += HTML.wrap(
            "div",
            HTML.textElement("span", "Family:", { class: "label" }) +
                HTML.getLink("./" + family.getFileName(), family.getName()),
            { class: "section" },
        );

        html += this.#getRarityInfo();

        html += "</div>";

        html += HTMLTaxon.getFlowerInfo(this.#taxon, undefined, false);

        html += this.getMarkdown();

        html += '<div class="grid borders">';
        html += HTMLTaxon.getListSectionHTML(
            this.#getInfoLinks(),
            "References",
            "info",
        );
        html += HTMLTaxon.getListSectionHTML(
            this.#getObsLinks(),
            "Observations",
            "obs",
        );
        html += HTMLTaxon.getListSectionHTML(
            this.#getRelatedTaxaLinks(),
            "Related Species",
            "rel-taxa",
        );
        html += HTMLTaxon.getListSectionHTML(
            this.#getSynonyms(),
            "Synonyms",
            "synonyms",
        );
        html += "</div>";

        html += HTMLTaxon.getFooterHTML(this.#taxon);

        const photos = this.#taxon.getPhotos().slice(0, 5);
        if (photos.length > 0) {
            let photosHtml = "";
            for (const photo of photos) {
                photosHtml += `
          <figure class="col">
            <a href="${photo.getSourceUrl()}">
              <img
                class="img-fluid"
                src="${photo.getUrl()}"
              />
            </a>
            <figcaption>
              ${photo.getAttribution()}
            </figcaption>
          </figure>
        `;
            }
            html += `
        <h2>Photos</h2>
        <div class="row">
          ${photosHtml}
        </div>
      `;
        }

        this.writeFile(html);
    }
}

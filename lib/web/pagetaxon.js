import { Jepson } from "../jepson.js";
import { RarePlants } from "../rareplants.js";
import { GenericPage } from "../genericpage.js";
import { ExternalSites } from "../externalsites.js";
import { HTML } from "../html.js";
import { HTMLTaxon } from "../htmltaxon.js";
import { Config } from "../config.js";

class PageTaxon extends GenericPage {
    #config;
    #taxon;

    /**
     * @param {string} outputDir
     * @param {Config} config
     * @param {Taxon} taxon
     */
    constructor(outputDir, config, taxon) {
        super(outputDir, taxon.getName(), taxon.getBaseFileName());
        this.#config = config;
        this.#taxon = taxon;
    }

    #getInfoLinks() {
        const links = [];
        const jepsonID = this.#taxon.getJepsonID();
        if (jepsonID) {
            links.push(Jepson.getEFloraLink(jepsonID));
        }
        const cfLink = this.#taxon.getCalfloraTaxonLink();
        if (cfLink) {
            links.push(cfLink);
        }
        const iNatLink = this.#taxon.getINatTaxonLink();
        if (iNatLink) {
            links.push(iNatLink);
        }
        const calscapeLink = HTMLTaxon.getCalscapeLink(this.#taxon);
        if (calscapeLink) {
            links.push(calscapeLink);
        }
        const rpiLink = this.#taxon.getRPITaxonLink();
        if (rpiLink) {
            links.push(rpiLink);
        }
        return links;
    }

    #getObsLinks() {
        const links = [];
        links.push(
            HTML.getLink(
                "https://www.calflora.org/entry/observ.html?track=m#srch=t&grezc=5&cols=b&lpcli=t&cc=" +
                    this.#config.getCountyCodes().join("!") +
                    "&incobs=f&taxon=" +
                    this.#taxon.getCalfloraName().replaceAll(" ", "+"),
                "Calflora",
                {},
                true,
            ),
        );
        const iNatID = this.#taxon.getINatID();
        if (iNatID) {
            links.push(
                HTML.getLink(
                    ExternalSites.getInatObsLink({
                        project_id: this.#config.getConfigValue(
                            "inat",
                            "project_id",
                        ),
                        subview: "map",
                        taxon_id: iNatID,
                    }),
                    "iNaturalist",
                    {},
                    true,
                ),
            );
        }

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
                    this.#taxon.getRPIRankAndThreatTooltip(),
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
                        taxon.getHTMLLink(
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

        const footerTextPath =
            Config.getPackageDir() +
            "/data/text/" +
            this.getBaseFileName() +
            ".footer.md";
        html += HTMLTaxon.getMarkdownSection(footerTextPath);

        const photos = this.#taxon.getPhotos();
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
              ${photo.rights === "CC0" ? "By" : "(c)"}
              ${photo.rightsHolder}
              ${photo.rights && `(${photo.rights})`}
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

export { PageTaxon };

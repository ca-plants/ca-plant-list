import { Jepson } from "../jepson.js";
import { RarePlants } from "../rareplants.js";
import { GenericPage } from "../genericpage.js";
import { ExternalSites } from "../externalsites.js";
import { HTML } from "../html.js";
import { HTMLTaxon } from "../htmltaxon.js";
import { Markdown } from "../markdown.js";
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
        true
      )
    );
    const iNatID = this.#taxon.getINatID();
    if (iNatID) {
      const projectId = links.push(
        HTML.getLink(
          ExternalSites.getInatObsLink({
            project_id: this.#config.getConfigValue("inat", "project_id"),
            subview: "map",
            taxon_id: iNatID,
          }),
          "iNaturalist",
          {},
          true
        )
      );
    }

    return links;
  }

  /**
   * @param {string[]} list
   * @param {string} header
   * @param {string} className
   */
  #getListSectionHTML(list, header, className) {
    let html = "";
    if (list.length > 0) {
      html += '<div class="section nobullet ' + className + '">';
      html += HTML.textElement("h2", header);
      html += "<ul>";
      html += HTML.arrayToLI(list);
      html += "</ul>";
      html += "</div>";
    }
    return html;
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
      }) + HTML.getToolTip(cnpsRank, this.#taxon.getRPIRankAndThreatTooltip())
    );
    if (this.#taxon.getCESA()) {
      ranks.push(
        HTML.textElement("span", "CESA:", { class: "label" }) +
          RarePlants.getCESADescription(this.#taxon.getCESA())
      );
    }

    return HTML.wrap("div", "<ul>" + HTML.arrayToLI(ranks) + "</ul>", {
      class: "section",
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
            taxon.getHTMLLink(taxon.getName() !== this.#taxon.getName())
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
      { class: "section native-status" }
    );

    const family = this.#taxon.getFamily();
    html += HTML.wrap(
      "div",
      HTML.textElement("span", "Family:", { class: "label" }) +
        HTML.getLink("./" + family.getFileName(), family.getName()),
      { class: "section" }
    );

    html += this.#getRarityInfo();

    html += "</div>";

    html += HTMLTaxon.getFlowerInfo(this.#taxon, undefined, false);

    html += this.getMarkdown();

    html += '<div class="grid borders">';
    html += this.#getListSectionHTML(
      this.#getInfoLinks(),
      "References",
      "info"
    );
    html += this.#getListSectionHTML(
      this.#getObsLinks(),
      "Observations",
      "obs"
    );
    html += this.#getListSectionHTML(
      this.#getRelatedTaxaLinks(),
      "Related Species",
      "rel-taxa"
    );
    html += this.#getListSectionHTML(
      this.#getSynonyms(),
      "Synonyms",
      "synonyms"
    );
    html += "</div>";

    const footerTextPath =
      Config.getPackageDir() +
      "/data/text/" +
      this.getBaseFileName() +
      ".footer.md";
    const footerMarkdown = Markdown.fileToHTML(footerTextPath);
    if (footerMarkdown) {
      html += HTML.wrap("div", footerMarkdown, "section");
    }

    this.writeFile(html);
  }
}

export { PageTaxon };

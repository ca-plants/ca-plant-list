import imageSize from "image-size";
import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { Markdown } from "../../markdown.js";
import { HTMLTaxon } from "../../htmltaxon.js";
import { Config } from "../../config.js";
import { Files } from "../../files.js";

class TaxonPage extends EBookPage {
    #outputDir;
    #taxon;
    #photos;

    /**
     * @param {string} outputDir
     * @param {Taxon} taxon
     * @param {Image[]} photos
     */
    constructor(outputDir, taxon, photos) {
        super(outputDir + "/" + taxon.getFileName(), taxon.getName());
        this.#outputDir = outputDir;
        this.#taxon = taxon;
        this.#photos = photos;
    }

    renderPageBody() {
        /**
         * @param {string} name
         */
        function renderCustomText(name) {
            // See if there is custom text.
            const fileName =
                Config.getPackageDir() + "/data/text/" + name + ".md";
            if (!Files.exists(fileName)) {
                return "";
            }
            const text = Files.read(fileName);
            return Markdown.strToHTML(text);
        }

        const name = this.#taxon.getName();
        let html = XHTML.textElement("h1", name);

        const family = this.#taxon.getFamily();
        html += XHTML.wrap(
            "div",
            XHTML.getLink(family.getFileName(), family.getName()),
            { class: "section" }
        );

        const cn = this.#taxon.getCommonNames();
        if (cn && cn.length > 0) {
            html += XHTML.textElement("div", cn.join(", "), {
                class: "section",
            });
        }

        html += HTMLTaxon.getFlowerInfo(this.#taxon, "section flr");

        html += renderCustomText(this.#taxon.getBaseFileName());

        if (this.#photos) {
            let photoHTML = "";
            for (const photo of this.#photos) {
                const src = photo.getSrc();
                const dimensions = imageSize.imageSize(
                    this.#outputDir + "/" + src
                );
                let img = XHTML.textElement("img", "", {
                    src: src,
                    style: "max-width:" + dimensions.width + "px",
                });
                const caption = photo.getCaption();
                if (caption) {
                    img += XHTML.textElement("figcaption", caption);
                }
                photoHTML += XHTML.wrap("figure", img);
            }
            if (photoHTML) {
                html += XHTML.wrap("div", photoHTML);
            }
        }

        return html;
    }
}

export { TaxonPage };

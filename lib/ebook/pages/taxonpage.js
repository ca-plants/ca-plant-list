import { EBookPage } from "../ebookpage.js";
import { XHTML } from "../xhtml.js";
import { Markdown } from "../../markdown.js";
import { HTMLTaxon } from "../../htmltaxon.js";
import { Config } from "../../config.js";
import { Files } from "../../files.js";
import { Images } from "../images.js";
import imageSize from "image-size";

class TaxonPage extends EBookPage {
    #taxon;
    #images;

    /**
     * @param {string} outputDir
     * @param {Taxon} taxon
     * @param {Images} images
     */
    constructor(outputDir, taxon, images) {
        super(outputDir + "/" + taxon.getFileName(), taxon.getName());
        this.#taxon = taxon;
        this.#images = images;
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
            { class: "section" },
        );

        const cn = this.#taxon.getCommonNames();
        if (cn && cn.length > 0) {
            html += XHTML.textElement("div", cn.join(", "), {
                class: "section",
            });
        }

        html += HTMLTaxon.getFlowerInfo(this.#taxon, "section flr");

        html += renderCustomText(this.#taxon.getBaseFileName());

        const photos = Images.getTaxonPhotos(this.#taxon);

        let photoHTML = "";
        for (const photo of photos) {
            const dimensions = imageSize.imageSize(
                this.#images.getCompressedFilePath(photo),
            );
            let img = XHTML.textElement("img", "", {
                src: this.#images.getCompressedImagePath(photo),
                style: "max-width:" + dimensions.width + "px",
            });
            const caption = `${photo.rights === "CC0" ? "By" : "(c)"} ${photo.rightsHolder} ${photo.rights && `(${photo.rights})`}`;
            if (caption) {
                img += XHTML.textElement("figcaption", caption);
            }
            photoHTML += XHTML.wrap("figure", img);
        }
        if (photoHTML) {
            html += XHTML.wrap("div", photoHTML);
        }

        return html;
    }
}

export { TaxonPage };

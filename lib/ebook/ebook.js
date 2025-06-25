import * as fs from "node:fs";
import { default as archiver } from "archiver";
import { XHTML } from "./xhtml.js";
import { Config } from "../config.js";

const MEDIA_TYPES = {
    SVG: "image/svg+xml",
    JPG: "image/jpeg",
    XHTML: "application/xhtml+xml",
};

/**
 * @type {Object<string,string>}
 */
const EXT_MEDIA_MAP = {
    jpeg: MEDIA_TYPES.JPG,
    jpg: MEDIA_TYPES.JPG,
    svg: MEDIA_TYPES.SVG,
};

class EBook {
    #outputDir;
    #filename;
    #pub_id;
    #title;

    /**
     * @param {string} outputDir
     * @param {string} filename
     * @param {string} pub_id
     * @param {string} title
     */
    constructor(outputDir, filename, pub_id, title) {
        this.#outputDir = outputDir;
        this.#filename = filename;
        this.#pub_id = pub_id;
        this.#title = title;

        // Initialize output directory.
        fs.rmSync(this.#outputDir, { force: true, recursive: true });
        fs.mkdirSync(this.getContentDir(), { recursive: true });
    }

    async create() {
        const contentDir = this.getContentDir();

        this.#createContainerFile();
        await this.createPages();
        this.#createPackageFile();

        // Copy assets
        fs.cpSync(Config.getPackageDir() + "/ebook", contentDir, {
            recursive: true,
        });

        this.createZip();
    }

    #createContainerFile() {
        const metaDir = this.#getMetaDir();

        fs.mkdirSync(metaDir, { recursive: true });

        let xml =
            '<?xml version="1.0"?>' +
            '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">';

        xml +=
            '<rootfiles><rootfile full-path="epub/package.opf" media-type="application/oebps-package+xml" /></rootfiles>';
        xml += "</container>";

        fs.writeFileSync(metaDir + "/container.xml", xml);
    }

    #createPackageFile() {
        const dir = this.getContentDir();

        let xml =
            '<?xml version="1.0"?>\n' +
            '<package version="3.0" xml:lang="en" xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id">';

        xml += this.#renderMetadata();
        xml += this.#renderManifest();
        xml += this.#renderSpine();

        xml += "</package>";

        fs.writeFileSync(dir + "/package.opf", xml);
    }

    async createPages() {
        throw new Error("must be implemented by subclass");
    }

    createZip() {
        // Create zip.
        const filename = this.#outputDir + "/" + this.#filename + ".epub";
        const output = fs.createWriteStream(filename);
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Sets the compression level.
        });

        archive.pipe(output);

        archive.append("application/epub+zip", {
            name: "mimetype",
            store: true,
        });

        archive.directory(this.#getMetaDir(), "META-INF");
        archive.directory(this.getContentDir(), "epub");

        archive.finalize();
    }

    getContentDir() {
        return this.#outputDir + "/epub";
    }

    /**
     * @param {string} id
     * @param {string} href
     * @param {string} mediaType
     */
    static getManifestEntry(id, href, mediaType = MEDIA_TYPES.XHTML) {
        return (
            '<item id="' +
            id +
            '" href="' +
            href +
            '" media-type="' +
            mediaType +
            '" />'
        );
    }

    /**
     * @param {string} ext
     */
    static getMediaTypeForExt(ext) {
        return EXT_MEDIA_MAP[ext];
    }

    /**
     * @param {string} id
     */
    static getSpineEntry(id) {
        return '<itemref idref="' + id + '"/>';
    }

    #getMetaDir() {
        return this.#outputDir + "/META-INF";
    }

    #renderManifest() {
        let xml = "<manifest>";
        xml += '<item id="c0" href="css/main.css" media-type="text/css" />';
        xml += this.renderManifestEntries();
        xml +=
            '<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav" />';
        return xml + "</manifest>";
    }

    renderManifestEntries() {
        throw new Error("must be implemented by subclass");
    }

    #renderMetadata() {
        let xml = '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">';
        xml += XHTML.textElement("dc:identifier", this.#pub_id, {
            id: "pub-id",
        });
        xml += "<dc:language>en-US</dc:language>";
        xml += XHTML.textElement("dc:title", this.#title);
        const d = new Date();
        d.setUTCMilliseconds(0);
        xml +=
            '<meta property="dcterms:modified">' +
            d.toISOString().replace(".000", "") +
            "</meta>";
        return xml + "</metadata>";
    }

    #renderSpine() {
        let xml = "<spine>";
        xml += '<itemref idref="toc"/>';
        xml += this.renderSpineElements();
        return xml + "</spine>";
    }

    renderSpineElements() {
        throw new Error("must be implemented by subclass");
    }
}

export { EBook };

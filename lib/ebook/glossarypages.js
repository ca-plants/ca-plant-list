import { GlossaryPages as BaseGlossaryPages } from "../web/glossarypages.js";
import { EBook } from "./ebook.js";

class GlossaryPages extends BaseGlossaryPages {
    /**
     * @param {SiteGenerator} siteGenerator
     */
    constructor(siteGenerator) {
        super(siteGenerator);
    }

    getManifestEntries() {
        const glossaryEntries = this.getGlossary().getEntries();
        const manifestEntries = [];

        manifestEntries.push(EBook.getManifestEntry("g", "glossary.html"));
        for (let index = 0; index < glossaryEntries.length; index++) {
            const entry = glossaryEntries[index];
            manifestEntries.push(
                EBook.getManifestEntry(
                    "g" + index,
                    "g/" + entry.getHTMLFileName()
                )
            );
        }

        return manifestEntries.join("");
    }

    getSpineEntries() {
        const glossaryEntries = this.getGlossary().getEntries();
        const spineEntries = [];

        spineEntries.push(EBook.getSpineEntry("g"));
        for (let index = 0; index < glossaryEntries.length; index++) {
            spineEntries.push(EBook.getSpineEntry("g" + index));
        }

        return spineEntries.join("");
    }
}

export { GlossaryPages };

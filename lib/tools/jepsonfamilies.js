import path from "node:path";
import { Files } from "../files.js";
import { scrape } from "@htmltools/scrape";

export class JepsonFamilies {
    /**
     * @param {string} toolsDataDir
     * @param {string} outputdir
     */
    static async build(toolsDataDir, outputdir) {
        const url = "https://ucjeps.berkeley.edu/eflora/toc.html";
        const indexFileName = path.basename(url);
        const toolsDataPath = toolsDataDir + "/jepsonfam";
        const indexFilePath = toolsDataPath + "/" + indexFileName;

        // Create data directory if it's not there.
        Files.mkdir(toolsDataPath);

        // Download the data file if it doesn't exist.
        if (!Files.exists(indexFilePath)) {
            console.log("retrieving Jepson family index");
            await Files.fetch(url, indexFilePath);
        }

        const document = scrape.parseFile(indexFilePath);

        const body = scrape.getSubtree(document, (t) => t.tagName === "body");
        if (!body) {
            throw new Error();
        }
        const contentDiv = scrape.getSubtree(
            body,
            (t) => scrape.getAttr(t, "id") === "content",
        );
        if (!contentDiv) {
            throw new Error();
        }
        const rows = scrape.getSubtrees(contentDiv, (t) => t.tagName === "tr");

        this.#parseRows(outputdir, rows);
    }

    /**
     * @param {string} toolsDataPath
     * @param {import("@htmltools/scrape").Element[]} rows
     */
    static #parseRows(toolsDataPath, rows) {
        /** @type {Object<string,{section:string,id:string}>} */
        const families = {};
        /** @type {Object<string,{family:string,id:string}>} */
        const genera = {};

        for (const row of rows) {
            const cols = scrape.getSubtrees(row, (t) => t.tagName === "td");
            if (!cols || cols.length < 3) {
                continue;
            }

            // Find the section.
            const section = scrape.getTextContent(cols[0].children[0]);

            // Find the family name and ID.
            const familyLink = cols[1].children[0];
            if (familyLink.type !== "element") {
                throw new Error();
            }
            const familyTarget = scrape.getAttr(familyLink, "href");
            if (!familyTarget) {
                throw new Error();
            }
            const familyID = familyTarget.split("=")[1];
            const familyName = scrape.getTextContent(familyLink.children[0]);
            families[familyName] = { section: section, id: familyID };

            // Find all the genera.
            const genusLinks = scrape.getSubtrees(
                cols[2],
                (t) => t.tagName === "a",
            );
            for (const genusLink of genusLinks) {
                const genusTarget = scrape.getAttr(genusLink, "href");
                if (!genusTarget) {
                    throw new Error();
                }
                const genusID = genusTarget.split("=")[1];
                const genusName = scrape.getTextContent(genusLink.children[0]);
                genera[genusName] = { family: familyName, id: genusID };
            }
        }

        Files.write(
            toolsDataPath + "/families.json",
            JSON.stringify(families, undefined, 4),
            true,
        );
        Files.write(
            toolsDataPath + "/genera.json",
            JSON.stringify(genera, undefined, 4),
            true,
        );
    }
}

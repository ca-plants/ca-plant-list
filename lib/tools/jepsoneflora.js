import { scrape } from "@htmltools/scrape";
import { Files } from "../files.js";
import { SynCSV } from "./syncsv.js";

/**
 * @typedef {{
 * id:string,
 * name:string,
 * common?:string,
 * type:string,
 * }} JepsonTaxon
 */

/** @type {Object<string,string>} */
const TYPES = {
    EX_ALIEN: "Extirpated alien",
    HYBRID_SPONT: "Spontaneous hybrid",
    ILLEGITIMATE: "Illegitimate name",
    INVALID: "Invalid name",
    INVALID_NOTED: "Noted name", // "auct. non" = misapplied name
    INVALID_SUPERFLUOUS: "Superfluous name",
    MENTIONED: "Mentioned in a note",
    MISAPPLIED: "Misapplied name",
    MISAPP_PART: "Misapplied name, in part",
    MISAPP_UNABRIDGED: "Unabridged misapplied name",
    MISAPP_UNABRIDGED_PART: "Unabridged misapplied name, in part",
    NATIVE: "Native",
    NATIVITY_UNCERTAIN: "Native or naturalized",
    NATURALIZED: "Naturalized",
    POSSIBLY_IN_CA: "Possibly in ca",
    SYNONYM: "Synonym",
    SYN_INED: "Synonym ined.", //nomen ineditum, unpublished name; name not published or not validly published
    SYN_ORTH_VARIANT: "Orthographic variant",
    SYN_PART: "Synonym, in part",
    SYN_PART_UN: "Unabridged synonym, in part",
    WAIF: "Waif",
    WAIF_EX: "Extirpated waif",
    WAIF_HIST: "Historical waif",
    WEED: "* weed*",
};

export class JepsonEFlora {
    #toolsDataPath;
    #taxa;
    #errorLog;

    /** @type {Map<string,JepsonTaxon>} */
    #nameInfo = new Map();
    /** @type {Map<string,string[]>} */
    #synInfo = new Map();
    /** @type {Set<string>} */
    #loadedLetters = new Set();
    /** @type {import("./syncsv.js").SynData[]} */
    #synonymsToAdd = [];

    /**
     * @param {string} toolsDataDir
     * @param {Taxa} taxa
     * @param {ErrorLog} errorLog
     */
    constructor(toolsDataDir, taxa, errorLog) {
        this.#toolsDataPath = toolsDataDir + "/jepson-eflora";
        this.#taxa = taxa;
        this.#errorLog = errorLog;
    }

    /**
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {boolean} update
     */
    async analyze(exceptions, update) {
        // Create data directory if it's not there.
        Files.mkdir(this.#toolsDataPath);

        for (const taxon of this.#taxa.getTaxonList()) {
            const name = taxon.getName();
            if (name.includes(" unknown")) {
                continue;
            }

            const jepsInfo = await this.#getJepsInfo(name);
            if (jepsInfo === undefined) {
                // Not found in the index.
                if (!exceptions.hasException(name, "jepson", "notineflora")) {
                    this.#errorLog.log(name, "not found in eFlora index");
                }
                continue;
            }

            if (taxon.getJepsonID() !== jepsInfo.id) {
                this.#errorLog.log(
                    name,
                    "Jepson ID does not match ID from eFlora index",
                    taxon.getJepsonID(),
                    jepsInfo.id,
                );
            }

            const efStatus = this.#getStatusCode(jepsInfo);
            const taxonStatus = taxon.getStatus();
            if (
                efStatus !== taxonStatus &&
                !(taxonStatus === "NC" && efStatus === "N")
            ) {
                this.#errorLog.log(
                    name,
                    "Jepson eFlora index has different nativity status than taxa.csv",
                    JSON.stringify(efStatus),
                    taxonStatus,
                );
            }
        }

        this.#checkSynonyms();
        this.#checkExceptions(exceptions);

        if (update) {
            this.#updateSynCSV();
        }
    }

    /**
     * @param {import("../exceptions.js").Exceptions} exceptions
     */
    #checkExceptions(exceptions) {
        // Check the Jepson exceptions and make sure they still apply.
        for (const [name, v] of exceptions.getExceptions()) {
            const exceptions = v.jepson;
            if (!exceptions) {
                continue;
            }

            // Make sure the taxon is still in our list.
            const taxon = this.#taxa.getTaxon(name);
            if (!taxon) {
                // Don't process global exceptions if taxon is not in local list.
                if (this.#taxa.isSubset() && !v.local) {
                    continue;
                }
                this.#errorLog.log(
                    name,
                    "has Jepson exceptions but is not in taxa.tsv",
                );
                continue;
            }

            for (const [k] of Object.entries(exceptions)) {
                const jepsonData = this.#nameInfo.get(name);
                switch (k) {
                    case "notineflora":
                        // Make sure it is really not in eFlora.
                        if (jepsonData) {
                            this.#errorLog.log(
                                name,
                                "has Jepson notineflora exception but is in eFlora",
                            );
                        }
                        break;
                    default:
                        this.#errorLog.log(
                            name,
                            "unrecognized Jepson exception",
                            k,
                        );
                }
            }
        }
    }

    #checkSynonyms() {
        // Make sure all synonyms in eFlora are in our list.
        for (const [synName, targetNames] of this.#synInfo.entries()) {
            for (const targetName of targetNames) {
                const taxon = this.#taxa.getTaxon(targetName);
                if (!taxon) {
                    // We're not tracking the target.
                    continue;
                }

                if (taxon.getSynonyms().includes(synName)) {
                    // Already have it.
                    continue;
                }

                this.#errorLog.log(
                    targetName,
                    "does not have synonym",
                    synName + "," + targetName,
                );
                this.#synonymsToAdd.push({
                    Former: synName,
                    Current: targetName,
                });
            }
        }

        // Make sure everything in our list is in eFlora.
        for (const taxon of this.#taxa.getTaxonList()) {
            for (const synonym of taxon.getSynonyms()) {
                const synInfo = this.#synInfo.get(synonym);
                if (!synInfo || !synInfo.includes(taxon.getName())) {
                    // Ignore iNat synonyms.
                    if (synonym !== taxon.getINatSyn()) {
                        this.#errorLog.log(
                            synonym,
                            `is in synonyms.csv but is not a synonym for ${taxon.getName()} in eFlora`,
                        );
                    }
                }
            }
        }
    }

    /**
     * @param {string} name
     * @returns {Promise<JepsonTaxon|undefined>}
     */
    async #getJepsInfo(name) {
        const firstLetter = name[0];
        // See if this index has been loaded.
        if (!this.#loadedLetters.has(firstLetter)) {
            await this.#loadNameIndex(firstLetter);
        }

        return this.#nameInfo.get(name);
    }

    /**
     * @param {JepsonTaxon} jepsInfo
     * @returns {StatusCode|undefined}
     */
    #getStatusCode(jepsInfo) {
        switch (jepsInfo.type) {
            case TYPES.NATIVE:
                return "N";
            case TYPES.NATIVITY_UNCERTAIN:
                return "U";
            default:
                return "X";
        }
    }

    /**
     * @param {string} firstLetter
     */
    async #loadNameIndex(firstLetter) {
        /**
         *
         * @param {string} url
         * @param {string} targetFile
         * @returns {Promise<Headers|undefined>}
         */
        async function retrieveIfNotFound(url, targetFile) {
            // Retrieve file if it's not there.
            if (Files.exists(targetFile)) {
                return;
            }
            console.log("retrieving " + targetFile);
            await Files.fetch(url, targetFile);
        }

        const fileName = "index_" + firstLetter + ".html";
        const filePath = this.#toolsDataPath + "/" + fileName;
        const url =
            "https://ucjeps.berkeley.edu/eflora/eflora_index.php?index=" +
            firstLetter;

        await retrieveIfNotFound(url, filePath);

        const document = scrape.parseFile(filePath);
        this.#parseIndex(document);

        this.#loadedLetters.add(firstLetter);
    }

    /**
     * @param {import("@htmltools/scrape").Root} docTree
     */
    #parseIndex(docTree) {
        const validTypes = Object.values(TYPES);
        const reUnder = /\(Under (.*)\)/;

        const contentDiv = scrape.getSubtree(
            docTree,
            (t) => scrape.getAttr(t, "class") === "eFloraTable",
        );
        if (!contentDiv) {
            throw new Error();
        }
        const rows = scrape.getSubtrees(contentDiv, (t) => t.tagName === "tr");

        for (const row of rows) {
            const cols = scrape.getSubtrees(row, (t) => t.tagName === "td");
            if (!cols || cols.length < 3) {
                continue;
            }

            const links = scrape.getSubtrees(cols[0], (t) => t.tagName === "a");
            // Should be at least one link for a species row.
            if (!links || links.length === 0) {
                continue;
            }

            let type = scrape.getTextContent(cols[2]);
            if (!type) {
                // Some species are lacking a type; if it's one we're tracking, errors will show elsewhere, so ignore for now.
                continue;
            }

            const linkText = scrape.getTextContent(links[0]);
            if (!linkText.includes(" ")) {
                // It's a genus name, ignore it.
                continue;
            }

            if (type.includes(" weed")) {
                type = TYPES.WEED;
            }
            if (!validTypes.includes(type)) {
                throw new Error(
                    "unrecognized type for " + linkText + ": " + type,
                );
            }

            const common = scrape.getTextContent(cols[1]);
            const name = linkText;

            const href = scrape.getAttr(links[0], "href");
            if (!href) {
                throw new Error();
            }
            const id = href.split("=")[1];

            const sciNameText = scrape.getTextContent(cols[0]);
            let under;
            if (sciNameText) {
                const m = sciNameText.match(reUnder);
                if (m) {
                    under = m[1];
                }
            }

            switch (type) {
                case TYPES.NATIVE:
                case TYPES.NATIVITY_UNCERTAIN:
                case TYPES.NATURALIZED:
                case TYPES.NATURALIZED_UW:
                case TYPES.SYNONYM:
                case TYPES.WAIF:
                case TYPES.WEED:
                    break;
                default:
                    continue;
            }

            if (type === TYPES.SYNONYM) {
                // Should have "under".
                if (!under) {
                    throw new Error();
                }
                // If we're not tracking the target, ignore this entry.
                if (!this.#taxa.getTaxon(under)) {
                    continue;
                }

                // Add to synonyms.
                let targetNames = this.#synInfo.get(name);
                if (!targetNames) {
                    targetNames = [];
                    this.#synInfo.set(name, targetNames);
                }
                targetNames.push(under);
                continue;
            }

            // Not a synonym. Should not have "under".
            if (under) {
                throw new Error(`under = ${under} for ${name}`);
            }

            // If we're not tracking either the source, ignore this entry.
            if (!this.#taxa.getTaxon(name)) {
                continue;
            }

            if (this.#nameInfo.get(name)) {
                throw new Error();
            }
            this.#nameInfo.set(name, {
                id: id,
                type: type,
                name: name,
                common: common,
            });
        }
    }

    #updateSynCSV() {
        const csv = new SynCSV("./data");
        const data = csv.getData();
        data.push(...this.#synonymsToAdd);
        csv.write();
    }
}

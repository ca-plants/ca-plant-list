import * as path from "path";
import { CSV } from "../csv.js";
import { Files } from "../files.js";
import { TaxaCSV } from "./taxacsv.js";

const CALFLORA_URL_ALL =
    "https://www.calflora.org/app/downtext?xun=117493&table=species&format=Tab&cols=0,1,4,5,8,38,41,43&psp=lifeform::grass,Tree,Herb,Fern,Shrub,Vine!!&par=f&active=";
const CALFLORA_URL_COUNTY =
    "https://www.calflora.org/app/downtext?xun=117493&table=species&format=Tab&cols=0,1,4,5,8,38,41,43&psp=countylist::ALA,CCA!!&active=1";

/**
 * @typedef {{
 * Taxon:string,
 * "Native Status":string,
 * TJMTID:string
 * "Active in Calflora?":string
 * Calrecnum:string
 * }} CalfloraData
 */

export class Calflora {
    /** @type {Object<string,CalfloraData>} */
    static #taxa = {};

    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {import("../taxa.js").Taxa} taxa
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     * @param {boolean} update
     */
    static async analyze(
        toolsDataDir,
        dataDir,
        taxa,
        exceptions,
        errorLog,
        update,
    ) {
        /**
         * @param {string} url
         * @param {string} targetFile
         */
        async function retrieveCalfloraFile(url, targetFile) {
            // Retrieve file if it's not there.
            targetFile = toolsDataPath + "/" + targetFile;
            if (Files.exists(targetFile)) {
                return;
            }
            console.log("retrieving " + targetFile);
            await Files.fetch(url, targetFile);
        }

        const toolsDataPath = toolsDataDir + "/calflora";
        // Create data directory if it's not there.
        Files.mkdir(toolsDataPath);

        const calfloraDataFileNameActive = "calflora_taxa_active.tsv";
        const calfloraDataFileNameCounties = "calflora_taxa_counties.tsv";

        await retrieveCalfloraFile(
            CALFLORA_URL_ALL + "1",
            calfloraDataFileNameActive,
        );
        // County list and "all" lists are both incomplete; load everything to get as much as possible.
        await retrieveCalfloraFile(
            CALFLORA_URL_COUNTY,
            calfloraDataFileNameCounties,
        );

        /** @type {CalfloraData[]} */
        // @ts-ignore
        const csvActive = CSV.readFile(
            path.join(toolsDataPath, calfloraDataFileNameActive),
        );
        /** @type {CalfloraData[]} */
        // @ts-ignore
        const csvCounties = CSV.readFile(
            path.join(toolsDataPath, calfloraDataFileNameCounties),
        );

        for (const row of csvActive) {
            this.#taxa[row["Taxon"]] = row;
        }
        for (const row of csvCounties) {
            this.#taxa[row["Taxon"]] = row;
        }

        const idsToUpdate = new Map();

        for (const taxon of taxa.getTaxonList()) {
            const name = taxon.getName();
            if (name.includes(" unknown")) {
                continue;
            }
            const cfName = taxon.getCalfloraName();
            const cfData = Calflora.#taxa[cfName];
            if (!cfData) {
                if (
                    !exceptions.hasException(name, "calflora", "notintaxondata")
                ) {
                    errorLog.log(name, "not found in Calflora files");
                }
                continue;
            }

            // Check native status.
            const cfNative = cfData["Native Status"];
            let cfIsNative = cfNative === "rare" || cfNative === "native";
            // Override if exception is specified.
            const nativeException = exceptions.getValue(
                name,
                "calflora",
                "native",
                undefined,
            );
            if (typeof nativeException === "boolean") {
                if (nativeException === cfIsNative) {
                    errorLog.log(
                        name,
                        "has unnecessary Calflora native override",
                    );
                }
                cfIsNative = nativeException;
            }
            if (cfIsNative !== taxon.isCANative()) {
                errorLog.log(
                    name,
                    "has different nativity status in Calflora",
                    cfIsNative.toString(),
                );
            }

            // Check if it is active in Calflora.
            const isActive = cfData["Active in Calflora?"];
            if (isActive !== "YES") {
                errorLog.log(name, "is not active in Calflora", isActive);
            }

            // Check Jepson IDs.
            const cfJepsonID = cfData.TJMTID;
            if (cfJepsonID !== taxon.getJepsonID()) {
                if (
                    !exceptions.hasException(name, "calflora", "badjepsonid") &&
                    !exceptions.hasException(name, "calflora", "notintaxondata")
                ) {
                    errorLog.log(
                        name,
                        "Jepson ID in Calflora is different than taxa.csv",
                        cfJepsonID,
                        taxon.getJepsonID(),
                    );
                }
            }

            // Check Calflora ID.
            const cfID = cfData["Calrecnum"];
            if (cfID !== taxon.getCalfloraID()) {
                errorLog.log(
                    name,
                    "Calflora ID in Calflora is different than taxa.csv",
                    cfID,
                    taxon.getCalfloraID(),
                );
                idsToUpdate.set(name, cfID);
            }
        }

        this.#checkExceptions(taxa, exceptions, errorLog);

        if (update) {
            this.#updateIds(dataDir, idsToUpdate);
        }
    }

    /**
     * @param {import("../taxa.js").Taxa} taxa
     * @param {import("../exceptions.js").Exceptions} exceptions
     * @param {import("../errorlog.js").ErrorLog} errorLog
     */
    static #checkExceptions(taxa, exceptions, errorLog) {
        // Check the Calflora exceptions and make sure they still apply.
        for (const [name, v] of exceptions.getExceptions()) {
            const exceptions = v.calflora;
            if (!exceptions) {
                continue;
            }

            // Make sure the taxon is still in our list.
            const taxon = taxa.getTaxon(name);
            if (!taxon) {
                // Don't process global exceptions if taxon is not in local list.
                if (taxa.isSubset() && !v.local) {
                    continue;
                }
                errorLog.log(
                    name,
                    "has Calflora exceptions but not in Taxa collection",
                );
                continue;
            }

            for (const [k] of Object.entries(exceptions)) {
                const cfData = Calflora.#taxa[name];
                switch (k) {
                    case "badjepsonid": {
                        // Make sure Jepson ID is still wrong.
                        const cfID = cfData.TJMTID;
                        const jepsID = taxon.getJepsonID();
                        if (cfID === jepsID) {
                            errorLog.log(
                                name,
                                "has Calflora badjepsonid exception but IDs are the same",
                            );
                        }
                        break;
                    }
                    case "native":
                        break;
                    case "notintaxondata":
                        if (cfData) {
                            errorLog.log(
                                name,
                                "found in Calflora data but has notintaxondata exception",
                            );
                        }
                        break;
                    default:
                        errorLog.log(
                            name,
                            "unrecognized Calflora exception",
                            k,
                        );
                }
            }
        }
    }

    /**
     * @param {string} dataDir
     * @param {Map<string,string>} idsToUpdate
     */
    static #updateIds(dataDir, idsToUpdate) {
        const taxa = new TaxaCSV(dataDir);

        for (const taxonData of taxa.getTaxa()) {
            const id = idsToUpdate.get(taxonData.taxon_name);
            if (!id) {
                continue;
            }
            taxonData["calrecnum"] = id;
        }

        taxa.write();
    }
}

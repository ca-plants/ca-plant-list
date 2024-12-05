import path from "node:path";
import xlsx from "exceljs";
import { Files } from "../files.js";
import { TaxaCSV } from "./taxacsv.js";
import { Taxon } from "../taxon.js";

export class Calscape {
    /**
     * @param {string} toolsDataDir
     * @param {string} dataDir
     * @param {Taxa} taxa
     * @param {ErrorLog} errorLog
     */
    static async analyze(toolsDataDir, dataDir, taxa, errorLog) {
        const calscapeData = await getCalscapeData(toolsDataDir);

        for (const taxon of taxa.getTaxonList()) {
            const taxonCN = taxon.getCalscapeCommonName();
            const calscapeCN = calscapeData.get(taxon.getCalscapeName());
            if (taxonCN !== calscapeCN) {
                errorLog.log(
                    taxon.getName(),
                    "name in Calscape data is different than taxa.csv",
                    calscapeCN ?? "undefined",
                    taxonCN ?? "undefined",
                );
            }
        }

        updateTaxaCSV(dataDir, calscapeData);
    }
}

/**
 * @param {string} toolsDataDir
 * @returns {Promise<Map<string,string>>}
 */
async function getCalscapeData(toolsDataDir) {
    /**
     * @param {import("exceljs").Cell} cell
     */
    function getCellValue(cell) {
        const value = cell.value;
        if (value === null || value === undefined) {
            return undefined;
        }
        return value.toString();
    }

    toolsDataDir = path.join(toolsDataDir, "calscape");
    Files.mkdir(toolsDataDir);
    await retrieveCalscapeFile(toolsDataDir);

    /** @type {Map<string,string>} */
    const data = new Map();

    const wb = new xlsx.Workbook();
    await wb.xlsx.readFile(getExcelFilename(toolsDataDir)).then(function () {
        const ws = wb.worksheets[0];
        let isInData = false;
        for (let index = 0; index < ws.rowCount; index++) {
            const row = ws.getRow(index);
            const col1 = getCellValue(row.getCell(1));
            if (!isInData) {
                if (col1 === "Botanical Name") {
                    isInData = true;
                }
                continue;
            }
            const col2 = getCellValue(row.getCell(2));
            if (!col1 || !col2) {
                continue;
            }
            data.set(col1, col2);
        }
    });

    return data;
}

/**
 * @param {string} toolsDataDir
 */
function getExcelFilename(toolsDataDir) {
    return path.join(toolsDataDir, "calscape.xlsx");
}

/**
 * @param {string} toolsDataDir
 */
async function retrieveCalscapeFile(toolsDataDir) {
    // Retrieve file if it's not there.
    const targetFile = getExcelFilename(toolsDataDir);
    if (Files.exists(targetFile)) {
        return;
    }
    console.info("retrieving " + targetFile);
    await Files.fetch("https://www.calscape.org/export/search/", targetFile);
}

/**
 * @param {string} dataDir
 * @param {Map<string,string>} calscapeData
 */
function updateTaxaCSV(dataDir, calscapeData) {
    const taxa = new TaxaCSV(dataDir);

    for (const taxonData of taxa.getTaxa()) {
        const taxonCN = taxonData.calscape_cn;
        const calscapeCN = calscapeData.get(
            Taxon.getCalscapeName(taxonData.taxon_name),
        );
        if (taxonCN !== calscapeCN) {
            if (calscapeCN === undefined) {
                delete taxonData.calscape_cn;
            } else {
                taxonData.calscape_cn = calscapeCN;
            }
        }
    }

    taxa.write();
}

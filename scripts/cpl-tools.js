#!/usr/bin/env node

import { Option } from "commander";
import { Program } from "../lib/program.js";
import { Calflora } from "../lib/tools/calflora.js";
import { Exceptions } from "../lib/exceptions.js";
import { ErrorLog } from "../lib/errorlog.js";
import { Calscape } from "../lib/tools/calscape.js";
import { INat } from "../lib/tools/inat.js";
import { JepsonEFlora } from "../lib/tools/jepsoneflora.js";
import { RPI } from "../lib/tools/rpi.js";
import { Config } from "../lib/config.js";
import { Taxa } from "../lib/taxonomy/taxa.js";
import { SupplementalText } from "../lib/tools/supplementaltext.js";
import { JepsonFamilies } from "../lib/tools/jepsonfamilies.js";
import { CCH2 } from "../lib/tools/cch2.js";
import { FNA } from "../lib/tools/fna.js";
import { CalIPC } from "../lib/tools/calipc.js";

const TOOLS = {
    CALFLORA: "calflora",
    CAL_IPC: "calipc",
    CALSCAPE: "calscape",
    CCH2: "cch",
    FNA: "fna",
    INAT: "inat",
    JEPSON_EFLORA: "jepson-eflora",
    JEPSON_FAM: "jepson-families",
    RPI: "rpi",
    TEXT: "text",
};

const ALL_TOOLS = [
    TOOLS.CALFLORA,
    TOOLS.CAL_IPC,
    TOOLS.CALSCAPE,
    TOOLS.CCH2,
    TOOLS.FNA,
    TOOLS.INAT,
    TOOLS.JEPSON_EFLORA,
    TOOLS.RPI,
    TOOLS.TEXT,
];

const OPT_TOOL = "tool";

const TOOLS_DATA_DIR = "./external_data";

/**
 * @param {import("commander").Command} program
 * @param {import("commander").OptionValues} options
 */
async function build(program, options) {
    let tools = options[OPT_TOOL];
    if (!tools) {
        program.help();
    }
    if (tools[0] === "all") {
        tools = ALL_TOOLS;
    }

    const exceptions = new Exceptions(options.datadir);
    const config = new Config(options.datadir);

    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);
    for (const tool of tools) {
        const taxa =
            tool === TOOLS.JEPSON_FAM
                ? undefined
                : await Taxa.loadTaxa(options);
        switch (tool) {
            case TOOLS.CALFLORA:
                await Calflora.analyze(
                    TOOLS_DATA_DIR,
                    options.datadir,
                    taxa,
                    exceptions,
                    errorLog,
                    !!options.update,
                );
                break;
            case TOOLS.CAL_IPC:
                await CalIPC.analyze(
                    TOOLS_DATA_DIR,
                    options.datadir,
                    taxa,
                    exceptions,
                    errorLog,
                    !!options.update,
                );
                break;
            case TOOLS.CALSCAPE:
                await Calscape.analyze(
                    TOOLS_DATA_DIR,
                    options.datadir,
                    taxa,
                    exceptions,
                    errorLog,
                    !!options.update,
                );
                break;
            case TOOLS.CCH2:
                await CCH2.analyze(
                    TOOLS_DATA_DIR,
                    options.datadir,
                    exceptions,
                    taxa,
                    errorLog,
                    !!options.update,
                );
                break;
            case TOOLS.FNA:
                await FNA.analyze(
                    TOOLS_DATA_DIR,
                    options.datadir,
                    taxa,
                    errorLog,
                    !!options.update,
                );
                break;

            case TOOLS.INAT:
                await INat.analyze(
                    TOOLS_DATA_DIR,
                    options.datadir,
                    taxa,
                    exceptions,
                    errorLog,
                    options.inTaxafile,
                    !!options.update,
                );
                break;
            case TOOLS.JEPSON_EFLORA: {
                const eflora = new JepsonEFlora(TOOLS_DATA_DIR, taxa, errorLog);
                await eflora.analyze(
                    options.datadir,
                    exceptions,
                    !!options.update,
                );
                break;
            }
            case TOOLS.JEPSON_FAM:
                await JepsonFamilies.build(TOOLS_DATA_DIR, "./data");
                break;
            case TOOLS.RPI:
                await RPI.analyze(
                    TOOLS_DATA_DIR,
                    taxa,
                    config,
                    exceptions,
                    errorLog,
                );
                break;
            case TOOLS.TEXT:
                SupplementalText.analyze(taxa, errorLog);
                break;
            default:
                console.log("unrecognized tool: " + tool);
                return;
        }
    }

    errorLog.write();
}

const program = Program.getProgram();
program.addOption(
    new Option(
        "-t, --tool <tool...>",
        "The tools to run. Value may be any subset of the tools below.",
    ).choices(["all"].concat(ALL_TOOLS).concat(TOOLS.JEPSON_FAM)),
);
program.option(
    "--in-taxafile <file>",
    "The name of the file containing the iNaturalist taxa. Can be used for testing on a smaller subset of the iNaturalist data.",
    "inat_taxa.csv",
);
program.option("--update", "Update taxa.csv to remove errors if possible.");
program.addHelpText(
    "after",
    `
Tools:
    'all' runs the 'calflora', '${TOOLS.CAL_IPC}', '${TOOLS.CALSCAPE}', '${TOOLS.CCH2}, '${TOOLS.FNA}, 'inat', 'jepson-eflora', 'rpi', and 'text' tools.
    '${TOOLS.CALFLORA}' retrieves data from Calflora and compares with local data.
    '${TOOLS.CAL_IPC}' retrieves data from Cal-IPC and compares with local data.
    '${TOOLS.CALSCAPE}' retrieves data from Calscape and compares with local data.
    '${TOOLS.CCH2}' retrieves data from CCH2 and compares with local data.
    '${TOOLS.FNA}' retrieves data from Flora of North America and compares with local data.
    '${TOOLS.INAT}' retrieves data from iNaturalist and compares with local data.
    '${TOOLS.JEPSON_EFLORA}' retrieves data from Jepson eFlora indexes and compares with local data.
    '${TOOLS.JEPSON_FAM}' retrieves section, family and genus data from Jepson eFlora and creates data files for use by ca-plant-list.
    '${TOOLS.RPI}' retrieves data from the CNPS Rare Plant Inventory and compares with local data.
    '${TOOLS.TEXT}' checks supplemental text files to make sure their names are referenced.
    `,
);
program.action((options) => build(program, options));

await program.parseAsync();

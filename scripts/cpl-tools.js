#!/usr/bin/env node

import * as path from "node:path";
import { Option } from "commander";
import { Taxa } from "../lib/taxa.js";
import { Program } from "../lib/program.js";
import { Calflora } from "../lib/tools/calflora.js";
import { Exceptions } from "../lib/exceptions.js";
import { ErrorLog } from "../lib/errorlog.js";

const TOOLS = {
    CALFLORA: "calflora",
    INAT: "inat",
    JEPSON_EFLORA: "jepson-eflora",
    JEPSON_FAM: "jepson-families",
    RPI: "rpi",
    TEXT: "text",
};

const ALL_TOOLS = [
    TOOLS.CALFLORA,
    TOOLS.INAT,
    TOOLS.JEPSON_EFLORA,
    TOOLS.RPI,
    TOOLS.TEXT,
];

const OPT_LOADER = "loader";
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
    // const config = new Config(options.datadir);
    const taxa = await getTaxa(options);

    const errorLog = new ErrorLog(options.outputdir + "/log.tsv", true);
    for (const tool of tools) {
        switch (tool) {
            case TOOLS.CALFLORA:
                await Calflora.analyze(
                    TOOLS_DATA_DIR,
                    taxa,
                    exceptions,
                    errorLog,
                );
                break;
            case TOOLS.INAT:
                // await INat.analyze(
                //     TOOLS_DATA_DIR,
                //     taxa,
                //     exceptions,
                //     errorLog,
                //     options.inTaxafile,
                // );
                break;
            case TOOLS.JEPSON_EFLORA: {
                // const eflora = new JepsonEFlora(
                //     TOOLS_DATA_DIR,
                //     taxa,
                //     errorLog,
                //     options.efLognotes,
                // );
                // await eflora.analyze(exceptions);
                break;
            }
            case TOOLS.JEPSON_FAM:
                // await JepsonFamilies.build(TOOLS_DATA_DIR, options.outputdir);
                break;
            case TOOLS.RPI:
                // await RPI.analyze(
                //     TOOLS_DATA_DIR,
                //     taxa,
                //     config,
                //     exceptions,
                //     errorLog,
                // );
                break;
            case TOOLS.TEXT:
                // SupplementalText.analyze(taxa, errorLog);
                break;
            default:
                console.log("unrecognized tool: " + tool);
                return;
        }
    }

    errorLog.write();
}

/**
 * @param {import("commander").OptionValues} options
 */
async function getTaxa(options) {
    const errorLog = new ErrorLog(options.outputdir + "/errors.tsv", true);

    const loader = options[OPT_LOADER];
    let taxa;
    if (loader) {
        const taxaLoaderClass = await import("file:" + path.resolve(loader));
        taxa = await taxaLoaderClass.TaxaLoader.loadTaxa(options, errorLog);
    } else {
        taxa = new Taxa(
            Program.getIncludeList(options.datadir),
            errorLog,
            options.showFlowerErrors,
        );
    }

    errorLog.write();
    return taxa;
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
program.option(
    "--ef-lognotes",
    "When running the jepson-eflora tool, include eFlora notes, invalid names, etc. in the log file.",
);
program.option(
    "--loader <path>",
    "The path (relative to the current directory) of the JavaScript file containing the TaxaLoader class. If not provided, the default TaxaLoader will be used.",
);
program.addHelpText(
    "after",
    `
Tools:
    'all' runs the 'calflora', 'inat', 'jepson-eflora', 'rpi', and 'text' tools.
    '${TOOLS.CALFLORA}' retrieves data from Calflora and compares with local data.
    '${TOOLS.INAT}' retrieves data from iNaturalist and compares with local data.
    '${TOOLS.JEPSON_EFLORA}' retrieves data from Jepson eFlora indexes and compares with local data.
    '${TOOLS.JEPSON_FAM}' retrieves section, family and genus data from Jepson eFlora and creates data files for use by ca-plant-list.
    '${TOOLS.RPI}' retrieves data from the CNPS Rare Plant Inventory and compares with local data.
    '${TOOLS.TEXT}' checks supplemental text files to make sure their names are referenced.
    `,
);
program.action((options) => build(program, options));

await program.parseAsync();

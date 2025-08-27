import { Command } from "commander";

/**
 * @typedef {{
    datadir: string;
    outputdir: string;
    "show-flower-errors": boolean;
}} CommandLineOptions
 */

class Program {
    static getProgram() {
        const program = new Command();
        program
            .option(
                "-d, --datadir <dir>",
                "The directory containing plant data.",
                "./data",
            )
            .option(
                "-f, --show-flower-errors",
                "Include missing flower color/flowering time in the error log when loading taxa.",
            )
            .option(
                "-o, --outputdir <dir>",
                "The directory to which output should be written.",
                "./output",
            );
        return program;
    }
}

export { Program };

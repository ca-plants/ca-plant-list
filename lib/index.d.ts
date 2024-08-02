import { Command } from "commander";

export class Config {
    constructor(dataDir: string);
    getConfigValue(
        prefix: string,
        name: string,
        subcategory?: string,
        defaultValue?: string
    ): string;
    getCountyCodes(): string[];
    getLabel(name: string, dflt: string): string;
}

export class CSV {
    static parseFile(dir: string, fileName: string);
}

export class ErrorLog {
    constructor(fileName: string);
    log(...msg: string[]);
    write(): void;
}

export class Exceptions {
    constructor(dataDir: string);
    hasException(name: string, cat: string, subcat: string);
}

export class Files {
    static async fetch(url: string | URL, targetFileName: string | undefined);
    static mkdir(dir: string);
    static rmDir(dir: string);
}

export class Program {
    static getProgram(): Command;
}

export class Taxa {
    constructor(
        inclusionList: Object<string, TaxonData> | true,
        errorLog: ErrorLog,
        showFlowerErrors: boolean,
        taxonFactory: (td: TaxonData, g: Genera) => Taxon,
        extraTaxa: TaxonData[],
        extraSynonyms: SynonymData[]
    );
    getTaxon(string): Taxon;
    getTaxonList(): Taxon[];
}

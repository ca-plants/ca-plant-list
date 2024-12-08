import { Command } from "commander";

export class Config {
    constructor(dataDir: string);
    getConfigValue(
        prefix: string,
        name: string,
        subcategory?: string,
        defaultValue?: string,
    ): string;
    getCountyCodes(): string[];
    getLabel(name: string, dflt: string): string;
}

export class CSV {
    static parseFile(dir: string, fileName: string): Record<string, string>[];
}

export class ErrorLog {
    constructor(fileName: string, echo?: boolean);
    log(...msg: string[]): void;
    write(): void;
}

export class Exceptions {
    constructor(dataDir: string);
    hasException(name: string, cat: string, subcat: string): boolean;
}

export class Files {
    static exists(fileName: string): boolean;
    static fetch(
        url: string | URL,
        targetFileName: string | undefined,
    ): Promise<Headers>;
    static mkdir(dir: string): void;
    static rmDir(dir: string): void;
    static write(fileName: string, data: string, overwrite: boolean): void;
}

export class Program {
    static getIncludeList(dataDir: string): string[];
    static getProgram(): Command;
}

export class Taxa {
    constructor(
        inclusionList: Record<string, TaxonData> | true,
        errorLog: ErrorLog,
        showFlowerErrors: boolean,
        taxonFactory?: (td: TaxonData, g: Genera) => Taxon,
        extraTaxa?: TaxonData[],
        extraSynonyms?: SynonymData[],
    );
    getTaxon(name: string): Taxon;
    getTaxonList(): Taxon[];
}

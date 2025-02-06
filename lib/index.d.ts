import { Command } from "commander";

// Types

export type NativeStatusCode = "N" | "NC" | "U" | "X";

type PhotoRights = "CC0" | "CC BY" | "CC BY-NC" | "C" | null;

type RefSourceCode = "calflora" | "calscape" | "cch" | "fna" | "inat";

export type TaxonData = {
    bloom_end: string;
    bloom_start: string;
    calrecnum: string;
    calscape_cn?: string;
    cch2_id: string;
    CESA: string;
    "common name": string;
    CRPR: string;
    FESA: string;
    fna: string;
    flower_color: string;
    GRank: string;
    "inat id": string;
    "jepson id": string;
    life_cycle: string;
    "RPI ID": string;
    SRank: string;
    status: NativeStatusCode;
    taxon_name: string;
};

// Classes

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
    getExceptions(): [string, Record<string, Record<string, string>>][];
    getValue(
        name: string,
        cat: string,
        subcat: string,
        defaultValue?: string | undefined,
    ): string | undefined;
    hasException(name: string, cat: string, subcat: string): boolean;
}

export class ExternalSites {
    static getCCH2ObsLink(taxon: Taxon, config: Config): URL | undefined;
}

export class Family {
    getName(): string;
}

export class Files {
    static exists(fileName: string): boolean;
    static fetch(
        url: string | URL,
        targetFileName: string | undefined,
    ): Promise<Headers>;
    static mkdir(dir: string): void;
    static rmDir(dir: string): void;
    static write(fileName: string, data: string, overwrite?: boolean): void;
}

export class Genera {}

export class Genus {
    getTaxa(): Taxon[];
}

export class HTML {
    static arrayToLI(items: string[]): string;
    static escapeText(text: string): string;
    static getLink(
        href: string | undefined,
        linkText: string,
        attrs?: Record<string, string> | string,
        openInNewWindow?: boolean,
    ): string;
    static textElement(
        elName: string,
        text: string,
        attrs?: Record<string, string>,
    ): string;
    static wrap(
        elName: string,
        text: string,
        attrs?: string | Record<string, string> | undefined,
    ): string;
}

export class HTMLTaxon {
    static addLink(
        links: string[],
        href: URL | string | undefined,
        label: string,
    ): void;
    static addRefLink(
        links: string[],
        taxon: Taxon,
        sourceCode: RefSourceCode,
    ): void;
    static getFooterHTML(taxon: Taxon): string;
    static getListSectionHTML(
        list: string[],
        header: string,
        className?: string,
    ): string;
    static getMarkdownSection(filePath: string): string;
}

export class Jekyll {
    static hasInclude(baseDir: string, path: string): boolean;
    static include(fileName: string): string;
}

export class Photo {
    getAttribution(): string;
    getExt(): string;
    getId(): number;
    getSourceUrl(): string;
    getUrl(): string;
}

export class Program {
    static getIncludeList(dataDir: string): string[];
    static getProgram(): Command;
}

export class Taxa<T> {
    constructor(
        inclusionList: Record<string, TaxonData> | true,
        errorLog: ErrorLog,
        showFlowerErrors: boolean,
        taxonFactory?: (td: TaxonData, g: Genera) => T,
        extraTaxa?: TaxonData[],
        extraSynonyms?: Record<string, string>[],
    );
    getTaxon(name: string): T;
    getTaxonList(): T[];
}

export class Taxon {
    constructor(data: TaxonData, genera: Genera);
    getBaseFileName(): string;
    getCalfloraID(): string;
    getCESA(): string;
    getCNDDBRank(): string;
    getCommonNames(): string[];
    getFamily(): Family;
    getFileName(): string;
    getFESA(): string;
    getGenus(): Genus;
    getGenusName(): string;
    getGlobalRank(): string;
    getINatID(): string;
    getJepsonID(): string;
    getName(): string;
    getPhotos(): Photo[];
    getRPIRankAndThreat(): string;
    getRPITaxonLink(): string;
    getSynonyms(): string[];
}

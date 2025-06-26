import { Command } from "commander";

// Types

export type NativeStatusCode = "N" | "NC" | "U" | "X";

type PhotoRights = "CC0" | "CC BY" | "CC BY-NC" | "C" | null;

type RefSourceCode =
    | "calflora"
    | "calscape"
    | "cch"
    | "fna"
    | "inat"
    | "jepson"
    | "rpi";

type SiteGeneratorOptions = {
    passThroughPatterns?: string[];
};

type TaxaColDef<T> = {
    title: string;
    class?: string;
    data: (taxon: T) => string | number;
};

type TaxonomyData = {
    "jepson id": string;
};

export type TaxonData = TaxonomyData & {
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
    calipc: string;
    flower_color: string;
    GRank: string;
    "inat id": string;
    life_cycle: string;
    "RPI ID": string;
    SRank: string;
    status: NativeStatusCode;
    taxon_name: string;
};

export type TaxonOverrides = {
    status?: NativeStatusCode;
};

// Classes

export class BasePageRenderer {
    static newSiteGenerator(
        config: Config,
        outputDir: string,
        options?: SiteGeneratorOptions,
    ): SiteGenerator;
    static renderBasePages<T extends Taxon>(
        siteGenerator: SiteGenerator,
        taxa: Taxa<T>,
        familyCols?: TaxaColDef<T>[],
    ): void;
}

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
    static readFile<T>(fileName: string, delimeter?: string): T[];
    static writeFileObject(
        fileName: string,
        data: Record<string, any>[],
        headerData: string[],
    ): void;
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
    static read(path: string): string;
    static rmDir(dir: string): void;
    static write(fileName: string, data: string, overwrite?: boolean): void;
}

export class Genera {}

export class GenericPage {
    constructor(
        siteGenerator: SiteGenerator,
        title: string,
        baseFileName: string,
        js?: string,
    );
    getBaseFileName(): string;
    getFrontMatter(): string;
    getOutputDir(): string;
    getSiteGenerator(): SiteGenerator;
    getTitle(): string;
    writeFile(content: string): void;
}

export class Genus<T extends Taxon> {
    getTaxa(): T[];
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
    static getToolTip(
        text: string,
        tooltip: string,
        options?: { icon: boolean },
    ): string;
    static textElement(
        elName: string,
        text: string | number,
        attrs?: Record<string, string>,
    ): string;
    static wrap(
        elName: string,
        text: string | number,
        attrs?: string | Record<string, string> | undefined,
    ): string;
}

export class HTMLFragments {
    static getMarkdownSection(filePath: string): string;
}

export class HTMLTaxon {
    static addLink(
        links: string[],
        href: URL | string | undefined,
        label: string,
    ): void;
    static addObsLink(
        links: string[],
        taxon: Taxon,
        config: Config,
        sourceCode: RefSourceCode,
        label?: string,
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

export class SiteGenerator {
    generate(outputDir: string): Promise<void>;
    getBaseDir(): string;
    getFrontMatter(atts: Record<string, string | undefined>): string;
}

export class Taxa<T> {
    constructor(
        inclusionList: Record<string, TaxonOverrides> | true,
        errorLog: ErrorLog,
        showFlowerErrors: boolean,
        taxonFactory?: (td: TaxonData, g: Genera) => T,
        extraTaxa?: TaxonOverrides[],
        extraSynonyms?: Record<string, string>[],
    );
    getTaxon(name: string): T;
    getTaxonList(): T[];
}

export class Taxon {
    constructor(data: TaxonData, genera: Genera);
    getBaseFileName(): string;
    getCalfloraID(): string;
    getCalfloraName(): string;
    getCESA(): string;
    getCNDDBRank(): string;
    getCommonNames(): string[];
    getFamily(): Family;
    getFileName(): string;
    getFESA(): string;
    getGenus<T extends Taxon>(): Genus<T>;
    getGenusName(): string;
    getGlobalRank(): string;
    getINatID(): string;
    getINatName(): string;
    getJepsonID(): string;
    getName(): string;
    getPhotos(): Photo[];
    getRPIRank(): string;
    getRPIRankAndThreat(): string;
    getSynonyms(): string[];
}

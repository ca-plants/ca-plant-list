declare class CommandLineOptions {
    datadir: string;
    outputdir: string;
    "show-flower-errors": boolean;
}

declare class Config {
    getConfigValue(
        prefix: string,
        name: string,
        subcategory?: string,
        defaultValue?: string
    ): string;
    getCountyCodes(): string[];
    getLabel(name: string, dflt: string): string;
}

declare class ErrorLog {
    log(...args: string[]): void;
}

declare class Families {
    getFamilies(): Family[];
    getFamily(name: string): Family;
    renderPages(outputDir: string, cols?: TaxaCol[]);
}

declare class Family {
    getFileName(): string;
    getName(): string;
    getSectionName(): string;
    getTaxa(): Taxon[];
}

declare class FlowerColor {
    getColorCode(): string;
    getColorName(upperCase?: boolean): string;
    getFileName(): string;
    getTaxa(): Taxon[];
}

declare class Genera {
    addTaxon(Taxon);
    getGenus(name: string): Genus;
}

declare class Genus {
    getFamily(): Family;
    getTaxa(): Taxon[];
}

declare class GlossaryEntry {
    getMarkdown(): string;
    getTermName(): string;
}

declare class Images {
    getTaxonImages(name: string): TaxonImage[];
}

declare class InatObsOptions {
    coords?: [number, number];
    project_id?: string;
    subview?: "grid" | "list" | "map";
    taxon_id?: string;
}

declare class SiteGenerator {
    copyIllustrations(flowerColors: FlowerColor[]);
    mkdir(path: string);
    writeTemplate(
        content: string,
        attributes: Object<string, string>,
        filename: string
    );
}

declare class SynonymData {
    Current: string;
    Former: string;
    Type: string;
}

declare class Taxa {
    getFamilies(): Families;
    getFlowerColors(): FlowerColor[];
    getTaxon(name: string): Taxon;
    getTaxonList(): Taxon[];
}

declare class TaxaCol {
    class?: string;
    data: Object<string, Taxon>;
    title: string;
}

declare class TaxaLoader {}

declare class TaxaProcessor {
    getOptions(): CommandLineOptions;
    getTaxa(): Taxa;
}

declare class Taxon {
    constructor(data: TaxonData, genera: Genera, meta: any);
    getBaseFileName(): string;
    getBloomEnd(): number;
    getBloomStart(): number;
    getCalfloraName(): string;
    getCalfloraTaxonLink(): string;
    getCESA(): string;
    getCommonNames(): string[];
    getFamily(): Family;
    getFESA(): string;
    getFileName(): string;
    getFlowerColors(): string[];
    getGenus(): Genus;
    getGenusName(): string;
    getHTMLLink(
        href: boolean | string | undefined,
        includeRPI?: boolean
    ): string;
    getINatID(): string;
    getINatName(): string;
    getINatTaxonLink(): string;
    getJepsonID(): string;
    getLifeCycle(): string;
    getName(): string;
    getRPIRank(): string;
    getRPIRankAndThreat(): string;
    getRPIRankAndThreatTooltip(): string;
    getRPITaxonLink(): string;
    getStatusDescription(config: Config): string;
    getSynonyms(): string[];
    isNative(): boolean;
}

declare class TaxonData {
    bloom_end: string;
    bloom_start: string;
    calrecnum: string;
    CESA: string;
    "common name": string;
    CRPR: string;
    FESA: string;
    flower_color: string;
    GRank: string;
    "inat id": string;
    "jepson id": string;
    life_cycle: string;
    "RPI ID": string;
    SRank: string;
    status: string;
    taxon_name: string;
}

declare class TaxonImage {
    getCaption(): string | undefined;
    getSrc(): string;
}

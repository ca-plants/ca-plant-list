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
    ): string | undefined;
    getCountyCodes(): string[];
    getLabel(name: string, dflt: string): string;
}

declare class ErrorLog {
    log(...args: string[]): void;
    write(): void;
}

declare class Families {
    getFamilies(): Family[];
    getFamily(name: string): Family;
    renderPages(outputDir: string, cols?: TaxaCol[]): void;
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
    addTaxon(taxon: Taxon): void;
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
    copyIllustrations(flowerColors: FlowerColor[]): void;
    mkdir(path: string): void;
    writeTemplate(
        content: string,
        attributes: Record<string, string>,
        filename: string
    ): void;
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
    data: function (Taxon):string;
    title: string;
}

declare class Taxon {
    constructor(data: TaxonData, genera: Genera, meta: any);
    getBaseFileName(): string;
    getBloomEnd(): number | undefined;
    getBloomStart(): number | undefined;
    getCalfloraName(): string;
    getCalfloraTaxonLink(): string | undefined;
    getCESA(): string | undefined;
    getCommonNames(): string[];
    getFamily(): Family;
    getFESA(): string | undefined;
    getFileName(): string;
    getFlowerColors(): string[] | undefined;
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
    getPhotos(): InatPhoto[];
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

declare class InatPhoto {
    name: string;
    id: number;
    ext: string;
    licenseCode: "cc0" | "cc-by" | "cc-by-nc";
    attrName: string;
}

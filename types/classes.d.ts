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
        defaultValue?: string,
    ): string | undefined;
    getCountyCodes(): string[];
    getLabel(name: string, dflt: string): string;
}

declare class ErrorLog {
    log(...args: any[]): void;
    write(): void;
}

declare class Families {
    getFamilies(): Family[];
    getFamily(name: string): Family;
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
        filename: string,
    ): void;
}

declare class Taxa {
    getFamilies(): Families;
    getFlowerColors(): FlowerColor[];
    getTaxon(name: string): Taxon;
    getTaxonList(): Taxon[];
    hasSynonym(name: string): boolean;
    isSubset(): boolean;
}

// type StatusCode = "N" | "NC" | "U" | "X";
declare class Taxon {
    getBaseFileName(): string;
    getBloomEnd(): number | undefined;
    getBloomStart(): number | undefined;
    getCalfloraID(): string;
    getCalfloraName(): string;
    getCalfloraTaxonLink(): string | undefined;
    getCalscapeCommonName(): string | undefined;
    getCalscapeName(): string;
    getCommonNames(): string[];
    getFamily(): Family;
    getFESA(): string | undefined;
    getFileName(): string;
    getFlowerColors(): string[] | undefined;
    getGenus(): Genus;
    getGenusName(): string;
    getGlobalRank(): string | undefined;
    getHTMLLink(
        href: boolean | string | undefined,
        includeRPI?: boolean,
    ): string;
    getINatID(): string;
    getINatName(): string;
    getINatSyn(): string | undefined;
    getINatTaxonLink(): string;
    getJepsonID(): string;
    getLifeCycle(): string;
    getName(): string;
    getRPIID(): string | undefined;
    getRPIRank(): string;
    getRPIRankAndThreat(): string;
    getRPIRankAndThreatTooltip(): string;
    getRPITaxonLink(): string;
    getStatusDescription(config: Config): string;
    getSynonyms(): string[];
    isCANative(): boolean;
    isNative(): boolean;
}

declare class TaxonData {
    bloom_end: string;
    bloom_start: string;
    calrecnum: string;
    calscape_cn?: string;
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
    status: "N" | "NC" | "U" | "X";
    taxon_name: string;
}

type PhotoRights = "CC0" | "CC BY" | "CC BY-NC" | "C" | null;

type InatPhotoInfo = {
    id: string;
    ext: string;
    licenseCode: string;
    attrName: string | undefined;
};

type InatLicenseCode =
    | "cc-by-nc-sa"
    | "cc-by-nc"
    | "cc-by-nc-nd"
    | "cc-by"
    | "cc-by-sa"
    | "cc-by-nd"
    | "pd"
    | "gdfl"
    | "cc0";

declare class InatCsvPhoto {
    name: string;
    id: number;
    ext: string;
    licenseCode: InatLicenseCode;
    attrName: string;
}

declare class InatApiPhoto {
    id: number;
    attribution: string;
    license_code: InatLicenseCode;
    medium_url?: string;
    url?: string;
}

declare class InatApiTaxon {
    id: number;
    taxon_photos: {
        photo: InatApiPhoto;
    }[];
}

declare class InatApiObservation {
    observation_photos: {
        photo: InatApiPhoto;
    }[];
}

declare class InatObsPhotosCommandLineOptions extends CommandLineOptions {
    filename?: string;
    inatObsQuery?: string;
}

declare class InatTaxonPhotosCommandLineOptions extends CommandLineOptions {
    filename?: string;
}

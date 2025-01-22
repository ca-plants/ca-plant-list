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

declare class Taxa {
    getTaxon(name: string): Taxon;
    getTaxonList(): Taxon[];
    hasSynonym(name: string): boolean;
    isSubset(): boolean;
}

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
    getFESA(): string | undefined;
    getFileName(): string;
    getFlowerColors(): string[] | undefined;
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

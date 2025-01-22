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

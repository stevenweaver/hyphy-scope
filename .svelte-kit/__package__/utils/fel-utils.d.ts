interface FelResults {
    MLE: {
        content: Record<string, number[][]>;
        headers: [string, string][];
        LRT?: Record<string, number[][]>;
    };
    "data partitions": Record<string, {
        coverage: [number[]];
    }>;
    "confidence interval"?: boolean;
    simulated?: number;
    analysis: {
        citation: string;
    };
    tested?: any[];
}
interface FelAttributes {
    hasSrv: boolean;
    hasCi: boolean;
    hasPositiveLRT: boolean;
    hasPasmt: boolean;
    numberOfSequences: number;
    numberOfSites: number;
    numberOfPartitions: number;
    testedBranchCount: number;
    variableSiteCount: number;
    hasBackground: boolean;
}
export interface SiteData {
    partition: number;
    codon: number;
    Site: number;
    alpha: number;
    beta: number;
    "alpha=beta": number;
    "dN/dS MLE": number;
    "p-value": number;
    "p-asmp"?: number;
    "dN/dS LB"?: number;
    "dN/dS UB"?: number;
    class: "Diversifying" | "Purifying" | "Neutral" | "Invariable";
    [key: string]: any;
}
interface TileSpec {
    number: number | string;
    description: string;
    icon: string;
    color: string;
}
export declare const COLORS: {
    Diversifying: string;
    Neutral: string;
    Purifying: string;
    Invariable: string;
};
export declare function getFelAttributes(resultsJson: FelResults): FelAttributes;
export declare function getFelTileSpecs(resultsJson: FelResults, pvalueThreshold: number): TileSpec[];
export declare function getFelSiteTableData(resultsJson: FelResults, pvalueThreshold: number): [SiteData[], [string, string][], Record<string, (d: any) => any>];
export declare function loadDataFromUrl(url: string): Promise<FelResults | null>;
export declare function loadDataFromStorage(id: string): FelResults | null;
export {};

export interface MemeResults {
    MLE: {
        content: Record<string, number[][]>;
        headers: [string, string][];
        LRT?: Record<string, number[][]>;
    };
    "data partitions": Record<string, {
        coverage: [number[]];
    }>;
    input: {
        "number of sequences": number;
        "number of sites": number;
        "partition count": number;
    };
    analysis: {
        citation: string;
        version?: string;
    };
    tested?: any[];
    substitutions?: any;
    "branch attributes"?: any;
}
export interface MemeAttributes {
    testedBranchCount: number;
    hasResamples: number;
    hasSubstitutions: boolean;
    hasSiteLRT: boolean;
    hasBackground: boolean;
    siteIndexPartitionCodon: [number, number][];
    numberOfSequences: number;
    numberOfSites: number;
    numberOfPartitions: number;
    partitionSizes: number[];
}
export interface MemeSiteData {
    Partition: number;
    Codon: number;
    alpha: number;
    "beta-": number;
    "p-": number;
    "beta+": number;
    "p+": number;
    "p-value": number;
    "Branches": number;
    class: "Diversifying" | "Neutral" | "Invariable";
    [key: string]: any;
}
export interface TileSpec {
    number: number | string;
    description: string;
    icon: string;
    color: string;
}
export declare const MEME_COLORS: {
    Diversifying: string;
    Neutral: string;
    Invariable: string;
};
export declare function getMemeAttributes(resultsJson: MemeResults): MemeAttributes;
export declare function getMemeCountSitesByPvalue(resultsJson: MemeResults, pvalueThreshold: number): number;
export declare function getMemeSelectedBranchesPerSelectedSite(resultsJson: MemeResults, pvalueThreshold: number): string | number;
export declare function getMemeTileSpecs(resultsJson: MemeResults, pvalueThreshold: number): TileSpec[];
export declare function getMemeSiteTableData(resultsJson: MemeResults, pvalueThreshold: number): [MemeSiteData[], any[], any];
export declare function getMemeOmegaPlot(record: number[]): Array<{
    value: number;
    weight: number;
}>;
export declare function getMemePosteriorsPerBranchSite(resultsJson: MemeResults, rateClass?: number): Array<{
    Branch: string;
    Codon: number;
    Posterior: number;
    ER: number;
}>;
export declare function getMemeComputeER(prior: number, posterior: number): number;

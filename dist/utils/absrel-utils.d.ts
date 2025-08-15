/**
 * ABSREL (Adaptive Branch-Site Random Effects Likelihood) utility functions
 *
 * ABSREL tests whether a gene has experienced positive selection,
 * without requiring a priori specification of lineages.
 */
export interface AbsrelSiteData {
    site: number;
    partition: number;
    [branchName: string]: number;
}
export interface AbsrelBranchData {
    name: string;
    'Rate classes': number;
    'Uncorrected P-value': number;
    'Corrected P-value': number;
    'Bayes Factor': number;
    'ω distribution': Array<{
        'rate class': number;
        omega: number;
        weight: number;
    }>;
}
export interface AbsrelResults {
    sequences: number;
    sites: number;
    'branches tested': number;
    'branches with selection': number;
    'p-value threshold': number;
    'test results': {
        [branchName: string]: {
            'Rate classes': number;
            'Uncorrected P-value': number;
            'Corrected P-value': number;
            'Bayes Factor': number;
        };
    };
    'Site Log Likelihood': {
        tested: {
            [branchName: string]: number[][];
        };
    };
    'branch attributes': {
        [branchName: string]: {
            [attribute: string]: any;
        };
    };
    fits: {
        'Baseline model': {
            'log-likelihood': number;
            AIC: number;
            parameters: number;
        };
        'Full adaptive model': {
            'log-likelihood': number;
            AIC: number;
            parameters: number;
        };
    };
    'Synonymous site-posteriors'?: {
        [branchName: string]: number[][];
    };
}
/**
 * Extract summary statistics from ABSREL results
 */
export declare function getAbsrelSummary(data: AbsrelResults): {
    sequences: number;
    sites: number;
    branchesTested: number;
    branchesWithSelection: number;
    pValueThreshold: number;
    baselineLogLikelihood: number;
    fullModelLogLikelihood: number;
    lrt: number;
    baselineAIC: number;
    fullModelAIC: number;
};
/**
 * Get tested branches with their selection results
 */
export declare function getTestedBranches(data: AbsrelResults): AbsrelBranchData[];
/**
 * Get site-level log likelihood data for visualization
 */
export declare function getAbsrelSiteData(data: AbsrelResults): AbsrelSiteData[];
/**
 * Filter branches by significance
 */
export declare function getSignificantBranches(branches: AbsrelBranchData[], pValueThreshold?: number): AbsrelBranchData[];
/**
 * Get table headers for ABSREL results
 */
export declare function getAbsrelTableHeaders(): Array<{
    key: string;
    label: string;
    sortable: boolean;
}>;
/**
 * Format numeric values for display
 */
export declare function formatAbsrelValue(value: any, key: string): string;
/**
 * Get color for p-value significance
 */
export declare function getPValueColor(pValue: number, threshold?: number): string;
/**
 * Extract synonymous site posteriors if available
 */
export declare function getSynonymousSitePosteriors(data: AbsrelResults): {
    [branchName: string]: number[][];
};
/**
 * Calculate evidence ratio for branches
 */
export declare function calculateEvidenceRatio(bayesFactor: number): number;

/**
 * ABSREL plotting functions using Observable Plot
 */
import type { AbsrelBranchData, AbsrelSiteData, AbsrelResults } from './absrel-utils.js';
/**
 * Create a p-value significance plot
 */
export declare function createPValuePlot(branches: AbsrelBranchData[], threshold?: number): any;
/**
 * Create a Bayes Factor plot
 */
export declare function createBayesFactorPlot(branches: AbsrelBranchData[]): any;
/**
 * Create omega distribution plot for a specific branch
 */
export declare function createOmegaDistributionPlot(branch: AbsrelBranchData): any;
/**
 * Create site-level log likelihood plot
 */
export declare function createSiteLogLikelihoodPlot(siteData: AbsrelSiteData[], selectedBranches?: string[]): any;
/**
 * Create model comparison plot
 */
export declare function createModelComparisonPlot(results: AbsrelResults): any;

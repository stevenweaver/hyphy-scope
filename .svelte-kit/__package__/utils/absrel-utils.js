/**
 * ABSREL (Adaptive Branch-Site Random Effects Likelihood) utility functions
 *
 * ABSREL tests whether a gene has experienced positive selection,
 * without requiring a priori specification of lineages.
 */
/**
 * Extract summary statistics from ABSREL results
 */
export function getAbsrelSummary(data) {
    return {
        sequences: data.sequences,
        sites: data.sites,
        branchesTested: data['branches tested'],
        branchesWithSelection: data['branches with selection'],
        pValueThreshold: data['p-value threshold'],
        baselineLogLikelihood: data.fits['Baseline model']['log-likelihood'],
        fullModelLogLikelihood: data.fits['Full adaptive model']['log-likelihood'],
        lrt: 2 * (data.fits['Full adaptive model']['log-likelihood'] - data.fits['Baseline model']['log-likelihood']),
        baselineAIC: data.fits['Baseline model'].AIC,
        fullModelAIC: data.fits['Full adaptive model'].AIC
    };
}
/**
 * Get tested branches with their selection results
 */
export function getTestedBranches(data) {
    const testResults = data['test results'];
    const branchAttributes = data['branch attributes'];
    return Object.keys(testResults).map(branchName => {
        const result = testResults[branchName];
        const attributes = branchAttributes?.[branchName] || {};
        // Extract omega distribution if available
        const omegaDistribution = attributes['Rate Distributions'] ||
            attributes['Rate classes'] ||
            [];
        return {
            name: branchName,
            'Rate classes': result['Rate classes'],
            'Uncorrected P-value': result['Uncorrected P-value'],
            'Corrected P-value': result['Corrected P-value'],
            'Bayes Factor': result['Bayes Factor'],
            'ω distribution': Array.isArray(omegaDistribution) ? omegaDistribution : []
        };
    });
}
/**
 * Get site-level log likelihood data for visualization
 */
export function getAbsrelSiteData(data) {
    const siteLogLikelihood = data['Site Log Likelihood']?.tested;
    if (!siteLogLikelihood)
        return [];
    const branchNames = Object.keys(siteLogLikelihood);
    const firstBranchData = siteLogLikelihood[branchNames[0]];
    if (!firstBranchData || !Array.isArray(firstBranchData))
        return [];
    const numSites = firstBranchData.length;
    return Array.from({ length: numSites }, (_, siteIndex) => {
        const siteData = {
            site: siteIndex + 1,
            partition: 1 // Default partition, could be extracted from data if available
        };
        // Add log likelihood values for each tested branch
        branchNames.forEach(branchName => {
            const branchData = siteLogLikelihood[branchName];
            if (Array.isArray(branchData) && branchData[siteIndex] !== undefined) {
                // Handle both array of arrays and array of numbers
                const value = Array.isArray(branchData[siteIndex])
                    ? branchData[siteIndex][0]
                    : branchData[siteIndex];
                siteData[branchName] = typeof value === 'number' ? value : 0;
            }
        });
        return siteData;
    });
}
/**
 * Filter branches by significance
 */
export function getSignificantBranches(branches, pValueThreshold = 0.05) {
    return branches.filter(branch => branch['Corrected P-value'] <= pValueThreshold);
}
/**
 * Get table headers for ABSREL results
 */
export function getAbsrelTableHeaders() {
    return [
        { key: 'name', label: 'Branch', sortable: true },
        { key: 'Rate classes', label: 'Rate Classes', sortable: true },
        { key: 'Uncorrected P-value', label: 'Uncorrected p-value', sortable: true },
        { key: 'Corrected P-value', label: 'Corrected p-value', sortable: true },
        { key: 'Bayes Factor', label: 'Bayes Factor', sortable: true }
    ];
}
/**
 * Format numeric values for display
 */
export function formatAbsrelValue(value, key) {
    if (typeof value !== 'number')
        return String(value);
    if (key.includes('p-value') || key.includes('P-value')) {
        return value < 0.001 ? value.toExponential(2) : value.toFixed(4);
    }
    if (key === 'Bayes Factor') {
        return value.toFixed(2);
    }
    if (key === 'Rate classes') {
        return value.toString();
    }
    return value.toFixed(4);
}
/**
 * Get color for p-value significance
 */
export function getPValueColor(pValue, threshold = 0.05) {
    if (pValue <= 0.001)
        return '#8B0000'; // Dark red for highly significant
    if (pValue <= 0.01)
        return '#DC143C'; // Crimson for very significant  
    if (pValue <= threshold)
        return '#FF6347'; // Tomato for significant
    return '#000000'; // Black for non-significant
}
/**
 * Extract synonymous site posteriors if available
 */
export function getSynonymousSitePosteriors(data) {
    return data['Synonymous site-posteriors'] || {};
}
/**
 * Calculate evidence ratio for branches
 */
export function calculateEvidenceRatio(bayesFactor) {
    return Math.log10(Math.max(bayesFactor, 1e-10));
}

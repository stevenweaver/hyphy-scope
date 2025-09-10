/**
 * ABSREL (Adaptive Branch-Site Random Effects Likelihood) utility functions
 * 
 * ABSREL tests whether a gene has experienced positive selection,
 * without requiring a priori specification of lineages.
 */

export interface AbsrelSiteData {
  site: number;
  partition: number;
  [branchName: string]: number; // Log likelihood values for each tested branch
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
export function getAbsrelSummary(data: AbsrelResults | any) {
  // Handle both old and new data formats safely
  const sequences = data.sequences || data.input?.['number of sequences'] || 0;
  const sites = data.sites || data.input?.['number of sites'] || 0;
  const branchesTested = data['branches tested'] || 0;
  const branchesWithSelection = data['branches with selection'] || 0;
  const pValueThreshold = data['p-value threshold'] || 0.05;
  
  // Safely access fits data
  const baselineLogLikelihood = data.fits?.['Baseline model']?.['log-likelihood'] || 0;
  const fullModelLogLikelihood = data.fits?.['Full adaptive model']?.['log-likelihood'] || 0;
  const baselineAIC = data.fits?.['Baseline model']?.AIC || 0;
  const fullModelAIC = data.fits?.['Full adaptive model']?.AIC || 0;
  
  return {
    sequences,
    sites,
    branchesTested,
    branchesWithSelection,
    pValueThreshold,
    baselineLogLikelihood,
    fullModelLogLikelihood,
    lrt: 2 * (fullModelLogLikelihood - baselineLogLikelihood),
    baselineAIC,
    fullModelAIC
  };
}

/**
 * Get tested branches with their selection results
 */
export function getTestedBranches(data: AbsrelResults | any): AbsrelBranchData[] {
  const testResults = data['test results'] || {};
  const branchAttributes = data['branch attributes'] || {};
  
  return Object.keys(testResults).map(branchName => {
    const result = testResults[branchName] || {};
    
    // Try to get branch attributes from different possible locations
    let branchAttrs = {};
    if (branchAttributes[branchName]) {
      branchAttrs = branchAttributes[branchName];
    } else if (branchAttributes['0'] && branchAttributes['0'][branchName]) {
      branchAttrs = branchAttributes['0'][branchName];
    }
    
    // Extract omega distribution if available
    const rateDistributions = branchAttrs['Rate Distributions'] || [];
    let omegaDistribution: any[] = [];
    
    // Convert rate distributions to omega format
    if (rateDistributions && typeof rateDistributions === 'object') {
      omegaDistribution = Object.entries(rateDistributions).map(([key, value]: [string, any], index) => ({
        'rate class': index + 1,
        omega: Array.isArray(value) && value.length >= 2 ? value[0] : (value || 0),
        weight: Array.isArray(value) && value.length >= 2 ? value[1] : 1
      }));
    }
    
    return {
      name: branchName,
      'Rate classes': branchAttrs['Rate classes'] || result['Rate classes'] || omegaDistribution.length || 1,
      'Uncorrected P-value': result['uncorrected p'] || result['Uncorrected P-value'] || 0,
      'Corrected P-value': result['corrected p'] || result['Corrected P-value'] || result.p || 0,
      'Bayes Factor': result['Bayes Factor'] || Math.exp(result.LRT || 0),
      'ω distribution': omegaDistribution
    };
  });
}

/**
 * Get site-level log likelihood data for visualization
 */
export function getAbsrelSiteData(data: AbsrelResults | any): AbsrelSiteData[] {
  const siteLogLikelihood = data['Site Log Likelihood']?.tested;
  if (!siteLogLikelihood || typeof siteLogLikelihood !== 'object') {
    // Return minimal mock data for testing
    const numSites = data.sites || data.input?.['number of sites'] || 5;
    return Array.from({ length: numSites }, (_, siteIndex) => ({
      site: siteIndex + 1,
      partition: 1
    }));
  }
  
  const branchNames = Object.keys(siteLogLikelihood);
  if (branchNames.length === 0) return [];
  
  const firstBranchData = siteLogLikelihood[branchNames[0]];
  if (!firstBranchData || !Array.isArray(firstBranchData)) return [];
  
  const numSites = firstBranchData.length;
  
  return Array.from({ length: numSites }, (_, siteIndex) => {
    const siteData: AbsrelSiteData = {
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
export function getSignificantBranches(
  branches: AbsrelBranchData[], 
  pValueThreshold: number = 0.05
): AbsrelBranchData[] {
  return branches.filter(branch => branch['Corrected P-value'] <= pValueThreshold);
}

/**
 * Get table headers for ABSREL results
 */
export function getAbsrelTableHeaders(): Array<{ key: string; label: string; sortable: boolean }> {
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
export function formatAbsrelValue(value: any, key: string): string {
  if (typeof value !== 'number') return String(value);
  
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
export function getPValueColor(pValue: number, threshold: number = 0.05): string {
  if (pValue <= 0.001) return '#8B0000'; // Dark red for highly significant
  if (pValue <= 0.01) return '#DC143C';  // Crimson for very significant  
  if (pValue <= threshold) return '#FF6347'; // Tomato for significant
  return '#000000'; // Black for non-significant
}

/**
 * Extract synonymous site posteriors if available
 */
export function getSynonymousSitePosteriors(data: AbsrelResults) {
  return data['Synonymous site-posteriors'] || {};
}

/**
 * Calculate evidence ratio for branches
 */
export function calculateEvidenceRatio(bayesFactor: number): number {
  return Math.log10(Math.max(bayesFactor, 1e-10));
}

/**
 * Extract comprehensive attributes from aBSREL results for visualization
 */
export interface AbsrelAttributes {
  positiveResults: number;
  pvalueThreshold: number;
  profilableBranches: Set<string>;
  testedBranchCount: number;
  srvRateClasses: number;
  srvDistribution: Array<{value: number; weight: number}> | null;
  omegaRateClasses: number[];
  mhRates: {DH: number; TH: number};
  profileBranchSites: AbsrelProfileSite[];
  numberOfSequences: number;
  numberOfSites: number;
  numberOfPartitions: number;
  partitionSizes: number[];
}

export interface AbsrelProfileSite {
  Key: string;
  branch: string;
  site: number;
  ER: number;
  subs: number;
  from: string;
  to: string;
  syn_subs: number;
  nonsyn_subs: number;
}

export interface AbsrelBranchSiteData {
  Key: string;
  Posterior: number;
  ER: number;
  subs: number;
  from: string;
  to: string;
  syn_subs: number;
  nonsyn_subs: number;
}

export interface AbsrelDistributionTableRow {
  branch: string;
  tested: string;
  'p-value': number | null;
  sites: number | null;
  rates: number;
  dist: [string, Array<{value: number; weight: number}>, string];
  plot: [string, Array<{value: number; weight: number}>];
}

/**
 * Extract comprehensive attributes from ABSREL results
 */
export function getAbsrelAttributes(resultsJson: any): AbsrelAttributes {
  // Safely extract values with fallbacks
  const positiveResults = resultsJson["test results"]?.["positive test results"] || 
                          resultsJson["branches with selection"] || 0;
  const pvalueThreshold = resultsJson["test results"]?.["P-value threshold"] || 
                         resultsJson["p-value threshold"] || 0.05;
  const profilableBranches = new Set(Object.keys(resultsJson["Site Log Likelihood"]?.["tested"] || {}));
  
  // Calculate synonymous rate variation
  const srvRateClasses = resultsJson["Synonymous site-posteriors"] ? resultsJson["Synonymous site-posteriors"].length : 0;
  const srvDistribution = getSrvDistribution(resultsJson);
  
  // Calculate omega rate classes per partition
  const branchAttributes = resultsJson["branch attributes"] || {};
  let omegaRateClasses = [0];
  
  try {
    omegaRateClasses = Object.values(branchAttributes)
      .map((partition: any) => {
        if (!partition || typeof partition !== 'object') return 0;
        return Math.max(...Object.values(partition)
          .map((branch: any) => {
            if (!branch?.["Rate Distributions"]) return 0;
            return typeof branch["Rate Distributions"] === 'object' 
              ? Object.keys(branch["Rate Distributions"]).length 
              : 0;
          }));
      })
      .filter(n => n > 0);
    
    if (omegaRateClasses.length === 0) omegaRateClasses = [0];
  } catch (e) {
    omegaRateClasses = [0];
  }

  // Calculate median rates for multiple nucleotide changes (simplified)
  const mhRates = { DH: 0, TH: 0 };

  const testedBranchCount = calculateMedianTestedBranches(resultsJson);
  const profileBranchSites = getAbsrelProfileBranchSites(resultsJson);

  return {
    positiveResults,
    pvalueThreshold,
    profilableBranches,
    testedBranchCount,
    srvRateClasses,
    srvDistribution,
    omegaRateClasses,
    mhRates,
    profileBranchSites,
    numberOfSequences: resultsJson.sequences || resultsJson.input?.["number of sequences"] || 0,
    numberOfSites: resultsJson.sites || resultsJson.input?.["number of sites"] || 0,
    numberOfPartitions: resultsJson.input?.["partition count"] || 1,
    partitionSizes: getPartitionSizes(resultsJson)
  };
}

/**
 * Get synonymous rate variation distribution
 */
function getSrvDistribution(resultsJson: any): Array<{value: number; weight: number}> | null {
  const srvData = resultsJson.fits?.["Full adaptive model"]?.["Rate Distributions"]?.["Synonymous site-to-site rates"];
  if (!srvData) return null;
  
  return srvData.map((item: any, index: number) => ({
    value: item.rate || item[0] || 0,
    weight: item.proportion || item[1] || 0
  }));
}

/**
 * Calculate median number of tested branches across partitions
 */
function calculateMedianTestedBranches(resultsJson: any): number {
  const tested = resultsJson.tested || [];
  if (!Array.isArray(tested) || tested.length === 0) {
    // Fallback: count test results
    const testResults = resultsJson['test results'] || {};
    return Object.keys(testResults).length;
  }
  
  const counts = tested.map((partition: any) => {
    if (!partition || typeof partition !== 'object') return 0;
    return Object.values(partition).filter((status: any) => status === "test").length;
  });
  
  if (counts.length === 0) return 0;
  counts.sort((a, b) => a - b);
  return counts[Math.floor(counts.length / 2)];
}

/**
 * Get partition sizes
 */
function getPartitionSizes(resultsJson: any): number[] {
  const partitions = resultsJson["data partitions"] || {};
  if (Object.keys(partitions).length === 0) return [resultsJson.sites || 5];
  
  return Object.values(partitions).map((partition: any) => 
    partition.coverage?.[0]?.length || 0
  );
}

/**
 * Profile branch sites by calculating metrics based on log likelihoods
 */
export function getAbsrelProfileBranchSites(resultsJson: any): AbsrelProfileSite[] {
  const results: AbsrelProfileSite[] = [];
  const unc = resultsJson["Site Log Likelihood"]?.["unconstrained"]?.["0"];
  const subs = resultsJson["substitutions"]?.["0"];
  
  if (!unc || !subs) {
    // Return empty array if data not available
    return results;
  }
  
  unc.forEach((ll: number, i: number) => {
    const subsAtSite = generateSubstitutionLabels(subs[i]);
    
    Object.entries(subsAtSite).forEach(([node, info]: [string, any]) => {
      if (node !== 'root') {
        const bsLL = resultsJson["Site Log Likelihood"]?.["tested"]?.[node]?.[0]?.[i];
        if (typeof bsLL === 'number') {
          const subCount = calculateSubstitutionCounts(info[2], info[0]);
          results.push({
            Key: `${node}|${i + 1}`,
            branch: node,
            site: i + 1,
            ER: Math.exp(unc[i] - bsLL),
            subs: info[3] || 0,
            from: info[2] || '',
            to: info[0] || '',
            syn_subs: subCount[0],
            nonsyn_subs: subCount[1]
          });
        }
      }
    });
  });
  
  return results;
}

/**
 * Generate substitution labels for a site
 */
function generateSubstitutionLabels(subsData: any): {[key: string]: any} {
  // Simplified implementation - would need access to tree utilities for full implementation
  return subsData || {};
}

/**
 * Calculate synonymous and non-synonymous substitution counts
 */
function calculateSubstitutionCounts(from: string, to: string): [number, number] {
  // Simplified implementation - would need codon translation tables for accurate counts
  if (!from || !to || from === to) return [0, 0];
  
  // Placeholder logic - in reality would need genetic code translation
  const changes = countNucleotideChanges(from, to);
  // Assume roughly equal distribution for now
  const syn = Math.floor(changes / 2);
  const nonsyn = changes - syn;
  
  return [syn, nonsyn];
}

/**
 * Count nucleotide changes between two codons
 */
function countNucleotideChanges(codon1: string, codon2: string): number {
  if (!codon1 || !codon2 || codon1.length !== 3 || codon2.length !== 3) return 0;
  
  let changes = 0;
  for (let i = 0; i < 3; i++) {
    if (codon1[i] !== codon2[i]) changes++;
  }
  return changes;
}

/**
 * Create table specs for tile display
 */
export function getAbsrelTileSpecs(resultsJson: any, evThreshold: number, distributionTable: AbsrelDistributionTableRow[]): any[] {
  const attrs = getAbsrelAttributes(resultsJson);
  
  const medianDH = attrs.mhRates.DH > 0 ? attrs.mhRates.DH.toFixed(4) : "N/A";
  const medianTH = attrs.mhRates.TH > 0 ? attrs.mhRates.TH.toFixed(4) : "N/A";
  
  const meanSitesWithER = distributionTable
    .filter(r => r.tested === "Yes")
    .reduce((sum, r) => sum + (r.sites || 0), 0) / Math.max(distributionTable.filter(r => r.tested === "Yes").length, 1);

  return [
    {
      number: attrs.numberOfSequences,
      description: "sequences in the alignment",
      icon: "icon-options-vertical icons",
      color: "asbestos",
    },
    {
      number: attrs.numberOfSites,
      description: "codon sites in the alignment", 
      icon: "icon-options icons",
      color: "asbestos"
    },
    {
      number: attrs.numberOfPartitions,
      description: "partitions",
      icon: "icon-arrow-up icons", 
      color: "asbestos"
    },
    {
      number: attrs.testedBranchCount,
      description: "median branches/partition used for testing",
      icon: "icon-share icons",
      color: "asbestos",
    },
    {
      number: `${Math.min(...attrs.omegaRateClasses)}-${Math.max(...attrs.omegaRateClasses)}`,
      description: "rate classes per branch",
      icon: "icon-grid icons",
      color: "asbestos"
    },
    {
      number: attrs.srvRateClasses ? `${attrs.srvRateClasses} classes` : "None",
      description: "synonymous rate variation",
      icon: "icon-layers icons", 
      color: "asbestos"
    },
    {
      number: attrs.positiveResults,
      description: "branches with evidence of selection",
      icon: "icon-plus icons",
      color: "midnight_blue",
    },
    {
      number: meanSitesWithER.toFixed(1),
      description: `Sites/tested branch with ER≥${evThreshold} for positive selection`,
      icon: "icon-energy icons",
      color: "midnight_blue"
    },
    {
      number: `${medianDH}:${medianTH}`,
      description: "Median multiple hit rates (2H:3H)",
      icon: "icon-target icons",
      color: "midnight_blue"
    }
  ];
}

/**
 * Get rate distribution for a branch
 */
export function getAbsrelTestOmega(resultsJson: any, branch: string): Array<{value: number; weight: number}> {
  const branchData = resultsJson["branch attributes"]?.["0"]?.[branch];
  if (!branchData?.["Rate Distributions"]) return [];
  
  const distributions = branchData["Rate Distributions"];
  
  // Handle different formats of rate distributions
  if (Array.isArray(distributions)) {
    return distributions.map((dist: any, index: number) => ({
      value: dist["0"] || dist.omega || 0,
      weight: dist["1"] || dist.weight || 0
    }));
  } else if (typeof distributions === 'object') {
    // Convert object format to array
    return Object.entries(distributions).map(([key, value]: [string, any], index) => ({
      value: Array.isArray(value) && value.length >= 2 ? value[0] : (value || 0),
      weight: Array.isArray(value) && value.length >= 2 ? value[1] : 1
    }));
  }
  
  return [];
}

/**
 * Get site index to partition and codon mapping
 */
export function getAbsrelSiteIndexPartitionCodon(resultsJson: any): Array<[number, number]> {
  const partitions = resultsJson['data partitions'] || {};
  const mappedData = Object.entries(partitions).map(([k, d]: [string, any]) => {
    return d['coverage'][0].map((site: number) => [+k + 1, site + 1]);
  });
  return ([] as Array<[number, number]>).concat(...mappedData);
}

/**
 * Get branch color options for tree visualization
 */
export function getAbsrelTreeColorOptions(resultsJson: any, evThreshold: number): string[] {
  const attrs = getAbsrelAttributes(resultsJson);

  let options = ["Tested"];
  if (resultsJson.substitutions) {
    options.push("Support for selection");
    options.push("Substitutions");
  }
  if (attrs.mhRates.DH > 0) {
    options.push("2-hit rate");
  }
  if (attrs.mhRates.TH > 0) {
    options.push("3-hit rate");
  }
  
  return options;
}

/**
 * Tree configuration options for ABSREL visualization
 */
export interface AbsrelTreeOptions {
  branchLabels?: boolean;
  neighbors?: boolean;
  height?: number;
  width?: number;
  alignTips?: boolean;
  showScale?: boolean;
  isRadial?: boolean;
  showInternal?: boolean;
  colorBranches?: string;
  branchLength?: string;
  evThreshold?: number;
}

/**
 * Create tree configuration for ABSREL visualization
 */
export function createAbsrelTreeConfig(
  resultsJson: any,
  partitionIndex: number = 0,
  options: AbsrelTreeOptions = {}
): any {
  const {
    height = 600,
    width = 800,
    alignTips = false,
    showScale = true,
    isRadial = false,
    showInternal = false,
    colorBranches = "Tested",
    branchLength = "Baseline MG94xREV",
    evThreshold = 100
  } = options;

  const config = {
    height,
    width,
    'align-tips': alignTips,
    'show-scale': showScale,
    'is-radial': isRadial,
    'left-right-spacing': 'fit-to-size',
    'top-bottom-spacing': 'fit-to-size',
    'node_circle_size': () => 0,
    'internal-names': showInternal,
    configureBranches: (rawTree: any, renderedTree: any) => {
      configureAbsrelBranches(rawTree, renderedTree, resultsJson, {
        colorBranches,
        branchLength,
        partitionIndex,
        evThreshold
      });
    }
  };

  return config;
}

/**
 * Configure branch styling for ABSREL trees
 */
function configureAbsrelBranches(
  rawTree: any,
  renderedTree: any,
  resultsJson: any,
  options: any
) {
  const { colorBranches, branchLength, partitionIndex, evThreshold } = options;
  const attrs = getAbsrelAttributes(resultsJson);
  const branchAttributes = resultsJson["branch attributes"]?.[partitionIndex] || {};

  renderedTree.traverse_and_compute((node: any) => {
    const branchName = node.data?.name;
    if (!branchName || !branchAttributes[branchName]) return;

    const branchData = branchAttributes[branchName];
    
    // Set branch length
    if (branchData[branchLength] !== undefined) {
      node.data.attribute = branchData[branchLength];
    }

    // Configure branch coloring
    switch (colorBranches) {
      case "Tested":
        if (resultsJson.tested?.[partitionIndex]?.[branchName] === "test") {
          node.data.color = "#1f77b4"; // Blue for tested branches
        } else {
          node.data.color = "#cccccc"; // Gray for untested
        }
        break;

      case "Support for selection":
        const pValue = branchData["Corrected P-value"];
        if (pValue !== undefined) {
          if (pValue <= 0.001) {
            node.data.color = "#8B0000"; // Dark red for highly significant
          } else if (pValue <= 0.01) {
            node.data.color = "#DC143C"; // Crimson for very significant
          } else if (pValue <= 0.05) {
            node.data.color = "#FF6347"; // Tomato for significant
          } else {
            node.data.color = "#cccccc"; // Gray for non-significant
          }
        }
        break;

      case "Substitutions":
        // Color based on substitution counts if available
        const substitutions = resultsJson.substitutions?.[partitionIndex];
        if (substitutions) {
          // Simplified - would need more complex logic for actual substitution counting
          node.data.color = "#2ca02c"; // Green
        }
        break;

      case "2-hit rate":
        const dhRate = branchData["Rate Distributions"]?.["rate at which 2 nucleotides are changed instantly within a single codon"];
        if (dhRate !== undefined) {
          // Use a color scale based on the rate
          const colorScale = createRateColorScale([0, attrs.mhRates.DH * 2]);
          node.data.color = colorScale(dhRate);
        }
        break;

      case "3-hit rate":
        const thRate = branchData["Rate Distributions"]?.["rate at which 3 nucleotides are changed instantly within a single codon"];
        if (thRate !== undefined) {
          const colorScale = createRateColorScale([0, attrs.mhRates.TH * 2]);
          node.data.color = colorScale(thRate);
        }
        break;
    }

    // Add branch labels if requested
    if (options.addBranchLabels) {
      const pValue = branchData["Corrected P-value"];
      if (pValue !== undefined && pValue <= 0.05) {
        node.data.label = pValue < 0.001 ? "***" : pValue < 0.01 ? "**" : "*";
      }
    }
  });
}

/**
 * Create a color scale for numeric values
 */
function createRateColorScale(domain: [number, number]): (value: number) => string {
  // Simple implementation - could use d3.scaleSequential for more sophisticated scaling
  return (value: number) => {
    const normalized = (value - domain[0]) / (domain[1] - domain[0]);
    const intensity = Math.max(0, Math.min(1, normalized));
    const red = Math.floor(255 * intensity);
    const blue = Math.floor(255 * (1 - intensity));
    return `rgb(${red}, 0, ${blue})`;
  };
}

/**
 * Get distribution table for branches
 */
export function getAbsrelDistributionTable(
  resultsJson: any,
  evThreshold: number
): AbsrelDistributionTableRow[] {
  const table: AbsrelDistributionTableRow[] = [];
  const attrs = getAbsrelAttributes(resultsJson);
  const branchAttributes = resultsJson["branch attributes"]?.[0] || {};
  const tested = resultsJson.tested?.[0] || {};
  
  // Calculate site evidence ratios per branch
  const siteER: {[branch: string]: number} = {};
  attrs.profileBranchSites.forEach(site => {
    if (site.ER >= evThreshold) {
      siteER[site.branch] = (siteER[site.branch] || 0) + 1;
    }
  });

  Object.entries(branchAttributes).forEach(([branchName, info]: [string, any]) => {
    const isTested = tested[branchName] === "test";
    const omegaDist = getAbsrelTestOmega(resultsJson, branchName);
    
    const row: AbsrelDistributionTableRow = {
      branch: branchName,
      tested: isTested ? "Yes" : "No",
      'p-value': isTested ? info["Corrected P-value"] : null,
      sites: isTested ? (siteER[branchName] || 0) : null,
      rates: info["Rate classes"] || 0,
      dist: ["&omega;", omegaDist, ""],
      plot: ["", omegaDist]
    };
    
    table.push(row);
  });

  return table;
}

/**
 * Generate site table data for detailed analysis
 */
export function getAbsrelSiteTableData(
  resultsJson: any,
  evThreshold: number,
  profileBranchSites?: AbsrelProfileSite[]
): [any[], {[key: string]: any}] {
  const attrs = getAbsrelAttributes(resultsJson);
  const siteIndexPartitionCodon = getAbsrelSiteIndexPartitionCodon(resultsJson);
  
  if (!profileBranchSites) {
    profileBranchSites = attrs.profileBranchSites;
  }
  
  const bySite = profileBranchSites.reduce((acc, site) => {
    if (!acc[site.site]) acc[site.site] = [];
    acc[site.site].push(site);
    return acc;
  }, {} as {[site: number]: AbsrelProfileSite[]});

  const siteInfo: any[] = [];
  let index = 0;

  Object.entries(resultsJson["data partitions"] || {}).forEach(([partition, pinfo]: [string, any]) => {
    pinfo.coverage[0].forEach((_: any, i: number) => {
      const codon = siteIndexPartitionCodon[index][1];
      const siteRecord: any = {
        'Codon': codon,
      };

      // Add site log likelihood if available
      const sll = resultsJson["Site Log Likelihood"]?.['unconstrained']?.[0]?.[index];
      if (sll !== undefined) {
        siteRecord['LogL'] = sll;
      }

      // Add synonymous rate variation if available
      if (attrs.srvDistribution && resultsJson["Synonymous site-posteriors"]) {
        const sitePosteriorsAtIndex = attrs.srvDistribution.map((d, distIndex) => ({
          value: d.value,
          weight: resultsJson["Synonymous site-posteriors"][distIndex]?.[index] || 0
        }));
        
        siteRecord['SRV posterior mean'] = sitePosteriorsAtIndex.reduce(
          (sum, d) => sum + (d.value * d.weight), 0
        );
      }

      // Add substitutions and evidence ratios
      const sitesAtPosition = bySite[i + 1] || [];
      siteRecord["Subs"] = sitesAtPosition.reduce((sum, d) => sum + d.subs, 0);
      siteRecord["ER"] = sitesAtPosition.filter(d => d.ER >= evThreshold).length;
      
      siteInfo.push(siteRecord);
      index++;
    });
  });

  const headers = {
    'Codon': 'Site',
    'SRV posterior mean': 'E[α]',
    'LogL': 'log(L)',
    'Subs': 'Subs',
    'ER': `ER Branch (≥${evThreshold})`
  };

  return [siteInfo, headers];
}
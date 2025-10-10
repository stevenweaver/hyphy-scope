/**
 * FUBAR (Fast Unconstrained Bayesian AppRoximation) utility functions
 */

export interface FubarResults {
  MLE: {
    headers: Array<[string, string]>;
    content: { [key: string]: number[][] };
  };
  grid: number[][];
  posterior: number[][][][];
  'data partitions': { [key: string]: { coverage: number[][] } };
  input: {
    trees: { [key: string]: string } | string[] | string;
    'number of sites': number;
  };
  fits?: any;
  'branch attributes'?: any;
}

export interface FubarSiteData {
  Site: number;
  Partition: number;
  α: number;
  β: number;
  'α-β': number;
  'Prob[α>β]': number;
  'Prob[α<β]': number;
}

export interface FubarSummary {
  positiveSites: number;
  negativeSites: number;
  totalSites: number;
}

/**
 * Get summary statistics for FUBAR results
 */
export function getFubarSummary(
  data: FubarResults,
  posteriorProbability: number = 0.9
): FubarSummary {
  if (!data?.MLE?.content) {
    return {
      positiveSites: 0,
      negativeSites: 0,
      totalSites: 0
    };
  }

  const flattenedData = Object.values(data.MLE.content).flat();

  const positiveSites = flattenedData.filter(row => row[4] > posteriorProbability).length;
  const negativeSites = flattenedData.filter(row => row[3] > posteriorProbability).length;

  return {
    positiveSites,
    negativeSites,
    totalSites: flattenedData.length
  };
}

/**
 * Get site-by-site data for FUBAR results
 */
export function getFubarSiteData(data: FubarResults): FubarSiteData[] {
  if (!data?.MLE?.content) return [];

  const flattenedData = Object.values(data.MLE.content).flat();
  const partitionColumn = getPartitionColumn(data);

  return flattenedData.map((row, index) => ({
    Site: index + 1,
    Partition: partitionColumn[index] + 1,
    α: row[0],
    β: row[1],
    'α-β': row[2],
    'Prob[α>β]': row[3],
    'Prob[α<β]': row[4]
  }));
}

/**
 * Get partition column mapping
 */
export function getPartitionColumn(data: FubarResults): number[] {
  if (!data?.['data partitions']) return [];

  const flattenedLength = Object.values(data.MLE.content).flat().length;
  const partitionColumn = new Array(flattenedLength).fill(0);

  Object.entries(data['data partitions']).forEach(([key, val], partitionIndex) => {
    val.coverage[0].forEach(siteIndex => {
      partitionColumn[siteIndex] = partitionIndex;
    });
  });

  return partitionColumn;
}

/**
 * Extract tree newick string from various input formats
 */
export function getTreeNewick(data: FubarResults): string | null {
  if (!data?.input?.trees) return null;

  const trees = data.input.trees;

  // Handle different tree formats
  if (typeof trees === 'string') {
    return trees;
  } else if (Array.isArray(trees)) {
    return trees[0] || null;
  } else if (typeof trees === 'object') {
    const treeKeys = Object.keys(trees);
    return treeKeys.length > 0 ? trees[treeKeys[0]] : null;
  }

  return null;
}

/**
 * Get grid data for a specific site
 */
export function getGridDataForSite(
  data: FubarResults,
  site: number
): number[][] {
  if (!data?.posterior || !data?.['data partitions'] || !data.grid) {
    return data.grid;
  }

  // Find partition and index for this site
  let partition = 0;
  let index = -1;
  const partitions = Object.values(data['data partitions']);

  for (let p = 0; p < partitions.length; p++) {
    const coverage = partitions[p].coverage[0];
    const idx = coverage.indexOf(site - 1);
    if (idx > -1) {
      partition = p;
      index = idx;
      break;
    }
  }

  if (index === -1) return data.grid;

  // Get site-specific posterior
  const sitePosterior = data.posterior[partition][index][0];

  // Combine with grid coordinates
  return data.grid.map((d, i) => [d[0], d[1], sitePosterior[i]]);
}

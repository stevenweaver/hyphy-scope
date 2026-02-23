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
    'number of sequences'?: number;
    'file name'?: string;
  };
  fits?: any;
  'branch attributes'?: any;
  analysis?: any;
  settings?: any;
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

export interface FubarParsedSite {
  site: number;
  alpha: number;
  beta: number;
  diff: number;
  probNeg: number;
  probPos: number;
  bfPos: number;
  probInv?: number;
  probAlpha0?: number;
  probBeta0?: number;
  probProx?: number;
  ebfInv?: number;
  ebfAlpha0?: number;
  ebfBeta0?: number;
  ebfProx?: number;
  [key: string]: number | undefined;
}

export interface FubarMeta {
  sequences: number;
  codons: number;
  filename: string;
  treeLength: number;
  settings: any;
  isBStill: boolean;
}

export interface ParsedFubar {
  meta: FubarMeta;
  sites: FubarParsedSite[];
  grid: number[][];
  posterior: any;
  raw: any;
}

// Crameri's Batlow color ramp (approximated, 15 stops)
export const batlow = [
  "#001959", "#0d2a63", "#1a3b6d", "#274c77", "#345d81",
  "#416e8b", "#4e7f95", "#5b909f", "#68a1a9", "#75b2b3",
  "#82c3bd", "#8fd4c7", "#9be5d1", "#a8f6db", "#b5ffe5"
];

export function parseFubarJSON(json: any): ParsedFubar {
  if (!json || !json.MLE || !json.MLE.content || !json.MLE.content["0"]) {
    throw new Error("Invalid FUBAR JSON format");
  }

  const input = json.input || {};
  const headers: Array<[string, string]> = json.MLE.headers;
  const content: number[][] = json.MLE.content["0"];
  const branchAttributes = json["branch attributes"] || {};
  const analysisInfo = json.analysis || {};
  const isBStill = !!(
    (analysisInfo.info && analysisInfo.info.includes("B-STILL")) ||
    (analysisInfo.version && analysisInfo.version.includes("B-STILL"))
  );

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const label = h[0];
    if (label === "alpha") colMap.alpha = i;
    if (label === "beta") colMap.beta = i;
    if (label === "beta-alpha") colMap.diff = i;
    if (label === "Prob[alpha>beta]") colMap.probNeg = i;
    if (label === "Prob[alpha<beta]") colMap.probPos = i;
    if (label === "BayesFactor[alpha<beta]") colMap.bfPos = i;
    // B-STILL specific
    if (label === "Prob[alpha=beta=0]") colMap.probInv = i;
    if (label === "Prob[alpha=0]") colMap.probAlpha0 = i;
    if (label === "Prob[beta=0]") colMap.probBeta0 = i;
    if (label === "Prob[alpha,beta~0]") colMap.probProx = i;
    if (label === "EBF[alpha=beta=0]") colMap.ebfInv = i;
    if (label === "EBF[alpha=0]") colMap.ebfAlpha0 = i;
    if (label === "EBF[beta=0]") colMap.ebfBeta0 = i;
    if (label === "EBF[alpha,beta~0]") colMap.ebfProx = i;
  });

  const sites: FubarParsedSite[] = content.map((row, i) => ({
    site: i + 1,
    alpha: row[colMap.alpha],
    beta: row[colMap.beta],
    diff: row[colMap.diff] ?? (row[colMap.beta] - row[colMap.alpha]),
    probNeg: row[colMap.probNeg],
    probPos: row[colMap.probPos],
    bfPos: row[colMap.bfPos],
    probInv: row[colMap.probInv],
    probAlpha0: row[colMap.probAlpha0],
    probBeta0: row[colMap.probBeta0],
    probProx: row[colMap.probProx],
    ebfInv: row[colMap.ebfInv],
    ebfAlpha0: row[colMap.ebfAlpha0],
    ebfBeta0: row[colMap.ebfBeta0],
    ebfProx: row[colMap.ebfProx]
  }));

  const meta: FubarMeta = {
    sequences: input["number of sequences"] || 0,
    codons: input["number of sites"] || 0,
    filename: input["file name"] || "Unknown",
    treeLength: calculateTreeLength(branchAttributes),
    settings: json.settings || {},
    isBStill
  };

  // Robust posterior extraction
  let posterior = json.posterior || {};
  const topKeys = Object.keys(posterior);
  if (topKeys.length > 0) {
    const firstValue = posterior[topKeys[0]];
    if (typeof firstValue === "object" && !Array.isArray(firstValue)) {
      // Already in {partition: {site: weights}} format
    } else {
      posterior = { "0": posterior };
    }
  }

  return { meta, sites, grid: json.grid, posterior, raw: json };
}

export function calculateTreeLength(branchAttributes: any): number {
  if (!branchAttributes || !branchAttributes["0"]) return 0;
  const branches = branchAttributes["0"];
  let totalLength = 0;
  const firstBranch = Object.values(branches)[0] as any;
  if (!firstBranch) return 0;
  const lengthKey = Object.keys(firstBranch).find(
    k => k !== "original name" && typeof firstBranch[k] === "number"
  );
  if (!lengthKey) return 0;

  for (const branchName in branches) {
    const attr = branches[branchName] as any;
    const key = attr["Nucleotide GTR"] !== undefined ? "Nucleotide GTR" : lengthKey;
    if (attr[key] !== undefined) totalLength += attr[key];
  }
  return totalLength;
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

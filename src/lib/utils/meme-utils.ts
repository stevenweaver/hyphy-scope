import * as _ from "lodash-es";

export interface MemeResults {
  MLE: {
    content: Record<string, number[][]>;
    headers: [string, string][];
    LRT?: Record<string, number[][]>;
  };
  "data partitions": Record<string, { coverage: [number[]] }>;
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

export const MEME_COLORS = {
  'Diversifying': '#e3243b',
  'Neutral': '#444',
  'Invariable': '#CCC'
};

export function getMemeAttributes(resultsJson: MemeResults): MemeAttributes {
  const hasResamples = _.get(resultsJson, ["MLE", "LRT"]) ? 
    _.sample(_.get(resultsJson, ["MLE", "LRT"])["0"])?.length || 0 : 0;
  const hasSubstitutions = !!_.get(resultsJson, ["substitutions"]);
  const hasSiteLRT = !!_.find(_.get(resultsJson, ["MLE", "headers"]), (d) => d[0] === "Variation p");
  const hasBackground = false; // Simplified for now
  
  const siteIndexPartitionCodon: [number, number][] = Object.values(resultsJson['data partitions'])
    .map((d, k) => Object.values(d['coverage'][0]).map((site) => [+k+1, site+1] as [number, number]))
    .flat();

  // Basic calculations
  const numberOfSequences = resultsJson.input["number of sequences"];
  const numberOfSites = resultsJson.input["number of sites"];
  const numberOfPartitions = resultsJson.input["partition count"];
  const testedBranchCount = 5; // Default fallback
  const partitionSizes = Object.values(resultsJson['data partitions'])
    .map(d => d.coverage[0].length);

  return {
    testedBranchCount,
    hasResamples,
    hasSubstitutions,
    hasSiteLRT,
    hasBackground,
    siteIndexPartitionCodon,
    numberOfSequences,
    numberOfSites,
    numberOfPartitions,
    partitionSizes
  };
}

export function getMemeCountSitesByPvalue(resultsJson: MemeResults, pvalueThreshold: number): number {
  const countSites = Object.values(resultsJson["MLE"]["content"])
    .map(d => d.filter(r => r[6] <= +pvalueThreshold).length)
    .reduce((sum, count) => sum + count, 0);

  return countSites;
}

export function getMemeSelectedBranchesPerSelectedSite(resultsJson: MemeResults, pvalueThreshold: number): string | number {
  const countSites = getMemeCountSitesByPvalue(resultsJson, pvalueThreshold);
  const selectedBranchesPerSelectedSite = 
    countSites ? 
    (Object.values(resultsJson["MLE"]["content"])
      .map(d => d.filter(r => r[6] <= +pvalueThreshold))
      .map(d => d.reduce((sum, r) => sum + r[7], 0))
      .reduce((sum, count) => sum + count, 0) / countSites).toFixed(2) 
    : "N/A";

  return selectedBranchesPerSelectedSite; 
}

export function getMemeTileSpecs(resultsJson: MemeResults, pvalueThreshold: number): TileSpec[] {
  const attrs = getMemeAttributes(resultsJson);
  const countSites = getMemeCountSitesByPvalue(resultsJson, pvalueThreshold);
  const selectedBranchesPerSelectedSite = getMemeSelectedBranchesPerSelectedSite(resultsJson, pvalueThreshold);
  
  // Compute count of sites with ω variation below p-value threshold
  const variationCount = attrs.hasSiteLRT ?
    Object.values(resultsJson['MLE']['content'])
      .map(d => d.filter(r => r[11] <= +pvalueThreshold).length)
      .reduce((sum, count) => sum + count, 0)
    : 0;
  
  return [
    {
      number: resultsJson.input["number of sequences"], 
      color: "asbestos", 
      description: "sequences in the alignment", 
      icon: "icon-options-vertical icons"
    },
    {
      number: resultsJson.input["number of sites"], 
      color: "asbestos", 
      description: "codon sites in the alignment", 
      icon: "icon-options icons"
    },
    {
      number: resultsJson.input["partition count"], 
      color: "asbestos", 
      description: "partitions", 
      icon: "icon-arrow-up icons"
    },
    {
      number: attrs.testedBranchCount, 
      color: "asbestos", 
      description: "median branches/partition used for testing", 
      icon: "icon-share icons"
    },
    {
      number: attrs.hasResamples || "N/A", 
      color: "asbestos", 
      description: "parametric bootstrap replicates", 
      icon: "icon-layers icons"
    },
    {
      number: countSites, 
      color: "midnight_blue", 
      description: "sites subject to episodic diversifying selection", 
      icon: "icon-plus icons"
    },
    {
      number: selectedBranchesPerSelectedSite, 
      color: "midnight_blue", 
      description: "median branches with support for selection/selected site", 
      icon: "icon-share icons"
    },
    {
      number: variationCount, 
      color: "midnight_blue", 
      description: "sites with variable ω across branches", 
      icon: "icon-energy icons"
    } 
  ];
}

export function getMemeSiteTableData(resultsJson: MemeResults, pvalueThreshold: number): [MemeSiteData[], any[], any] {
  const attrs = getMemeAttributes(resultsJson);
  const siteInfo: MemeSiteData[] = [];
  let index = 0;

  const mleHeaders = _.map(resultsJson["MLE"]["headers"], (d) => {
    d[2] = d[0];
    return d;
  });

  _.each(resultsJson["data partitions"], (pinfo, partition) => {
    const mleData = resultsJson["MLE"]["content"][partition];
    _.each(pinfo["coverage"][0], (ignore, i) => {
      const siteRecord: MemeSiteData = {
        'Partition': attrs.siteIndexPartitionCodon[index][0],
        'Codon': attrs.siteIndexPartitionCodon[index][1],
        'alpha': mleData[i][0],
        'beta-': mleData[i][1],
        'p-': mleData[i][2],
        'beta+': mleData[i][3],
        'p+': mleData[i][4],
        'p-value': mleData[i][6],
        'Branches': mleData[i][7],
        'class': "Neutral"
      };

      // Assign additional headers
      _.each(mleHeaders, (info, idx) => {
        if (idx < 8) {
          siteRecord[info[2]] = mleData[i][idx];
        }
      });

      // Determine site class
      let siteClass: "Diversifying" | "Neutral" | "Invariable" = "Neutral";
      if (mleData[i][0] === 0 && mleData[i][1] === 0 && mleData[i][3] === 0) {
        siteClass = "Invariable";
      } else {
        if (mleData[i][6] <= +pvalueThreshold) {
          siteClass = "Diversifying";
        }
      }
      siteRecord.class = siteClass;

      siteInfo.push(siteRecord);
      index++;
    });
  });

  const options = {
    'Partition': 'Part.',
    'Codon': 'Codon',
    'class': 'Class',
    'alpha': 'α',
    'beta-': 'β-',
    'p-': 'p-',
    'beta+': 'β+',
    'p+': 'p+',
    'p-value': 'p-value',
    'Branches': 'Branches'
  };

  return [siteInfo, options, mleHeaders];
}

export function getMemeOmegaPlot(record: number[]): Array<{value: number, weight: number}> {
  const ratio = (beta: number, alpha: number) => {
    if (alpha > 0) {
      return beta/alpha;
    }
    if (alpha === 0) {
      if (beta === 0) return 1;
    }
    return 100;
  };
  
  const alpha = record[0];

  const rateInfo = [
    {
      'value': ratio(record[1], alpha),
      'weight': record[2]
    },
    {
      'value': ratio(record[3], alpha),
      'weight': record[4]
    }
  ];

  return rateInfo;
}

export function getMemePosteriorsPerBranchSite(resultsJson: MemeResults, rateClass = 1): Array<{Branch: string, Codon: number, Posterior: number, ER: number}> {
  const results: Array<{Branch: string, Codon: number, Posterior: number, ER: number}> = [];
  let offset = 0;
  
  _.each(resultsJson["branch attributes"], (data, partition) => {
    let partitionSize = 0;
    _.each(data, (perBranch, branch) => {
      if (perBranch["Posterior prob omega class by site"]) {
        _.each(perBranch["Posterior prob omega class by site"][rateClass], (p, i) => {
          const prior = resultsJson['MLE']['content'][partition][i][4];
          results.push({
            'Branch': branch, 
            'Codon': i + offset + 1, 
            'Posterior': p, 
            'ER': getMemeComputeER(prior, p)
          });
        });     
        partitionSize = perBranch["Posterior prob omega class by site"][rateClass].length;
      }
    });
    offset += partitionSize;
  });

  return results;
}

export function getMemeComputeER(prior: number, posterior: number): number {
  let priorOdds = prior < 1 ? prior / (1-prior) : Infinity;
  let posteriorOdds = posterior < 1 ? posterior / (1-posterior) : Infinity;
  
  if (posteriorOdds > 0) {
    return posteriorOdds / priorOdds;
  } else {
    if (priorOdds === 0) return 1;
    return Infinity;
  }
}
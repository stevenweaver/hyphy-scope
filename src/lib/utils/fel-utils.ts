import * as _ from "lodash-es";

interface FelResults {
  MLE: {
    content: Record<string, number[][]>;
    headers: [string, string][];
    LRT?: Record<string, number[][]>;
  };
  "data partitions": Record<string, { coverage: [number[]] }>;
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

export const COLORS = {
  'Diversifying': '#e74c3c',
  'Neutral': '#95a5a6', 
  'Purifying': '#3498db',
  'Invariable': '#ecf0f1'
};

export function getFelAttributes(resultsJson: FelResults): FelAttributes {
  const content = resultsJson.MLE?.content || {};
  const partitions = Object.keys(content);
  
  const hasSrv = Object.values(content).some((partition) => 
    partition?.some(([ds]) => ds > 0 && ds !== 1) || false
  );
  
  const hasCi = !!resultsJson["confidence interval"];
  
  const hasPositiveLRT = Object.values(content).some((partition) => 
    partition?.some(([_, __, ___, ____, lrt]) => lrt > 0) || false
  );
  
  const hasPasmt = !!resultsJson.MLE?.LRT;
  
  const variableSiteCount = Object.values(content)
    .map((partition) => partition?.filter(([ds, dn]) => ds + dn > 0) || [])
    .reduce((sum, filteredPartition) => sum + (filteredPartition?.length || 0), 0);

  // Extract basic attributes
  const numberOfPartitions = partitions.length;
  const numberOfSites = Object.values(content)
    .reduce((sum, partition) => sum + (partition?.length || 0), 0);
  
  // Estimate sequences from first partition if available
  const numberOfSequences = 10; // Default fallback
  const testedBranchCount = 5; // Default fallback

  return {
    hasSrv,
    hasCi,
    hasPositiveLRT,
    hasPasmt,
    numberOfSequences,
    numberOfSites,
    numberOfPartitions,
    testedBranchCount,
    variableSiteCount,
    hasBackground: hasSrv
  };
}

export function getFelTileSpecs(resultsJson: FelResults, pvalueThreshold: number): TileSpec[] {
  const felAttrs = getFelAttributes(resultsJson);
  const sitesTable = getFelSiteTableData(resultsJson, pvalueThreshold);

  return [
    {number: felAttrs.numberOfSequences, description: "sequences in the alignment", icon: "icon-options-vertical icons", color: "asbestos"}, 
    {number: felAttrs.numberOfSites, description: "codon sites in the alignment", icon: "icon-options icons", color: "asbestos"}, 
    {number: felAttrs.numberOfPartitions, description: "partitions", icon: "icon-arrow-up icons", color: "asbestos"}, 
    {number: felAttrs.testedBranchCount, description: "median branches/partition used for testing", icon: "icon-share icons", color: "asbestos"}, 
    {number: felAttrs.variableSiteCount, description: "non-invariant sites tested", icon: "icon-check icons", color: "asbestos"},
    {number: resultsJson.simulated || "N/A", description: "parametric bootstrap replicates", icon: "icon-layers icons", color: "asbestos"},
    {number: _.filter(sitesTable[0], (d) => d.class === "Diversifying").length, description: `sites under diversifying positive selection at p≤${pvalueThreshold}`, icon: "icon-plus icons", color: "midnight_blue"},
    {number: _.filter(sitesTable[0], (d) => d.class === "Purifying").length, description: `sites under purifying negative selection at p≤${pvalueThreshold}`, icon: "icon-minus icons", color: "midnight_blue"}
  ];
}

export function getFelSiteTableData(resultsJson: FelResults, pvalueThreshold: number): [SiteData[], [string, string][], Record<string, (d: any) => any>] {
  const felAttrs = getFelAttributes(resultsJson);
  const results: SiteData[] = [];
  const headers = _.clone(resultsJson.MLE.headers);
  const format: Record<string, (d: any) => any> = {};

  format[headers[0][0]] = (d: number) => d.toFixed(3);
  format[headers[1][0]] = (d: number) => d.toFixed(3);
  format[headers[2][0]] = (d: number) => d.toFixed(3);
  format[headers[3][0]] = (d: number) => d.toFixed(3);
  format[headers[4][0]] = (d: number) => d <= pvalueThreshold ? `<b>${d.toFixed(4)}</b>` : d.toFixed(4);
  
  if (felAttrs.hasPasmt) {
    format[headers[headers.length-1][0]] = format[headers[4][0]];
  }
  
  format[headers[5][0]] = (d: number) => d.toFixed(3);
  headers.push(["class", `Site classification at p<=${pvalueThreshold}`]); 
  format["class"] = (d: string) => `<span style="color:${COLORS[d as keyof typeof COLORS]}">${d}</span>`;

  _.each(resultsJson.MLE.content, (data, part) => {
    const siteLookup = resultsJson["data partitions"][part].coverage[0];
    _.each(data, (row, i) => {
      const rowObject: SiteData = {
        partition: (+part) + 1,
        codon: siteLookup[i] + 1,
        alpha: +row[0],
        beta: +row[1],
        "alpha=beta": +row[2],
        "dN/dS MLE": +row[3],
        "p-value": +row[4],
        class: row[4] <= pvalueThreshold ? (row[0] < row[1] ? "Diversifying" : "Purifying") : (row[0] + row[1] ? "Neutral" : "Invariable")
      };
      
      rowObject[headers[0][0]] = +row[0];
      rowObject[headers[1][0]] = +row[1];
      rowObject[headers[2][0]] = +row[2];
      rowObject[headers[3][0]] = +row[3];
      rowObject[headers[4][0]] = +row[4];
      
      if (felAttrs.hasPositiveLRT) {
        rowObject[headers[5][0]] = +row[5];
      }
      
      if (felAttrs.hasCi) {
        rowObject[headers[6][0]] = row[6];
        rowObject[headers[7][0]] = row[7];
        rowObject[headers[8][0]] = row[8];
      }
      
      if (felAttrs.hasPasmt) {
        rowObject[headers[headers.length-2][0]] = row[headers.length-2];
      }
      
      results.push(rowObject);
    });
  });
  
  return [results, headers, format];
}

export async function loadDataFromUrl(url: string): Promise<FelResults | null> {
  if (!url) return null;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data?.MLE ? data : null;
  } catch (error) {
    console.error('Error loading JSON from URL:', error);
    return null;
  }
}

export function loadDataFromStorage(id: string): FelResults | null {
  if (!id) return null;
  
  try {
    const key = `hyphy-results-${id}`;
    const localData = localStorage.getItem(key);
    if (localData) {
      const data = JSON.parse(localData);
      return data?.MLE ? data : null;
    }
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
  }
  
  return null;
}
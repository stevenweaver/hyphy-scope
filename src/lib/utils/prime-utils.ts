import * as d3 from 'd3';
import { phylotree } from 'phylotree';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface PrimeLambda {
  prop: string;
  name: string;
  value: number;
  p: number;
  sig: boolean;
  adj_p?: number;
}

export interface PrimeSite {
  site: number;
  subs: number;
  aa: number;
  r_ratio: number;
  p_omnibus: number;
  q_omnibus: number;
  log_p: number;
  lambdas: PrimeLambda[];
  is_sig?: boolean;
  [key: string]: any;
}

export interface PrimeMeta {
  sequences: number;
  codons: number;
  filename: string;
  models: string[];
  properties: string[];
  residueProperties: Record<string, Record<string, number>>;
  treeLength: number;
}

export interface ParsedPrime {
  meta: PrimeMeta;
  sites: PrimeSite[];
  raw: any;
}

export interface SiteInfo {
  composition: { aa: string; count: number }[];
  substitutions: { from: string; to: string; node: string }[];
  aggregatedSubstitutions: { type: string; count: number }[];
}

export interface AlignmentResult {
  mapping: Map<number, number>;
  score: number;
  queryAligned: string;
  targetAligned: string;
  rawQuery: string;
  rawTarget: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const geneticCode: Record<string, string> = {
  "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L",
  "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S",
  "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*",
  "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W",
  "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
  "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
  "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
  "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
  "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M",
  "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T",
  "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K",
  "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R",
  "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
  "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
  "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
  "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
  "---": "-", "GAP": "-", "~~~": "-"
};

// ── Internal Helpers ────────────────────────────────────────────────────────

function getColumnIndices(headers: [string, string][]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const label = h[0].toLowerCase();
    if (label === "p-value") map.p_omnibus = i;
    if (label === "q-value") map.q_omnibus = i;
    if (label === "# subs") map.subs = i;
    if (label === "# aa") map.aa = i;
    if (label === "total branch length") map.tree_length = i;
  });
  return map;
}

function calculateTreeLengthFromAttributes(branchAttributes: any, modelName: string): number {
  if (!branchAttributes || !branchAttributes["0"]) return 0;
  const branches = branchAttributes["0"];
  let totalLength = 0;
  for (const branchName in branches) {
    const attr = branches[branchName];
    if (attr[modelName] !== undefined) totalLength += attr[modelName];
  }
  return totalLength;
}

// ── FDR Calculation ─────────────────────────────────────────────────────────

export function calculateFDR(pValues: number[], alpha: number = 0.1): Set<number> {
  const m = pValues.length;
  if (m === 0) return new Set();
  const sorted = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  let maxK = -1;
  for (let k = 0; k < m; k++) {
    if (sorted[k].p <= ((k + 1) / m) * alpha) maxK = k;
  }
  const sigIndices = new Set<number>();
  if (maxK >= 0) {
    for (let k = 0; k <= maxK; k++) sigIndices.add(sorted[k].i);
  }
  return sigIndices;
}

// ── Two-Stage BB Correction ─────────────────────────────────────────────────

export function calculateBB(sites: PrimeSite[], q: number = 0.1): PrimeSite[] {
  const m = sites.length;
  if (m === 0) return sites;
  const pOmnibus = sites.map(d => d.p_omnibus);
  const sigIndices = calculateFDR(pOmnibus, q);
  const r = sigIndices.size;
  const bbFactor = r > 0 ? m / r : 1e10;

  return sites.map((site, i) => {
    const isOmnibusSig = sigIndices.has(i);
    const sorted = [...site.lambdas].sort((a, b) => a.p - b.p);
    const K = sorted.length;

    const updatedLambdas: PrimeLambda[] = site.lambdas.map(l => {
      const rank = sorted.findIndex(s => s.name === l.name);
      return { ...l, adj_p: Math.min(1, l.p * bbFactor * (K - rank)), sig: false };
    });

    const sortedByP = [...updatedLambdas].sort((a, b) => a.p - b.p);
    for (let j = 0; j < K; j++) {
      if (j > 0) sortedByP[j].adj_p = Math.max(sortedByP[j].adj_p!, sortedByP[j - 1].adj_p!);
      sortedByP[j].sig = isOmnibusSig && sortedByP[j].adj_p! <= q;
    }

    const newSite: PrimeSite = { ...site, is_sig: isOmnibusSig, lambdas: updatedLambdas };
    updatedLambdas.forEach(l => { newSite[l.name] = l; });
    return newSite;
  });
}

// ── Data Parsing ────────────────────────────────────────────────────────────

export function parsePrimeJSON(json: any): ParsedPrime {
  if (!json || !json.MLE || !json.MLE.content || !json.MLE.content["0"])
    throw new Error("Invalid format");

  const input = json.input || {};
  const fits = json.fits || {};
  const model = json.model || json;
  const branchAttributes = json["branch attributes"] || {};
  const residueProperties: Record<string, Record<string, number>> = model["residue_properties"] || {};
  const headers = json.MLE.headers;
  const propertyNames = Object.keys(residueProperties);
  const colMap = getColumnIndices(headers);
  const ordering = json.ordering || {};

  let firstLambdaIdx = headers.findIndex(
    (h: [string, string]) =>
      h[0].includes("&lambda;1") || h[0].includes("lambda_1") || h[0].toLowerCase().includes("lambda1")
  );
  if (firstLambdaIdx === -1)
    firstLambdaIdx = colMap.q_omnibus !== undefined ? colMap.q_omnibus + 1 : 11;

  const sortedProps = propertyNames.sort(
    (a, b) => (ordering[a] ?? 0) - (ordering[b] ?? 0)
  );
  const propCols = sortedProps.map((name, idx) => ({
    name,
    displayName: name.replace(/_/g, " "),
    lambda: firstLambdaIdx + idx * 3,
    p: firstLambdaIdx + idx * 3 + 1
  }));

  const meta: PrimeMeta = {
    sequences: input["number of sequences"] || 0,
    codons: input["number of sites"] || 0,
    filename: input["file name"] || "Unknown",
    models: Object.keys(fits),
    properties: sortedProps.map(p => p.replace(/_/g, " ")),
    residueProperties,
    treeLength: calculateTreeLengthFromAttributes(branchAttributes, Object.keys(fits)[0] || "Global MG94xREV")
  };

  const sites: PrimeSite[] = json.MLE.content["0"].map((row: number[], i: number) => {
    const subs = row[colMap.subs];
    const aa = row[colMap.aa];
    const site: PrimeSite = {
      site: i + 1,
      subs,
      aa,
      r_ratio: aa > 0 ? subs / aa : 0,
      p_omnibus: row[colMap.p_omnibus],
      q_omnibus: row[colMap.q_omnibus],
      log_p: -Math.log10(row[colMap.p_omnibus] + 1e-10),
      lambdas: []
    };
    propCols.forEach(pc => {
      const val: PrimeLambda = {
        prop: pc.displayName,
        name: pc.name,
        value: row[pc.lambda],
        p: row[pc.p],
        sig: row[pc.p] < 0.05
      };
      site.lambdas.push(val);
      site[pc.name] = val;
    });
    return site;
  });

  return { meta, sites, raw: json };
}

// ── Site Info Recovery ──────────────────────────────────────────────────────

export function recoverSiteInfo(siteIdx: number, json: any, treeInstance: any): SiteInfo {
  const mle = json.MLE || {};
  const subsBlock = json.substitutions || mle.substitutions;
  if (!treeInstance || !subsBlock) {
    return { composition: [], substitutions: [], aggregatedSubstitutions: [] };
  }

  const partition = subsBlock[Object.keys(subsBlock)[0]];
  const substitutionsRaw = partition[siteIdx.toString()];
  if (!substitutionsRaw) {
    return { composition: [], substitutions: [], aggregatedSubstitutions: [] };
  }

  const substitutions: Record<string, string> = {};
  for (const key in substitutionsRaw) substitutions[key.toUpperCase()] = substitutionsRaw[key];

  try {
    const siteSubs: { from: string; to: string; node: string }[] = [];
    const tipAAs: string[] = [];
    const rootNode = treeInstance.root || treeInstance.nodes;
    const globalRootCodon = substitutions["ROOT"] || substitutions["root"] || "---";

    function walk(node: any, parentCodon: string) {
      const rawName = node.data?.name || node.name || "";
      const normalizedName = rawName.toUpperCase();
      let currentCodon = substitutions[normalizedName] || parentCodon;
      if (node === rootNode && !substitutions[normalizedName]) currentCodon = globalRootCodon;

      node.codon = currentCodon;
      if (node.data) node.data.codon = currentCodon;

      if (parentCodon && parentCodon !== "---" && currentCodon !== "---" && currentCodon !== parentCodon) {
        const fromAA = geneticCode[parentCodon.toUpperCase()] || "?";
        const toAA = geneticCode[currentCodon.toUpperCase()] || "?";
        if (fromAA !== toAA && fromAA !== "?" && toAA !== "?")
          siteSubs.push({ from: fromAA, to: toAA, node: rawName || "unnamed" });
      }
      if (node.children) node.children.forEach((child: any) => walk(child, currentCodon));
      else {
        const aa = geneticCode[currentCodon?.toUpperCase()] || "?";
        if (aa !== "?" && aa !== "*") tipAAs.push(aa);
      }
    }
    walk(rootNode, globalRootCodon);

    const counts = d3.rollup(tipAAs, v => v.length, d => d);
    const typeCounts = new Map<string, number>();
    siteSubs.forEach(s => {
      const type = [s.from, s.to].sort().join(" : ");
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    return {
      composition: Array.from(counts, ([aa, count]) => ({ aa, count })).sort((a, b) => b.count - a.count),
      substitutions: siteSubs,
      aggregatedSubstitutions: Array.from(typeCounts, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
    };
  } catch (e) {
    console.error("[PRIME] Error in recoverSiteInfo for site", siteIdx, e);
    return { composition: [], substitutions: [], aggregatedSubstitutions: [] };
  }
}

// ── Site Tree Rendering ─────────────────────────────────────────────────────

export function plotSiteTree(
  siteIdx: number,
  json: any,
  treeInstance: any,
  options: { width?: number; height?: number; colorProp?: string; residueProperties?: Record<string, Record<string, number>> | null } = {}
): HTMLElement {
  const { width = 600, height = 400, colorProp = "None", residueProperties = null } = options;

  const mle = json.MLE || {};
  const subsBlock = json.substitutions || mle.substitutions;

  if (!treeInstance || !subsBlock) {
    const div = document.createElement("div");
    div.style.cssText = "color: #999; font-style: italic; padding: 20px; text-align: center;";
    div.textContent = "No tree data available for this site.";
    return div;
  }

  const partition = subsBlock[Object.keys(subsBlock)[0]];
  const substitutionsRaw = partition[siteIdx.toString()];
  if (!substitutionsRaw) {
    const div = document.createElement("div");
    div.style.cssText = "color: #999; font-style: italic; padding: 20px; text-align: center;";
    div.textContent = `No substitution data available for site ${siteIdx + 1}.`;
    return div;
  }

  const substitutions: Record<string, string> = {};
  for (const key in substitutionsRaw) substitutions[key.toUpperCase()] = substitutionsRaw[key];

  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.position = "relative";

  const aaColor = d3.scaleOrdinal(d3.schemeTableau10).domain("ACDEFGHIKLMNPQRSTVWY".split(""));
  const propDiffScale = d3.scaleDiverging(d3.interpolateRdBu).domain([-2, 0, 2]).clamp(true);

  const internalPropName = colorProp !== "None" && residueProperties
    ? Object.keys(residueProperties).find(k => k.replace(/_/g, " ") === colorProp)
    : null;

  try {
    const visualization = treeInstance.render({
      container,
      width,
      height,
      "show-scale": false,
      "is-radial": false,
      "node_circle_size": (node: any) => {
        if (node.children && node.children.length > 0) return 0;
        return 3;
      },
      "node-styler": (element: any, data: any) => {
        const isTip = !data.children || data.children.length === 0;
        const codon = data.data?.codon || "---";
        const aa = geneticCode[codon.toUpperCase()] || "-";
        const color = (aa !== "-" && aa !== "?") ? aaColor(aa) : "#ccc";
        element.selectAll("circle").style("fill", color);

        if (element.select("title").empty()) {
          element.append("title").text(`${data.data.name || "unnamed"}: ${aa} (${codon})`);
        } else {
          element.select("title").text(`${data.data.name || "unnamed"}: ${aa} (${codon})`);
        }

        if (isTip) {
          let name = data.data.name || "unnamed";
          if (name.length > 20) name = name.substring(0, 17) + "...";
          const labelText = `${aa} [${name}]`;
          let text = element.select("text");
          if (text.empty()) text = element.append("text");
          text.text(labelText)
            .attr("dx", ".4em")
            .attr("dy", ".35em")
            .style("font-size", "10px")
            .style("font-family", "sans-serif")
            .style("pointer-events", "none");
        } else {
          const text = element.select("text");
          if (!text.empty()) text.remove();
        }
      },
      "edge-styler": (element: any, data: any) => {
        const fromCodon = data.target.parent?.data?.codon || "---";
        const toCodon = data.target.data?.codon || "---";
        const fromAA = geneticCode[fromCodon.toUpperCase()] || "-";
        const toAA = geneticCode[toCodon.toUpperCase()] || "-";

        if (internalPropName && residueProperties && fromAA !== "-" && toAA !== "-" && fromAA !== toAA) {
          const valFrom = residueProperties[internalPropName][fromAA] || 0;
          const valTo = residueProperties[internalPropName][toAA] || 0;
          const diff = valTo - valFrom;
          element.style("stroke", propDiffScale(diff)).style("stroke-width", "4px");
          let title = element.select("title");
          if (title.empty()) title = element.append("title");
          title.text(`${fromAA} -> ${toAA}\n\u0394 ${colorProp}: ${diff.toFixed(2)}`);
        } else {
          if (fromAA !== toAA && fromAA !== "-" && toAA !== "-") {
            element.style("stroke", "#d93025").style("stroke-width", "3px");
          } else {
            element.style("stroke", "#ccc").style("stroke-width", "1px");
          }
        }
      }
    });

    const svgNode = visualization.show();
    if (svgNode) {
      container.appendChild(svgNode);

      if (internalPropName) {
        const legend = document.createElement("div");
        legend.style.cssText = "position: absolute; top: 10px; right: 10px; background: white; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1); pointer-events: none; z-index: 100;";
        const ramp = d3.quantize(d3.interpolateRdBu, 10).reverse();
        legend.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 6px; color: black; border-bottom: 1px solid #eee; padding-bottom: 2px;">\u0394 ${colorProp}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #666;">Decrease</span>
            <div style="height: 12px; width: 100px; background: linear-gradient(to right, ${ramp.join(',')}); border: 1px solid #ddd;"></div>
            <span style="color: #666;">Increase</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #999; font-size: 9px;">
            <span>-2.0</span><span>0</span><span>+2.0</span>
          </div>
        `;
        container.appendChild(legend);
      }
    }
    return container;
  } catch (e: any) {
    console.error("[PRIME] Error rendering site tree:", e);
    const div = document.createElement("div");
    div.style.cssText = "color: red; padding: 20px; text-align: center;";
    div.textContent = `Error rendering tree: ${e.message}`;
    return div;
  }
}

// ── Consensus Sequence ──────────────────────────────────────────────────────

export function getConsensusSequence(sites: PrimeSite[], rawJson: any, treeInstance: any): string {
  if (!sites || !rawJson || !treeInstance) return "";
  const seq: string[] = [];
  for (let i = 0; i < sites.length; i++) {
    const info = recoverSiteInfo(i, rawJson, treeInstance);
    seq.push(info && info.composition && info.composition.length > 0 ? info.composition[0].aa : "-");
  }
  return seq.join("");
}

// ── Smith-Waterman Alignment ────────────────────────────────────────────────

export function alignSequences(query: string, target: string): AlignmentResult {
  const m = query.length;
  const n = target.length;
  const score: Int32Array[] = Array.from({ length: m + 1 }, () => new Int32Array(n + 1).fill(0));
  const GAP = -2, MATCH = 3, MISMATCH = -1;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = query[i - 1] === target[j - 1] ? MATCH : MISMATCH;
      score[i][j] = Math.max(0, score[i - 1][j - 1] + match, score[i - 1][j] + GAP, score[i][j - 1] + GAP);
    }
  }

  let maxScore = -1, startI = 0, startJ = 0;
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (score[i][j] > maxScore) { maxScore = score[i][j]; startI = i; startJ = j; }
    }
  }

  const mapping = new Map<number, number>();
  let i = startI, j = startJ;
  const alignedQ: string[] = [], alignedT: string[] = [];

  while (i > 0 && j > 0 && score[i][j] > 0) {
    const current = score[i][j];
    const diag = score[i - 1][j - 1];
    const up = score[i - 1][j];
    const matchVal = query[i - 1] === target[j - 1] ? MATCH : MISMATCH;

    if (current === diag + matchVal) {
      mapping.set(i - 1, j - 1);
      alignedQ.push(query[i - 1]);
      alignedT.push(target[j - 1]);
      i--; j--;
    } else if (current === up + GAP) {
      alignedQ.push(query[i - 1]);
      alignedT.push("-");
      i--;
    } else {
      alignedQ.push("-");
      alignedT.push(target[j - 1]);
      j--;
    }
  }

  return {
    mapping,
    score: maxScore,
    queryAligned: alignedQ.reverse().join(""),
    targetAligned: alignedT.reverse().join(""),
    rawQuery: query,
    rawTarget: target
  };
}

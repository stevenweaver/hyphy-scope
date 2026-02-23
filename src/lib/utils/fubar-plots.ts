import * as Plot from "@observablehq/plot";
import * as d3 from 'd3';
import type { FubarParsedSite } from './fubar-utils.js';
import { batlow } from './fubar-utils.js';

const labelMap: Record<string, string> = {
  probPos: "Prob[α < β]",
  bfPos: "BF[α < β]",
  probInv: "Prob[α = β = 0]",
  ebfInv: "EBF[α = β = 0]",
  probProx: "Prob[α, β ≈ 0]",
  ebfProx: "EBF[α, β ≈ 0]",
  probAlpha0: "Prob[α = 0]",
  ebfAlpha0: "EBF[α = 0]",
  probBeta0: "Prob[β = 0]",
  ebfBeta0: "EBF[β = 0]"
};

export function plotManhattan(
  sites: FubarParsedSite[],
  options: { width?: number; threshold?: number; metric?: string } = {}
): SVGElement | HTMLElement {
  const { width, threshold = 0.9, metric = "probPos" } = options;
  const isBF = metric.startsWith("ebf") || metric === "bfPos";
  const yLabel = labelMap[metric] || metric;
  const yDomain: [number, number] = isBF
    ? [0, (d3.max(sites, d => d[metric] as number) || 1) * 1.1]
    : [0, 1];

  return Plot.plot({
    title: `Evidence: ${yLabel}`,
    width,
    height: 300,
    y: {
      label: yLabel,
      grid: true,
      domain: yDomain,
      type: isBF ? "symlog" : "linear"
    },
    x: { label: "Site Index" },
    marks: [
      Plot.ruleY([threshold], { stroke: "red", strokeDasharray: "4,4" }),
      Plot.dot(sites, {
        x: "site",
        y: metric,
        fill: (d: any) => d[metric] >= threshold ? "red" : "#ccc",
        r: (d: any) => d[metric] >= threshold ? 4 : 2
      }),
      Plot.tip(sites, Plot.pointer({
        x: "site",
        y: metric,
        title: (d: any) => `Site: ${d.site}\nα: ${d.alpha.toFixed(3)}\nβ: ${d.beta.toFixed(3)}\n${yLabel}: ${d[metric]?.toFixed(4) || "N/A"}`
      }))
    ]
  });
}

export function plotRates(
  sites: FubarParsedSite[],
  options: { width?: number } = {}
): SVGElement | HTMLElement {
  const { width } = options;
  return Plot.plot({
    title: "Site-level Rates",
    width,
    height: 300,
    y: { label: "Rate (dN up, dS down)", grid: true },
    x: { label: "Site Index" },
    color: {
      domain: ["dN (beta)", "dS (alpha)"],
      range: ["#d93025", "#0072b2"],
      legend: true
    },
    marks: [
      Plot.ruleY([0]),
      Plot.areaY(sites, { x: "site", y: "beta", fill: "#d93025", opacity: 0.6 }),
      Plot.areaY(sites, { x: "site", y: (d: any) => -d.alpha, fill: "#0072b2", opacity: 0.6 }),
      Plot.line(sites, { x: "site", y: "beta", stroke: "#d93025", strokeWidth: 1 }),
      Plot.line(sites, { x: "site", y: (d: any) => -d.alpha, stroke: "#0072b2", strokeWidth: 1 }),
      Plot.tip(sites, Plot.pointer({
        x: "site",
        y: "beta",
        title: (d: any) => `Site: ${d.site}\ndN (β): ${d.beta.toFixed(3)}\ndS (α): ${d.alpha.toFixed(3)}`
      }))
    ]
  });
}

export function plotGrid(
  grid: number[][],
  options: { width?: number } = {}
): SVGElement | HTMLElement | null {
  if (!grid) return null;
  const { width } = options;
  const data = grid.map(d => ({ alpha: d[0], beta: d[1], weight: d[2] * 100 }));

  return Plot.plot({
    title: "Global Rate Distribution (Prior)",
    width,
    height: 400,
    x: { label: "α (synonymous)", type: "log", base: 10, domain: [0.01, 50], grid: true },
    y: { label: "β (non-synonymous)", type: "log", base: 10, domain: [0.01, 50], grid: true },
    r: { domain: [0, 100], range: [0, 50] },
    color: {
      type: "sqrt",
      range: batlow,
      label: "Weight (%)",
      domain: [0, 100]
    },
    marks: [
      Plot.line([[0.01, 0.01], [50, 50]], {
        stroke: "#ccc",
        strokeDasharray: "4,4",
        opacity: 0.5
      }),
      Plot.dot(data, {
        x: (d: any) => d.alpha + 0.01,
        y: (d: any) => d.beta + 0.01,
        fill: "weight",
        r: (d: any) => Math.sqrt(d.weight) * 5,
        stroke: "white",
        strokeWidth: 0.5,
        opacity: (d: any) => d.weight > 0.01 ? 1 : 0.1
      }),
      Plot.tip(data, Plot.pointer({
        x: (d: any) => d.alpha + 0.01,
        y: (d: any) => d.beta + 0.01,
        title: (d: any) => `α: ${d.alpha.toFixed(3)}\nβ: ${d.beta.toFixed(3)}\nWeight: ${d.weight.toFixed(2)}%`
      }))
    ]
  });
}

export function plotHeatmap(
  grid: number[][],
  options: { width?: number; title?: string; scaleType?: string } = {}
): SVGElement | HTMLElement | null {
  if (!grid) return null;
  const { width = 600, title = "Alignment Prior (Rate Distribution)", scaleType = "log" } = options;
  const data = grid.map(d => ({ alpha: d[0], beta: d[1], weight: d[2] }));
  const isLog = scaleType === "log";

  const gridSize = Math.sqrt(data.length);
  const r = Math.max(6, width / (gridSize * 2.2));
  const domain: [number, number] = isLog
    ? [0.01, 50]
    : [0, (d3.max(data, d => Math.max(d.alpha, d.beta)) || 1) * 1.1];

  return Plot.plot({
    title,
    width,
    height: 500,
    marginLeft: 60,
    marginBottom: 60,
    x: {
      label: "Synonymous rate (α) →",
      type: scaleType as any,
      domain,
      grid: true,
      ticks: isLog ? [0.01, 0.1, 1, 10, 50] : undefined,
      format: ".1f"
    },
    y: {
      label: "↑ Non-synonymous rate (β)",
      type: scaleType as any,
      domain,
      grid: true,
      ticks: isLog ? [0.01, 0.1, 1, 10, 50] : undefined,
      format: ".1f"
    },
    color: {
      type: "sqrt",
      range: batlow,
      label: "Posterior Weight",
      legend: true
    },
    marks: [
      Plot.line([[domain[0], domain[0]], [domain[1], domain[1]]], {
        stroke: "#ccc",
        strokeDasharray: "4,4",
        opacity: 0.8,
        strokeWidth: 1.5
      }),
      Plot.dot(data, {
        x: (d: any) => isLog ? d.alpha + 0.01 : d.alpha,
        y: (d: any) => isLog ? d.beta + 0.01 : d.beta,
        fill: "weight",
        symbol: "square",
        r,
        stroke: "white",
        strokeWidth: 0.5
      }),
      Plot.text([
        { x: domain[1] * 0.2, y: domain[1] * 0.8, text: "Positive Selection (β > α)" },
        { x: domain[1] * 0.8, y: domain[1] * 0.2, text: "Negative Selection (α > β)" }
      ], {
        x: "x",
        y: "y",
        text: "text",
        fontSize: 14,
        fontWeight: "bold",
        opacity: 0.6,
        textAnchor: "middle"
      }),
      Plot.tip(data, Plot.pointer({
        x: (d: any) => isLog ? d.alpha + 0.01 : d.alpha,
        y: (d: any) => isLog ? d.beta + 0.01 : d.beta,
        title: (d: any) => `α: ${d.alpha.toFixed(3)}\nβ: ${d.beta.toFixed(3)}\nWeight: ${(d.weight * 100).toFixed(2)}%`
      }))
    ]
  });
}

export function plotSitePosterior(
  siteIdx: number,
  grid: number[][],
  posterior: any,
  options: { width?: number } = {}
): SVGElement | HTMLElement {
  const { width } = options;

  if (!posterior || Object.keys(posterior).length === 0) {
    const div = document.createElement('div');
    div.style.cssText = "color: #888; font-style: italic; padding: 40px; text-align: center; border: 1px dashed #ccc; border-radius: 4px;";
    div.textContent = "Site-level posterior weights were not provided in this results file.";
    return div;
  }

  const partitionKey = Object.keys(posterior)[0];
  if (!partitionKey || !posterior[partitionKey]) {
    const div = document.createElement('div');
    div.style.cssText = "color: #888; font-style: italic; padding: 20px; text-align: center;";
    div.textContent = "No partition data found in posterior object.";
    return div;
  }

  const siteWeightsRaw = posterior[partitionKey][siteIdx.toString()];

  if (!siteWeightsRaw) {
    const div = document.createElement('div');
    div.style.cssText = "color: #888; font-style: italic; padding: 20px; text-align: center;";
    div.textContent = `No posterior data available for site ${siteIdx + 1}.`;
    return div;
  }

  const siteWeights = siteWeightsRaw.flat();

  const data = grid.map((d: number[], i: number) => ({
    alpha: d[0],
    beta: d[1],
    weight: (siteWeights[i] ?? 0) * 100
  }));

  return Plot.plot({
    title: `Site ${siteIdx + 1} Posterior Distribution`,
    width,
    height: 400,
    x: { label: "α (synonymous)", type: "log", base: 10, domain: [0.01, 50], grid: true },
    y: { label: "β (non-synonymous)", type: "log", base: 10, domain: [0.01, 50], grid: true },
    r: { domain: [0, 100], range: [0, 50] },
    color: {
      type: "symlog",
      range: batlow,
      label: "Prob (%)",
      domain: [0, 100]
    },
    marks: [
      Plot.line([[0.01, 0.01], [50, 50]], {
        stroke: "#ccc",
        strokeDasharray: "4,4",
        opacity: 0.5
      }),
      Plot.dot(data, {
        x: (d: any) => d.alpha + 0.01,
        y: (d: any) => d.beta + 0.01,
        fill: "weight",
        r: (d: any) => Math.sqrt(d.weight) * 5,
        stroke: "white",
        strokeWidth: 0.5,
        opacity: (d: any) => d.weight > 0.01 ? 1 : 0.1
      }),
      Plot.tip(data, Plot.pointer({
        x: (d: any) => d.alpha + 0.01,
        y: (d: any) => d.beta + 0.01,
        title: (d: any) => `α: ${d.alpha.toFixed(3)}\nβ: ${d.beta.toFixed(3)}\nProb: ${d.weight.toFixed(2)}%`
      }))
    ]
  });
}

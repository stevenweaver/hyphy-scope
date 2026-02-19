import * as Plot from "@observablehq/plot";
import * as d3 from 'd3';
import type { PrimeSite, PrimeMeta } from './prime-utils.js';

// ── Manhattan Plot (Omnibus) ────────────────────────────────────────────────

export function plotManhattan(
  data: PrimeSite[],
  options: { width?: number; fdrIndices?: Set<number> } = {}
): SVGElement | HTMLElement {
  const { width, fdrIndices } = options;
  return Plot.plot({
    title: "Site Significance (Omnibus Test)",
    width,
    height: 300,
    y: { label: "-log10(p)", grid: true },
    x: { label: "Site Index" },
    marks: [
      Plot.ruleY([1.3], { stroke: "red", strokeDasharray: "4,4" }),
      Plot.dot(data, {
        x: "site",
        y: "log_p",
        fill: (d: any, i: number) => fdrIndices && fdrIndices.has(i) ? "red" : "#ccc",
        r: (d: any, i: number) => fdrIndices && fdrIndices.has(i) ? 4 : 2
      }),
      Plot.tip(data, Plot.pointer({
        x: "site",
        y: "log_p",
        title: (d: any) => `Site: ${d.site}\nSubs: ${d.subs}\nP: ${d.p_omnibus.toFixed(4)}`
      }))
    ]
  });
}

// ── Property Manhattan Plot ─────────────────────────────────────────────────

export function plotPropertyManhattan(
  data: PrimeSite[],
  propertyName: string,
  options: { width?: number } = {}
): SVGElement | HTMLElement {
  const { width } = options;
  const propMeta = data[0]?.lambdas.find(l => l.prop === propertyName);
  const internalName = propMeta ? propMeta.name : propertyName.replace(/ /g, "_");

  const propData = data.map(d => {
    const pVal = d[internalName];
    return {
      site: d.site,
      lambda: pVal?.value || 0,
      p: pVal?.p || 1,
      adj_p: pVal?.adj_p || 1,
      log_p: pVal ? -Math.log10(pVal.p + 1e-10) : 0,
      sig: pVal?.sig || false
    };
  });

  return Plot.plot({
    title: `Significance: ${propertyName}`,
    width,
    height: 250,
    y: { label: "-log10(p)", grid: true },
    x: { label: "Site Index" },
    color: { domain: [true, false], range: ["red", "#ccc"] },
    marks: [
      Plot.ruleY([1.3], { stroke: "red", strokeDasharray: "4,4" }),
      Plot.dot(propData, {
        x: "site",
        y: "log_p",
        fill: "sig",
        r: (d: any) => d.sig ? 4 : 1.5
      }),
      Plot.tip(propData, Plot.pointer({
        x: "site",
        y: "log_p",
        title: (d: any) => `Site: ${d.site}\nLambda: ${d.lambda.toFixed(2)}\nRaw p: ${d.p.toExponential(2)}\nAdj p: ${d.adj_p.toFixed(4)}`
      }))
    ]
  });
}

// ── Lambda Heatmap ──────────────────────────────────────────────────────────

export function plotLambdaHeatmap(
  data: PrimeSite[],
  options: { width?: number } = {}
): SVGElement | HTMLElement | null {
  const { width } = options;
  if (!data || data.length === 0) return null;

  const flatData = data.flatMap(d =>
    d.lambdas.map(l => ({
      site: d.site,
      prop: l.prop,
      lambda: l.value,
      p: l.p,
      sig: l.sig
    }))
  );

  return Plot.plot({
    title: "Site-Level Property Constraints (Heatmap)",
    width,
    height: 150 + (data[0].lambdas.length * 20),
    marginLeft: 150,
    marginBottom: 40,
    x: { label: "Site Index", grid: true },
    y: { label: null, domain: data[0].lambdas.map(l => l.prop) },
    color: { scheme: "RdBu", pivot: 0, label: "Lambda", reverse: false, domain: [-15, 15], clamp: true, legend: true },
    marks: [
      Plot.rect(flatData, {
        x1: (d: any) => d.site - 0.5,
        x2: (d: any) => d.site + 0.5,
        y: "prop",
        fill: "lambda"
      }),
      Plot.dot(flatData.filter((d: any) => d.sig), {
        x: "site",
        y: "prop",
        fill: "black",
        r: 1.5
      }),
      Plot.tip(flatData, Plot.pointer({
        x: "site",
        y: "prop",
        title: (d: any) => `Site: ${d.site}\nProp: ${d.prop}\nLambda: ${d.lambda.toFixed(2)}`
      }))
    ]
  });
}

// ── Composition Bar Chart ───────────────────────────────────────────────────

export function plotComposition(
  composition: { aa: string; count: number }[],
  options: { width?: number } = {}
): SVGElement | HTMLElement | null {
  const { width = 600 } = options;
  if (!composition || composition.length === 0) return null;

  return Plot.plot({
    width,
    height: 120,
    marginTop: 10,
    marginBottom: 30,
    x: { label: null, domain: "ACDEFGHIKLMNPQRSTVWY".split(""), tickSize: 0 },
    y: { type: "symlog", label: "Count", grid: true },
    marks: [
      Plot.barY(composition, { x: "aa", y: "count", fill: "#666", tip: true }),
      Plot.ruleY([0])
    ]
  });
}

// ── Predicted AA Preferences ────────────────────────────────────────────────

export function plotPreferences(
  siteData: PrimeSite,
  meta: PrimeMeta,
  options: { width?: number } = {}
): SVGElement | HTMLElement | null {
  const { width = 600 } = options;
  if (!siteData || !meta.residueProperties) return null;

  const aminoAcids = "ACDEFGHIKLMNPQRSTVWY".split("");
  const residueProps = meta.residueProperties;
  const propNames = Object.keys(residueProps);

  const preferences = aminoAcids.map(aa => {
    let score = 0;
    propNames.forEach(pn => {
      score += (siteData[pn]?.value || 0) * (residueProps[pn][aa] || 0);
    });
    return { aa, score, expScore: 0, prob: 0 };
  });

  const maxScore = d3.max(preferences, d => d.score)!;
  let sumExp = 0;
  preferences.forEach(p => {
    p.expScore = Math.exp(p.score - maxScore);
    sumExp += p.expScore;
  });
  preferences.forEach(p => { p.prob = p.expScore / sumExp; });

  return Plot.plot({
    title: "Predicted Amino Acid Preferences",
    width,
    height: 200,
    x: { label: "Amino Acid", domain: aminoAcids },
    y: { label: "Probability", grid: true, domain: [0, 1] },
    marks: [
      Plot.barY(preferences, { x: "aa", y: "prob", fill: "steelblue", tip: true }),
      Plot.ruleY([0])
    ]
  });
}

// ── Radar Plot ──────────────────────────────────────────────────────────────

export function plotRadar(
  siteData: PrimeSite,
  options: { width?: number; height?: number } = {}
): SVGElement | HTMLElement | null {
  const { width = 400, height = 400 } = options;
  if (!siteData || !siteData.lambdas) return null;

  const data = siteData.lambdas;
  const numProps = data.length;
  const outerRadius = Math.min(width, height) / 2 - 60;
  const innerRadius = 25;
  const angleStep = (Math.PI * 2) / numProps;
  const rScale = d3.scaleLinear().domain([-15, 15]).range([outerRadius, innerRadius]);

  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = rScale(d.value);
    return { x: r * Math.cos(angle), y: r * Math.sin(angle), label: `P${i + 1}: ${d.prop}`, value: d.value, sig: d.sig };
  });

  const gridMarks = [-15, -7.5, 0, 7.5, 15].flatMap(t => {
    const r = rScale(t);
    const ring = Array.from({ length: 33 }, (_, j) => {
      const a = (j * Math.PI * 2) / 32;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
    return [
      Plot.line(ring, { x: "x", y: "y", stroke: "#ccc", strokeOpacity: 0.2 }),
      Plot.text([{ x: 0, y: -r, label: t > 0 ? `+${t}` : t.toString() }], { x: "x", y: "y", text: "label", dy: -5, fontSize: 8, fill: "#888" })
    ];
  });

  const axisMarks = data.flatMap((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = outerRadius * Math.cos(angle);
    const y2 = outerRadius * Math.sin(angle);
    return [
      Plot.line([{ x: 0, y: 0 }, { x: x2, y: y2 }], { x: "x", y: "y", stroke: "#ccc", strokeOpacity: 0.3 }),
      Plot.text([{ x: (outerRadius + 25) * Math.cos(angle), y: (outerRadius + 25) * Math.sin(angle), label: `P${i + 1}: ${d.prop}` }], {
        x: "x", y: "y", text: "label", textAnchor: "middle", fontSize: 10, fontWeight: "bold"
      })
    ];
  });

  return Plot.plot({
    width, height,
    viewBox: `${-width / 2} ${-height / 2} ${width} ${height}`,
    x: { axis: null, domain: [-width / 2, width / 2] },
    y: { axis: null, domain: [-height / 2, height / 2] },
    marks: [
      ...gridMarks,
      ...axisMarks,
      Plot.line(points, { x: "x", y: "y", stroke: "#0072b2", strokeWidth: 2, fill: "#0072b2", fillOpacity: 0.1, curve: "linear-closed" }),
      Plot.dot(points, {
        x: "x", y: "y",
        fill: (d: any) => d.value > 0 ? "#0072b2" : "#d93025",
        stroke: "white",
        r: (d: any) => d.sig ? 6 : 3,
        tip: true,
        title: (d: any) => `${d.label}\nLambda: ${d.value.toFixed(2)}`
      })
    ]
  });
}

// ── Substitution Comparison Radar ───────────────────────────────────────────

export function plotSubstitutionComparison(
  pairString: string,
  meta: PrimeMeta,
  options: { width?: number; height?: number } = {}
): SVGElement | HTMLElement | null {
  const { width = 400, height = 400 } = options;
  if (!pairString || !meta.residueProperties) return null;

  const parts = pairString.split(" : ");
  const aa1 = parts[0], aa2 = parts[1];
  const residueProps = meta.residueProperties;
  const internalPropNames = Object.keys(residueProps);
  const numProps = internalPropNames.length;
  const outerRadius = Math.min(width, height) / 2 - 60;
  const innerRadius = 30;
  const angleStep = (Math.PI * 2) / numProps;
  const rScale = d3.scaleLinear().domain([-3, 3]).range([innerRadius, outerRadius]);

  const getPoints = (aa: string) =>
    internalPropNames.map((pn, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const val = residueProps[pn][aa] || 0;
      const r = rScale(val);
      return { x: r * Math.cos(angle), y: r * Math.sin(angle), prop: `P${i + 1}: ${pn.replace(/_/g, " ")}`, val, aa, angle };
    });

  const p1 = getPoints(aa1), p2 = getPoints(aa2);

  const gridMarks = [-3, -1.5, 0, 1.5, 3].flatMap(t => {
    const r = rScale(t);
    const ring = Array.from({ length: 33 }, (_, j) => {
      const a = (j * Math.PI * 2) / 32;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
    return [
      Plot.line(ring, { x: "x", y: "y", stroke: "#ccc", strokeOpacity: 0.2 }),
      Plot.text([{ x: 0, y: -r, label: t > 0 ? `+${t}` : t.toString() }], { x: "x", y: "y", text: "label", dy: -5, fontSize: 8, fill: "#888" })
    ];
  });

  const axisMarks = internalPropNames.flatMap((pn, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = outerRadius * Math.cos(angle);
    const y2 = outerRadius * Math.sin(angle);
    return [
      Plot.line([{ x: 0, y: 0 }, { x: x2, y: y2 }], { x: "x", y: "y", stroke: "#ccc", strokeOpacity: 0.3 }),
      Plot.text([{ x: (outerRadius + 25) * Math.cos(angle), y: (outerRadius + 25) * Math.sin(angle), label: `P${i + 1}: ${pn.replace(/_/g, " ")}` }], {
        x: "x", y: "y", text: "label", textAnchor: "middle", fontSize: 10, fontWeight: "bold"
      })
    ];
  });

  return Plot.plot({
    width, height,
    viewBox: `${-width / 2} ${-height / 2} ${width} ${height}`,
    x: { axis: null, domain: [-width / 2, width / 2] },
    y: { axis: null, domain: [-height / 2, height / 2] },
    marks: [
      ...gridMarks,
      ...axisMarks,
      Plot.line(p1, { x: "x", y: "y", stroke: "orange", strokeWidth: 2, fill: "orange", fillOpacity: 0.1, curve: "linear-closed" }),
      Plot.line(p2, { x: "x", y: "y", stroke: "purple", strokeWidth: 2, fill: "purple", fillOpacity: 0.1, curve: "linear-closed" }),
      Plot.dot([...p1, ...p2], {
        x: "x", y: "y",
        fill: (d: any) => d.aa === aa1 ? "orange" : "purple",
        r: 3,
        tip: true,
        title: (d: any) => `${d.aa}: ${d.prop}\nZ: ${d.val.toFixed(2)}`
      })
    ]
  });
}

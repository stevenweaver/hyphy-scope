import * as Plot from "@observablehq/plot";
import * as _ from "lodash-es";
import { COLORS } from "./fel-utils.js";
const DYN_RANGE_CAP = 10;
export function getFelPlotOptions(hasPasmt) {
    return [
        { label: "Site-level dN/dS estimates", available: (d) => !!d["confidence interval"] },
        { label: "alpha/beta site-level estimates", available: () => true },
        { label: "Bootstrap vs asymptotic p-value", available: () => hasPasmt },
        { label: "Rate density plots", available: () => true },
        { label: "Q-Q plots", available: () => hasPasmt },
        { label: "Dense rate plot", available: () => true }
    ];
}
export function getFelPlotDescription(plotType, pvalueThreshold) {
    const descriptions = {
        "Site-level dN/dS estimates": "Maximum likelihood estimates of dN/dS at each site, together with estimated profile confidence intervals (if available). dN/dS = 1 (neutrality) is depicted as a horizontal gray line. Boundaries between partitions (if present) are shown as vertical dashed lines.",
        "alpha/beta site-level estimates": `Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site shown as bars. The line shows the estimates under the null model (α=β). Estimates above ${DYN_RANGE_CAP} are censored at this value.`,
        "Dense rate plot": `Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site. Estimates above ${DYN_RANGE_CAP} are censored at this value. p-values are also shown`,
        "Bootstrap vs asymptotic p-value": `Comparison of site-level p-values for non-neutrality using parametric bootstrap and the asymptotic approximation. Rejection region (p ≤ ${pvalueThreshold}) is shown as a shaded rectangle`,
        "Rate density plots": `Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above ${DYN_RANGE_CAP} are censored at this value.`,
        "Q-Q plots": "Comparison of asymptotic vs bootstrap LRT distributions (limited to 60 sites)."
    };
    return descriptions[plotType] || "";
}
/**
 * Creates an Observable Plot for dN/dS estimates with confidence intervals
 */
export function createDnDsPlot(data) {
    // Cap values at DYN_RANGE_CAP
    const processedData = data.map(d => ({
        ...d,
        "dN/dS MLE": Math.min(d["dN/dS MLE"] || 0, DYN_RANGE_CAP),
        "dN/dS LB": Math.min(d["dN/dS LB"] || 0, DYN_RANGE_CAP),
        "dN/dS UB": Math.min(d["dN/dS UB"] || 0, DYN_RANGE_CAP)
    }));
    return Plot.plot({
        width: 800,
        height: 400,
        marginBottom: 40,
        x: {
            label: "Codon",
            tickFormat: d => d.toString()
        },
        y: {
            label: "dN/dS",
            grid: true,
            type: "sqrt"
        },
        color: {
            type: "categorical",
            domain: Object.keys(COLORS),
            range: Object.values(COLORS),
            legend: true
        },
        marks: [
            // Neutral line at y=1
            Plot.ruleY([1], { stroke: "gray", strokeOpacity: 0.5, strokeWidth: 2 }),
            // Confidence intervals (if available)
            ...(data[0]?.["dN/dS LB"] !== undefined ? [
                Plot.link(processedData, {
                    x: "codon",
                    y1: "dN/dS LB",
                    y2: "dN/dS UB",
                    stroke: "steelblue",
                    strokeWidth: 1
                })
            ] : []),
            // Point estimates
            Plot.dot(processedData, {
                x: "codon",
                y: "dN/dS MLE",
                fill: "class",
                r: 4,
                tip: true
            })
        ]
    });
}
/**
 * Creates an Observable Plot for alpha/beta rate estimates matching the original FEL visualization
 */
export function createAlphaBetaPlot(data) {
    // Process data and cap values
    const processedData = data.map(d => ({
        codon: d.codon,
        alpha: -Math.min(d.alpha, DYN_RANGE_CAP), // Negative for downward bars
        beta: Math.min(d.beta, DYN_RANGE_CAP), // Positive for upward bars
        neutral: Math.min(d["alpha=beta"], DYN_RANGE_CAP),
        class: d.class,
        partition: d.partition
    }));
    const yMax = Math.max(...processedData.map(d => Math.max(Math.abs(d.alpha), d.beta)));
    return Plot.plot({
        width: 800,
        height: 400,
        marginLeft: 60,
        marginBottom: 50,
        x: {
            label: "Codon",
            tickFormat: d => d.toString()
        },
        y: {
            label: "Rate estimate",
            domain: [-yMax * 1.1, yMax * 1.1],
            grid: true,
            tickFormat: d => {
                const absVal = Math.abs(d);
                if (d > 0)
                    return `β = ${absVal.toFixed(1)}`;
                if (d < 0)
                    return `α = ${absVal.toFixed(1)}`;
                return "0";
            }
        },
        color: {
            type: "categorical",
            domain: Object.keys(COLORS),
            range: Object.values(COLORS)
        },
        marks: [
            // Zero reference line
            Plot.ruleY([0], {
                stroke: "gray",
                strokeOpacity: 0.5,
                strokeWidth: 1
            }),
            // Alpha bars (negative, extending downward)
            Plot.rect(processedData, {
                x: d => d.codon - 0.4,
                x2: d => d.codon + 0.4,
                y: 0,
                y2: "alpha",
                fill: "class",
                stroke: "white",
                strokeWidth: 0.5,
                fillOpacity: 0.8
            }),
            // Beta bars (positive, extending upward) 
            Plot.rect(processedData, {
                x: d => d.codon - 0.4,
                x2: d => d.codon + 0.4,
                y: 0,
                y2: "beta",
                fill: "class",
                stroke: "white",
                strokeWidth: 0.5,
                fillOpacity: 0.8
            }),
            // Neutral rate horizontal lines (connecting alpha=beta estimates)
            Plot.link(processedData, {
                x: d => d.codon - 0.4,
                x2: d => d.codon + 0.4,
                y: "neutral",
                y2: "neutral",
                stroke: "#333",
                strokeWidth: 2,
                strokeOpacity: 0.8
            }),
            // Add tooltips with invisible rects
            Plot.rect(processedData, {
                x: d => d.codon - 0.4,
                x2: d => d.codon + 0.4,
                y: "alpha",
                y2: "beta",
                fill: "transparent",
                title: d => `Codon ${d.codon}\nα = ${Math.abs(d.alpha).toFixed(3)}\nβ = ${d.beta.toFixed(3)}\nα=β = ${d.neutral.toFixed(3)}\nClass: ${d.class}`
            })
        ]
    });
}
/**
 * Creates an Observable Plot for p-value comparison
 */
export function createPValuePlot(data, pvalueThreshold) {
    const processedData = data.map(d => ({
        ...d,
        agree: ((d["p-value"] - pvalueThreshold) * ((d["p-asmp"] || 0) - pvalueThreshold) >= 0) ? "Yes" : "No"
    }));
    return Plot.plot({
        width: 500,
        height: 500,
        x: {
            label: "Bootstrap p-value",
            type: "sqrt",
            grid: true
        },
        y: {
            label: "Asymptotic p-value",
            type: "sqrt",
            grid: true
        },
        color: {
            type: "categorical",
            domain: Object.keys(COLORS),
            range: Object.values(COLORS),
            legend: true
        },
        marks: [
            // Rejection region
            Plot.rect([{ x1: 0, y1: 0, x2: pvalueThreshold, y2: pvalueThreshold }], {
                x1: "x1",
                y1: "y1",
                x2: "x2",
                y2: "y2",
                fill: "#DDD",
                fillOpacity: 0.3
            }),
            // Points
            Plot.dot(processedData, {
                x: "p-value",
                y: "p-asmp",
                fill: "class",
                symbol: d => d.agree === "Yes" ? "circle" : "cross",
                r: 5,
                fillOpacity: 0.7,
                tip: true
            })
        ]
    });
}
/**
 * Creates a rate density plot
 */
export function createRateDensityPlot(data) {
    const alphaValues = data.map(d => Math.min(d.alpha, DYN_RANGE_CAP));
    const betaValues = data.map(d => Math.min(d.beta, DYN_RANGE_CAP));
    const alphaMean = _.mean(alphaValues);
    const betaMean = _.mean(betaValues);
    return Plot.plot({
        width: 600,
        height: 400,
        x: {
            label: "Rate value",
            grid: true
        },
        y: {
            label: "Density",
            grid: true
        },
        marks: [
            // Alpha density
            Plot.areaY(alphaValues, Plot.binX({ y: "count" }, { x: d => d }), { fill: "steelblue", fillOpacity: 0.3, curve: "basis" }),
            Plot.lineY(alphaValues, Plot.binX({ y: "count" }, { x: d => d }), { stroke: "steelblue", strokeWidth: 2, curve: "basis" }),
            // Beta density
            Plot.areaY(betaValues, Plot.binX({ y: "count" }, { x: d => d }), { fill: "orange", fillOpacity: 0.3, curve: "basis" }),
            Plot.lineY(betaValues, Plot.binX({ y: "count" }, { x: d => d }), { stroke: "orange", strokeWidth: 2, curve: "basis" }),
            // Mean lines
            Plot.ruleX([alphaMean], { stroke: "steelblue", strokeWidth: 2, strokeDasharray: "4,2" }),
            Plot.ruleX([betaMean], { stroke: "orange", strokeWidth: 2, strokeDasharray: "4,2" }),
            // Labels
            Plot.text([{ x: alphaMean, y: 0, text: `α mean: ${alphaMean.toFixed(2)}` }], {
                x: "x",
                y: "y",
                text: "text",
                dy: -10,
                fill: "steelblue",
                fontSize: 12
            }),
            Plot.text([{ x: betaMean, y: 0, text: `β mean: ${betaMean.toFixed(2)}` }], {
                x: "x",
                y: "y",
                text: "text",
                dy: -25,
                fill: "orange",
                fontSize: 12
            })
        ]
    });
}
/**
 * Main function to create the appropriate plot based on type
 */
export function createFelPlot(plotType, data, pvalueThreshold) {
    switch (plotType) {
        case "Site-level dN/dS estimates":
            return createDnDsPlot(data);
        case "alpha/beta site-level estimates":
            return createAlphaBetaPlot(data);
        case "Bootstrap vs asymptotic p-value":
            return createPValuePlot(data, pvalueThreshold);
        case "Rate density plots":
            return createRateDensityPlot(data);
        default:
            return null;
    }
}

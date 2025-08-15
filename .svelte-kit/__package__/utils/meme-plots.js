import * as Plot from "@observablehq/plot";
import * as _ from "lodash-es";
import { MEME_COLORS } from "./meme-utils.js";
const DYN_RANGE_CAP = 10000;
export function getMemePlotOptions(hasSiteLRT, hasResamples, bsPositiveSelection) {
    return [
        { label: "p-values for selection", available: () => true },
        { label: "p-values for variability", available: () => hasSiteLRT },
        { label: "Site rates", available: () => true },
        { label: "Support for positive selection", available: () => bsPositiveSelection.length > 0 },
        { label: "Dense rate plot", available: () => true },
        { label: "Rate density plots", available: () => true },
        { label: "Q-Q plots", available: () => hasResamples > 0 }
    ];
}
export function getMemePlotDescription(plotType, hasResamples) {
    const descriptions = {
        "p-values for selection": `P-values derived from the ${hasResamples ? "parametric bootstrap" : "asymptotic mixture χ²"} test statistic for likelihood ratio tests for episodic diversifying selection. Solid line = user selected significance threshold.`,
        "p-values for variability": "P-values derived from the asymptotic mixture χ²₂ test statistic for likelihood ratio tests for variable ω at this site. Solid line = user selected significance threshold.",
        "Site rates": `Site-level rate maximum likelihood estimates (MLE). For each site, the horizontal tick depicts the synonymous rate (α) MLE. Circles show non-synonymous (β- and β+) MLEs, and the size of a circle reflects the weight parameter inferred for the corresponding rate. The non-synonymous rate estimates are connected by a vertical line to enhance readability and show the range of inferred non-synonymous rates and their relationship to the synonymous rate. Estimates above ${DYN_RANGE_CAP} are censored at this value.`,
        "Dense rate plot": `Maximum likelihood estimates of synonymous (α), non-synonymous rates (β-, β+), and non-synonymous weights (p-,p+) at each site. Estimates above ${DYN_RANGE_CAP} are censored at this value. p-values for episodic diversifying selection are also shown`,
        "Rate density plots": `Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above ${DYN_RANGE_CAP} are censored at this value.`,
        "Support for positive selection": "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches are included).",
        "Q-Q plots": "Comparison of asymptotic vs bootstrap LRT distributions (limited to 60 sites)."
    };
    return descriptions[plotType] || "";
}
/**
 * Creates a scatter plot for p-values
 */
export function createMemePValuePlot(data, pvalueThreshold) {
    return Plot.plot({
        width: 800,
        height: 300,
        marginBottom: 40,
        x: {
            label: "Codon position",
            grid: true
        },
        y: {
            label: "p-value",
            type: "log",
            grid: true
        },
        color: {
            type: "categorical",
            domain: Object.keys(MEME_COLORS),
            range: Object.values(MEME_COLORS),
            legend: true
        },
        marks: [
            // Significance threshold line
            Plot.ruleY([pvalueThreshold], {
                stroke: "black",
                strokeWidth: 2,
                strokeDasharray: "4,2"
            }),
            // P-value points
            Plot.dot(data, {
                x: "Codon",
                y: "p-value",
                fill: "class",
                r: 3,
                tip: true
            })
        ]
    });
}
/**
 * Creates a site rates plot showing α, β-, and β+ rates
 */
export function createMemeSiteRatesPlot(data) {
    // Prepare data for the complex site rates visualization
    const processedData = data.flatMap(d => {
        const alpha = Math.min(d.alpha, DYN_RANGE_CAP);
        const betaMinus = Math.min(d["beta-"], DYN_RANGE_CAP);
        const betaPlus = Math.min(d["beta+"], DYN_RANGE_CAP);
        return [
            {
                codon: d.Codon,
                rate: alpha,
                type: "alpha",
                weight: 1,
                class: d.class
            },
            {
                codon: d.Codon,
                rate: betaMinus,
                type: "beta-",
                weight: d["p-"],
                class: d.class
            },
            {
                codon: d.Codon,
                rate: betaPlus,
                type: "beta+",
                weight: d["p+"],
                class: d.class
            }
        ];
    });
    return Plot.plot({
        width: 800,
        height: 400,
        marginBottom: 40,
        x: {
            label: "Codon position",
            grid: true
        },
        y: {
            label: "Rate estimate",
            type: "sqrt",
            grid: true
        },
        color: {
            type: "categorical",
            domain: Object.keys(MEME_COLORS),
            range: Object.values(MEME_COLORS),
            legend: true
        },
        marks: [
            // Alpha rates as horizontal ticks
            Plot.tickX(processedData.filter(d => d.type === "alpha"), {
                x: "codon",
                y: "rate",
                stroke: "class",
                strokeWidth: 2
            }),
            // Beta rates as circles sized by weight
            Plot.dot(processedData.filter(d => d.type.startsWith("beta")), {
                x: "codon",
                y: "rate",
                fill: "class",
                r: d => Math.sqrt(d.weight) * 8,
                fillOpacity: 0.7,
                tip: true
            }),
            // Connect beta- and beta+ with lines
            Plot.link(data.map(d => ({
                codon: d.Codon,
                y1: Math.min(d["beta-"], DYN_RANGE_CAP),
                y2: Math.min(d["beta+"], DYN_RANGE_CAP),
                class: d.class
            })), {
                x: "codon",
                y1: "y1",
                y2: "y2",
                stroke: "class",
                strokeWidth: 1,
                strokeOpacity: 0.5
            })
        ]
    });
}
/**
 * Creates a dense rate plot with multiple rate components
 */
export function createMemeDenseRatePlot(data) {
    // Create stacked data for the dense plot
    const stackedData = data.flatMap(d => [
        { codon: d.Codon, rate: Math.min(d.alpha, DYN_RANGE_CAP), type: "α", class: d.class, pvalue: d["p-value"] },
        { codon: d.Codon, rate: Math.min(d["beta-"], DYN_RANGE_CAP), type: "β-", class: d.class, pvalue: d["p-value"] },
        { codon: d.Codon, rate: Math.min(d["beta+"], DYN_RANGE_CAP), type: "β+", class: d.class, pvalue: d["p-value"] }
    ]);
    return Plot.plot({
        width: 800,
        height: 500,
        facet: {
            data: stackedData,
            y: "type",
            marginRight: 80
        },
        x: {
            label: "Codon position"
        },
        y: {
            label: "Rate estimate",
            grid: true
        },
        color: {
            type: "categorical",
            domain: Object.keys(MEME_COLORS),
            range: Object.values(MEME_COLORS),
            legend: true
        },
        marks: [
            Plot.barY(stackedData, {
                x: "codon",
                y: "rate",
                fill: "class",
                fillOpacity: 0.7,
                tip: true
            })
        ]
    });
}
/**
 * Creates rate density plots
 */
export function createMemeRateDensityPlot(data) {
    const alphaValues = data.map(d => Math.min(d.alpha, DYN_RANGE_CAP));
    const betaMinusValues = data.map(d => Math.min(d["beta-"], DYN_RANGE_CAP));
    const betaPlusValues = data.map(d => Math.min(d["beta+"], DYN_RANGE_CAP));
    const alphaMean = _.mean(alphaValues);
    const betaMinusMean = _.mean(betaMinusValues);
    const betaPlusMean = _.mean(betaPlusValues);
    // Combine all values for density estimation
    const densityData = [
        ...alphaValues.map(v => ({ value: v, type: "α" })),
        ...betaMinusValues.map(v => ({ value: v, type: "β-" })),
        ...betaPlusValues.map(v => ({ value: v, type: "β+" }))
    ];
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
        color: {
            domain: ["α", "β-", "β+"],
            range: ["steelblue", "orange", "red"]
        },
        marks: [
            // Density curves
            Plot.areaY(densityData, Plot.binX({ y: "count" }, {
                x: "value",
                fill: "type",
                fillOpacity: 0.3,
                curve: "basis"
            })),
            // Mean lines
            Plot.ruleX([alphaMean], { stroke: "steelblue", strokeWidth: 2, strokeDasharray: "4,2" }),
            Plot.ruleX([betaMinusMean], { stroke: "orange", strokeWidth: 2, strokeDasharray: "4,2" }),
            Plot.ruleX([betaPlusMean], { stroke: "red", strokeWidth: 2, strokeDasharray: "4,2" }),
            // Mean labels
            Plot.text([
                { x: alphaMean, y: 0, text: `α: ${alphaMean.toFixed(2)}`, type: "α" },
                { x: betaMinusMean, y: 0, text: `β-: ${betaMinusMean.toFixed(2)}`, type: "β-" },
                { x: betaPlusMean, y: 0, text: `β+: ${betaPlusMean.toFixed(2)}`, type: "β+" }
            ], {
                x: "x",
                y: "y",
                text: "text",
                fill: d => d.type === "α" ? "steelblue" : d.type === "β-" ? "orange" : "red",
                dy: -10,
                fontSize: 12
            })
        ]
    });
}
/**
 * Creates support for positive selection plot (Bayes factors)
 */
export function createMemeSupportPlot(bsData) {
    if (!bsData || bsData.length === 0) {
        return null;
    }
    return Plot.plot({
        width: 800,
        height: 400,
        x: {
            label: "Codon position",
            grid: true
        },
        y: {
            label: "Empirical Bayes Factor",
            type: "log",
            grid: true
        },
        marks: [
            Plot.dot(bsData, {
                x: "Codon",
                y: "ER",
                fill: "Branch",
                r: 3,
                fillOpacity: 0.7,
                tip: true
            }),
            // Reference line at ER = 1
            Plot.ruleY([1], { stroke: "black", strokeDasharray: "2,2" })
        ]
    });
}
/**
 * Main function to create the appropriate plot based on type
 */
export function createMemePlot(plotType, data, pvalueThreshold, bsData) {
    switch (plotType) {
        case "p-values for selection":
            return createMemePValuePlot(data, pvalueThreshold);
        case "Site rates":
            return createMemeSiteRatesPlot(data);
        case "Dense rate plot":
            return createMemeDenseRatePlot(data);
        case "Rate density plots":
            return createMemeRateDensityPlot(data);
        case "Support for positive selection":
            return createMemeSupportPlot(bsData || []);
        default:
            return null;
    }
}

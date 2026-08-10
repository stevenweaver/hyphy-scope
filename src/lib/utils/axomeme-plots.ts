/**
 * axomeme-plots.ts — Observable Plot specs for AxoMEME results.
 *
 * ONE RULE GOVERNS ALL OF THESE: no threshold line. Every other per-site plot in this library draws a
 * rule at the significance cutoff, because for a real likelihood ratio test that line means
 * something. AxoMEME's score is not calibrated to that scale — across 12 real DataMonkey submissions
 * and 662 variable sites it reached the p <= 0.10 gate once and the p <= 0.05 gate never, on data
 * where MEME itself reports significant sites. A horizontal rule here would be read as significance
 * and would be wrong. What the model provides is an ORDER, so these plots show position within that
 * order and let the tier colours carry the calling.
 *
 * Invariant sites are excluded upstream by getScoredSites(); their zeros were never predictions.
 */

import * as Plot from '@observablehq/plot';
import {
	AXOMEME_COLORS,
	AXOMEME_NEUTRAL_CALL,
	assignTiers,
	getScoredSites,
	type AxomemeSiteData
} from './axomeme-utils.js';

interface PlotOption {
	label: string;
	available: (sites: AxomemeSiteData[]) => boolean;
}

export function getAxomemePlotOptions(): PlotOption[] {
	return [
		{ label: 'Ranked sites', available: () => true },
		{ label: 'Score by site', available: () => true },
		{ label: 'Rank distribution', available: (s) => getScoredSites(s).length >= 5 },
		{ label: 'Synonymous vs non-synonymous', available: (s) => getScoredSites(s).length > 0 }
	];
}

export function getAxomemePlotDescription(plotType: string): string {
	const d: Record<string, string> = {
		'Ranked sites':
			'Every scored site, ordered by the model’s score. The x-axis is rank within this alignment, not codon position — it shows how sharply the top sites separate from the rest. A long flat tail means the model found little to distinguish.',
		'Score by site':
			'The model’s score along the coding sequence. Position on the y-axis is meaningful only relative to the other sites in this same alignment; the value is not calibrated to MEME’s scale and no significance threshold is drawn, because none would be meaningful.',
		'Rank distribution':
			'How the scores are spread across scored sites. A distribution with a clear right tail is one where the ranking is informative; a narrow one means the top-ranked sites are barely separated from the rest and the ordering carries little signal.',
		'Synonymous vs non-synonymous':
			'Predicted synonymous (dS) against non-synonymous (dN⁺) rate per site. Points above the diagonal have dN⁺ > dS, the pattern associated with positive selection. These are model estimates, not fitted rates.'
	};
	return d[plotType] ?? '';
}

/** Shared legend so tier colours mean the same thing in every plot. */
function tierLegend(sites: AxomemeSiteData[]) {
	const tiers = assignTiers(sites);
	const labels = [...tiers.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
	return {
		domain: [...labels, AXOMEME_NEUTRAL_CALL],
		range: [
			...labels.map((l) =>
				tiers.get(l) === 1 ? AXOMEME_COLORS.tier1 : AXOMEME_COLORS.tier2
			),
			AXOMEME_COLORS.neutral
		]
	};
}

/**
 * Sites ordered by score — the plot that actually matches what the model does.
 *
 * A Manhattan plot along the sequence answers "where are the significant sites"; this answers "how
 * strongly does the ranking separate anything", which is the question a ranker can support.
 */
export function createAxomemeRankPlot(sites: AxomemeSiteData[]): any {
	const scored = getScoredSites(sites);
	const legend = tierLegend(sites);
	const ranked = [...scored]
		.sort((a, b) => b.lrt - a.lrt)
		.map((s, i) => ({ ...s, rank: i + 1 }));

	return Plot.plot({
		width: 800,
		height: 320,
		marginBottom: 44,
		marginLeft: 56,
		x: { label: 'Rank within this alignment →', grid: true },
		y: { label: '↑ Score (uncalibrated)', grid: true, zero: true },
		color: { ...legend, legend: true },
		marks: [
			Plot.ruleY([0], { stroke: '#e2e8f0' }),
			Plot.dot(ranked, {
				x: 'rank',
				y: 'lrt',
				fill: 'call',
				r: 3.2,
				title: (d: any) =>
					`Site ${d.site} (${d.refCodon}/${d.refAa})\nrank ${d.rank} of ${ranked.length}\nscore ${d.lrt.toFixed(3)}\npercentile ${d.percentile.toFixed(1)}\n${d.call}`
			})
		]
	});
}

/**
 * Score along the coding sequence.
 *
 * The familiar per-site view, deliberately WITHOUT a threshold rule. Only scored sites appear, so
 * gaps in the x-axis are invariant columns rather than missing data.
 */
export function createAxomemeSitePlot(sites: AxomemeSiteData[]): any {
	const scored = getScoredSites(sites);
	const legend = tierLegend(sites);

	return Plot.plot({
		width: 800,
		height: 320,
		marginBottom: 44,
		marginLeft: 56,
		x: { label: 'Codon site →', grid: true },
		y: { label: '↑ Score (uncalibrated)', grid: true, zero: true },
		color: { ...legend, legend: true },
		marks: [
			Plot.ruleY([0], { stroke: '#e2e8f0' }),
			Plot.ruleX(scored, {
				x: 'site',
				y1: 0,
				y2: 'lrt',
				stroke: '#e2e8f0',
				strokeWidth: 1
			}),
			Plot.dot(scored, {
				x: 'site',
				y: 'lrt',
				fill: 'call',
				r: 3.2,
				title: (d: any) =>
					`Site ${d.site} (${d.refCodon}/${d.refAa})\nscore ${d.lrt.toFixed(3)}\npercentile ${d.percentile.toFixed(1)}\n${d.call}`
			})
		]
	});
}

/** How spread out the scores are — a narrow distribution means the ranking carries little. */
export function createAxomemeDistributionPlot(sites: AxomemeSiteData[]): any {
	const scored = getScoredSites(sites);
	return Plot.plot({
		width: 800,
		height: 280,
		marginBottom: 44,
		marginLeft: 56,
		x: { label: 'Score (uncalibrated) →', grid: true },
		y: { label: '↑ Sites', grid: true },
		marks: [
			// fill belongs to the MARK, not to the bin transform's inputs — binX only accepts channel
			// definitions, and passing a constant colour through it is a type error.
			Plot.rectY(scored, {
				...Plot.binX({ y: 'count' }, { x: 'lrt' }),
				fill: AXOMEME_COLORS.tier2
			}),
			Plot.ruleY([0])
		]
	});
}

/** dS against dN+, with the neutral diagonal for reference. */
export function createAxomemeRatePlot(sites: AxomemeSiteData[]): any {
	const scored = getScoredSites(sites);
	const legend = tierLegend(sites);
	const max = Math.max(1, ...scored.map((s) => Math.max(s.alphaDs, s.betaPosDn)));

	return Plot.plot({
		width: 800,
		height: 400,
		marginBottom: 44,
		marginLeft: 56,
		x: { label: 'Synonymous rate (dS) →', grid: true, domain: [0, max] },
		y: { label: '↑ Non-synonymous rate (dN⁺)', grid: true, domain: [0, max] },
		color: { ...legend, legend: true },
		marks: [
			// dN = dS. Above it, dN+ exceeds dS — the positive-selection pattern.
			Plot.line(
				[
					{ x: 0, y: 0 },
					{ x: max, y: max }
				],
				{ x: 'x', y: 'y', stroke: '#cbd5e1', strokeDasharray: '4,4' }
			),
			Plot.dot(scored, {
				x: 'alphaDs',
				y: 'betaPosDn',
				fill: 'call',
				r: 3.2,
				title: (d: any) =>
					`Site ${d.site} (${d.refCodon}/${d.refAa})\ndS ${d.alphaDs.toFixed(3)}\ndN⁺ ${d.betaPosDn.toFixed(3)}\n${d.call}`
			})
		]
	});
}

/** Dispatch by plot label. */
export function createAxomemePlot(plotType: string, sites: AxomemeSiteData[]): any {
	switch (plotType) {
		case 'Score by site':
			return createAxomemeSitePlot(sites);
		case 'Rank distribution':
			return createAxomemeDistributionPlot(sites);
		case 'Synonymous vs non-synonymous':
			return createAxomemeRatePlot(sites);
		case 'Ranked sites':
		default:
			return createAxomemeRankPlot(sites);
	}
}

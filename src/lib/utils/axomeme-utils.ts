/**
 * axomeme-utils.ts — data shaping for AxoMEME results.
 *
 * AxoMEME is not a HyPhy analysis. It is a neural surrogate that RANKS the sites of an alignment by
 * how MEME-like their selection signal looks, and it emits per-site predictions rather than a HyPhy
 * results document. Two consequences run through everything here:
 *
 *   1. THE SCORE IS NOT CALIBRATED. Measured across 12 real DataMonkey submissions and 662 variable
 *      sites, the model's predicted LRT reached the chi-square gate for p <= 0.10 exactly once, and
 *      never reached the one for p <= 0.05 — including on an alignment where MEME itself reports 17
 *      significant sites. The model's authors report Spearman rank correlation, not calibration. So
 *      these plots present RANK and never draw a significance threshold line: there is no threshold
 *      on this scale that means what a reader would assume it means.
 *   2. INVARIANT SITES ARE NOT SCORED. A site with no amino-acid variation is zeroed before the model
 *      is consulted, so its zero means "not applicable" rather than "no selection". Those sites are
 *      excluded from every plot and every statistic; including them would pull the whole distribution
 *      toward zero and make the ranking meaningless.
 */

/** One row of AxoMEME's per-site output. */
export interface AxomemeSiteData {
	/** 1-indexed codon site. */
	site: number;
	/** Reference sequence's codon at this site. */
	refCodon: string;
	/** Its translation, or '?' where the codon is gapped or ambiguous. */
	refAa: string;
	/** False when no amino-acid variation exists — the site is not scored at all. */
	isVariable: boolean;
	/** The model's score. Named for what it predicts, but NOT on MEME's calibrated scale. */
	lrt: number;
	/** log1p(lrt). Derived, not a separate prediction. */
	logLrt: number;
	/** Synonymous rate estimate. */
	alphaDs: number;
	/** Non-synonymous rate estimate for the positive class. */
	betaPosDn: number;
	/** Probability of the positive-selection class. */
	pPos: number;
	/** Score relative to this alignment's variable sites. */
	zScore: number;
	/** Percentile rank within this alignment's variable sites. */
	percentile: number;
	/** The tier label, phrased as the rule that produced it (e.g. "Top 2%"). */
	call: string;
}

/** The result object AxoMEME produces. */
export interface AxomemeResult {
	method?: string;
	modelVersion?: string;
	modelSha256?: string;
	isSurrogate?: boolean;
	surrogateFor?: string;
	sites: AxomemeSiteData[];
	summary?: Record<string, any>;
}

/**
 * Colours for the three tiers.
 *
 * Deliberately NOT the red/green of a significance test. These encode rank position, and a palette
 * borrowed from p-value plots would imply the calibration the model does not have. Ordered so that
 * higher rank reads as warmer without either extreme looking like a verdict.
 */
export const AXOMEME_COLORS = {
	tier1: '#b45309',
	tier2: '#d97706',
	neutral: '#94a3b8',
	unscored: '#e2e8f0'
} as const;

export const AXOMEME_NEUTRAL_CALL = 'Neutral';

/**
 * Normalise a call label to a tier number: 1 (strictest), 2, or 0 for neutral.
 *
 * Labels are not fixed strings. AxoMEME names each tier after the rule that produced it, so the same
 * result can be labelled "Top 2%", "Z >= 2.5" or "LRT >= 4.45" depending on the calling mode the user
 * chose. Matching literal text would break the moment a threshold is adjusted.
 *
 * Instead the distinct non-neutral labels are ordered by the LOWEST score they contain: the stricter
 * tier necessarily has a higher floor, whichever rule produced it. That holds for all three modes and
 * needs no knowledge of which one ran.
 */
export function assignTiers(sites: AxomemeSiteData[]): Map<string, number> {
	const floors = new Map<string, number>();
	for (const s of sites) {
		if (!s.isVariable || s.call === AXOMEME_NEUTRAL_CALL) continue;
		const prev = floors.get(s.call);
		if (prev === undefined || s.lrt < prev) floors.set(s.call, s.lrt);
	}
	const ordered = [...floors.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
	const tiers = new Map<string, number>();
	ordered.forEach((label, i) => tiers.set(label, i + 1));
	return tiers;
}

/** Colour for a row, by tier rather than by label text. */
export function getAxomemeColor(site: AxomemeSiteData, tiers: Map<string, number>): string {
	if (!site.isVariable) return AXOMEME_COLORS.unscored;
	const tier = tiers.get(site.call);
	if (tier === 1) return AXOMEME_COLORS.tier1;
	if (tier === 2) return AXOMEME_COLORS.tier2;
	return AXOMEME_COLORS.neutral;
}

/**
 * Sites that the model actually scored.
 *
 * Every plot and every summary statistic uses this rather than the full list. An invariant site
 * carries a hard zero that was never a prediction, and mixing those into a rank distribution makes
 * the ranking mean something else.
 */
export function getScoredSites(sites: AxomemeSiteData[]): AxomemeSiteData[] {
	return (sites ?? []).filter((s) => s.isVariable);
}

export interface AxomemeAttributes {
	totalSites: number;
	scoredSites: number;
	calledSites: number;
	tierCounts: Record<string, number>;
	maxScore: number;
	medianScore: number;
	callMode: string | null;
	modelVersion: string | null;
	referenceSequence: string | null;
}

/** Headline numbers for the summary strip. */
export function getAxomemeAttributes(result: AxomemeResult | null): AxomemeAttributes {
	const sites = result?.sites ?? [];
	const scored = getScoredSites(sites);
	const called = scored.filter((s) => s.call !== AXOMEME_NEUTRAL_CALL);
	const tierCounts: Record<string, number> = {};
	for (const s of called) tierCounts[s.call] = (tierCounts[s.call] ?? 0) + 1;

	const values = scored.map((s) => s.lrt).sort((a, b) => a - b);
	const median = values.length
		? values.length % 2
			? values[(values.length - 1) / 2]
			: (values[values.length / 2 - 1] + values[values.length / 2]) / 2
		: 0;

	return {
		totalSites: sites.length,
		scoredSites: scored.length,
		calledSites: called.length,
		tierCounts,
		maxScore: values.length ? values[values.length - 1] : 0,
		medianScore: median,
		callMode: result?.summary?.callMode ?? null,
		modelVersion: result?.modelVersion ?? null,
		referenceSequence: result?.summary?.referenceSequence ?? null
	};
}

/** Table rows, sorted by the requested column. */
export function sortAxomemeSites(
	sites: AxomemeSiteData[],
	column: keyof AxomemeSiteData,
	direction: 'asc' | 'desc'
): AxomemeSiteData[] {
	const sign = direction === 'asc' ? 1 : -1;
	return [...sites].sort((a, b) => {
		const av = a[column];
		const bv = b[column];
		if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
		return String(av).localeCompare(String(bv)) * sign;
	});
}

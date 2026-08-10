<script lang="ts">
	/**
	 * AxomemeVisualization — per-site results from the AxoMEME neural surrogate.
	 *
	 * WHY THIS DIFFERS FROM EVERY OTHER COMPONENT IN THIS LIBRARY. The rest visualise HyPhy analyses,
	 * where a per-site p-value means what it says and a threshold line is the most useful mark on the
	 * chart. AxoMEME is a fitted model that RANKS sites; its score is not calibrated to MEME's scale.
	 * Measured across 12 real DataMonkey submissions and 662 variable sites, the score reached the
	 * chi-square gate for p <= 0.10 exactly once and the p <= 0.05 gate never — on data where MEME
	 * itself reports significant sites.
	 *
	 * So this component deliberately does three things differently:
	 *   - No significance threshold line, and no threshold control. There is no cutoff on this scale
	 *     that means what a reader would assume.
	 *   - Rank is a first-class column, and the default plot orders sites by score rather than by
	 *     position, because that is the question a ranker can answer.
	 *   - Invariant sites are marked "not scored" rather than shown as zero. Their zeros were never
	 *     predictions — they are set before the model is consulted — and rendering them as 0.000
	 *     alongside real zeros conflates "the model said nothing" with "we never asked".
	 */
	import { onMount } from 'svelte';
	import {
		getAxomemeAttributes,
		getScoredSites,
		assignTiers,
		sortAxomemeSites,
		AXOMEME_COLORS,
		AXOMEME_NEUTRAL_CALL,
		type AxomemeResult,
		type AxomemeSiteData
	} from './utils/axomeme-utils.js';
	import {
		getAxomemePlotOptions,
		getAxomemePlotDescription,
		createAxomemePlot
	} from './utils/axomeme-plots.js';

	export let data: AxomemeResult | null = null;
	/**
	 * Mark the results as coming from a model still under development.
	 *
	 * A prop rather than a hard-coded badge: this library should not assert the maturity of somebody
	 * else's model, and the answer changes over time without this component changing at all.
	 */
	export let beta: boolean = false;
	export let plotType: string = 'Ranked sites';
	/** Show only sites the model called, which is what most readers want first. */
	export let onlyCalled: boolean = true;

	let plotContainer: HTMLElement;
	let currentPage = 1;
	let itemsPerPage = 25;
	let sortColumn: keyof AxomemeSiteData = 'lrt';
	let sortDirection: 'asc' | 'desc' = 'desc';

	/**
	 * Reset the table position when the ANALYSIS changes.
	 *
	 * A results pane swaps `data` without remounting this component, so every piece of local state
	 * survives. For a sort column or a plot choice that is correct — they are preferences. For a page
	 * number it is not: it is a position inside one particular dataset, and carrying it across drops
	 * the reader into the middle of a different analysis's table. Measured before this guard existed:
	 * viewing rows 26–50 of one analysis and then opening another showed rows 26–50 of that one.
	 *
	 * Keyed on identity rather than contents. Two analyses can have the same number of sites, so
	 * length is not enough to tell them apart.
	 */
	let lastData: AxomemeResult | null = null;
	$: if (data !== lastData) {
		lastData = data;
		currentPage = 1;
	}

	$: sites = data?.sites ?? [];
	$: attributes = getAxomemeAttributes(data);
	$: tiers = assignTiers(sites);
	$: scored = getScoredSites(sites);
	$: called = scored.filter((s) => s.call !== AXOMEME_NEUTRAL_CALL);
	$: availablePlots = getAxomemePlotOptions().filter((o) => o.available(sites));
	$: plotDescription = getAxomemePlotDescription(plotType);

	// The table shows called sites by default; unticking the box shows EVERY site, including the ones
	// the model never scored. Falling back to `scored` instead would silently drop invariant sites, so
	// a reader scanning site numbers would find gaps with no explanation — and the "not scored" row
	// below would be unreachable code. When nothing was called at all, show everything rather than an
	// empty table, which reads as a failure rather than as a result.
	$: tableSource = onlyCalled && called.length > 0 ? called : sites;
	$: sortedSites = sortAxomemeSites(tableSource, sortColumn, sortDirection);
	$: totalPages = Math.max(1, Math.ceil(sortedSites.length / itemsPerPage));
	$: pageSites = sortedSites.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
	$: if (currentPage > totalPages) currentPage = totalPages;

	function toggleSort(column: keyof AxomemeSiteData) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'desc';
		}
	}

	/**
	 * NOTHING IN HERE MAY AWAIT, and that is not a style preference.
	 *
	 * This runs from a reactive statement, which Svelte 5 compiles to a pre-effect. An earlier version
	 * called `await tick()` first, to be sure the container was bound. `tick()` flushes pending
	 * effects — including the one that called it — which calls this again, which awaits `tick()`
	 * again. The recursion is unbounded and it kills the renderer process before Svelte's own
	 * effect-depth guard can report anything: the tab dies with no console error, no page error, and
	 * no stack. Every other route in this app loaded fine, which is what made it look like a build or
	 * link problem rather than a component one.
	 *
	 * The await bought nothing anyway. `bind:this` is assigned before the effect runs, and the guard
	 * below covers the case where it is not.
	 */
	function renderPlot() {
		if (!plotContainer || scored.length === 0) return;
		plotContainer.innerHTML = '';
		try {
			plotContainer.appendChild(createAxomemePlot(plotType, sites));
		} catch (e) {
			plotContainer.innerHTML = `<p class="axomeme-error">Could not render this plot: ${
				(e as Error).message
			}</p>`;
		}
	}

	$: if (plotContainer && plotType && sites.length) renderPlot();
	onMount(renderPlot);

	const fmt = (v: number, dp = 3) => (Number.isFinite(v) ? v.toFixed(dp) : '—');
	const tierColor = (call: string) =>
		tiers.get(call) === 1
			? AXOMEME_COLORS.tier1
			: tiers.get(call) === 2
				? AXOMEME_COLORS.tier2
				: AXOMEME_COLORS.neutral;
</script>

{#if !data || sites.length === 0}
	<p class="axomeme-empty">No AxoMEME results to display.</p>
{:else}
	<div class="axomeme-visualization">
		<header class="axomeme-header">
			<h3>
				AxoMEME predictions
				{#if beta}
					<span
						class="axomeme-beta"
						title="The underlying model is still under active development; results may change between releases."
						>Beta</span
					>
				{/if}
			</h3>
			<p>
				A neural model ranks the sites of this alignment by how MEME-like their signal looks. MEME
				was not run. The score orders sites <em>within this alignment</em> and is not calibrated to
				MEME's scale — there is no significance threshold on it, which is why none is drawn.
			</p>
		</header>

		<div class="axomeme-summary">
			<div class="axomeme-stat">
				<strong>{attributes.calledSites}</strong>
				<span>top-ranked {attributes.calledSites === 1 ? 'site' : 'sites'}</span>
			</div>
			<div class="axomeme-stat">
				<strong>{attributes.scoredSites}</strong>
				<span>scored {attributes.scoredSites === 1 ? 'site' : 'sites'}</span>
			</div>
			<div class="axomeme-stat">
				<strong>{attributes.totalSites}</strong>
				<span>codon {attributes.totalSites === 1 ? 'site' : 'sites'}</span>
			</div>
			<div class="axomeme-stat">
				<strong>{fmt(attributes.maxScore, 2)}</strong>
				<span>highest score</span>
			</div>
		</div>

		<div class="axomeme-controls">
			<label>
				Plot
				<select bind:value={plotType}>
					{#each availablePlots as option}
						<option value={option.label}>{option.label}</option>
					{/each}
				</select>
			</label>
			<label class="axomeme-check">
				<input type="checkbox" bind:checked={onlyCalled} disabled={called.length === 0} />
				Table shows top-ranked sites only
			</label>
		</div>

		{#if plotDescription}
			<p class="axomeme-plot-description">{plotDescription}</p>
		{/if}
		<div class="axomeme-plot" bind:this={plotContainer}></div>

		<div class="axomeme-table-wrap">
			<table class="axomeme-table">
				<thead>
					<tr>
						<th on:click={() => toggleSort('site')}>Codon site</th>
						<th>Reference</th>
						<th>AA</th>
						<th on:click={() => toggleSort('percentile')} class="num">Percentile</th>
						<th on:click={() => toggleSort('lrt')} class="num">Score</th>
						<th on:click={() => toggleSort('logLrt')} class="num">log(1+score)</th>
						<th on:click={() => toggleSort('betaPosDn')} class="num">dN⁺</th>
						<th on:click={() => toggleSort('alphaDs')} class="num">dS</th>
						<th on:click={() => toggleSort('zScore')} class="num">Z</th>
						<th>Call</th>
					</tr>
				</thead>
				<tbody>
					{#each pageSites as row (row.site)}
						<tr>
							<td class="mono">{row.site}</td>
							<td class="mono">{row.refCodon}</td>
							<td class="mono">{row.refAa}</td>
							{#if row.isVariable}
								<td class="num mono">{row.percentile.toFixed(1)}</td>
								<td class="num mono">{fmt(row.lrt)}</td>
								<td class="num mono">{fmt(row.logLrt)}</td>
								<td class="num mono">{fmt(row.betaPosDn)}</td>
								<td class="num mono">{fmt(row.alphaDs)}</td>
								<td class="num mono">{fmt(row.zScore, 2)}</td>
							{:else}
								<!-- Zeroed before the model was consulted: "not applicable", not "no selection". -->
								<td class="num unscored" colspan="6">not scored — no amino-acid variation</td>
							{/if}
							<td>
								<span class="axomeme-call" style="background:{tierColor(row.call)}22; color:{tierColor(row.call)}">
									{row.call}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="axomeme-pagination">
			<button on:click={() => (currentPage = Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
				Prev
			</button>
			<span>
				{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, sortedSites.length)}
				of {sortedSites.length}
			</span>
			<button
				on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
			>
				Next
			</button>
		</div>

		<footer class="axomeme-footer">
			{#if attributes.modelVersion}AxoMEME {attributes.modelVersion}{/if}
			{#if attributes.callMode} · ranked by {attributes.callMode}{/if}
			{#if attributes.referenceSequence} · reference <span class="mono">{attributes.referenceSequence}</span>{/if}
		</footer>
	</div>
{/if}

<style>
	.axomeme-visualization {
		font-family:
			ui-sans-serif,
			system-ui,
			sans-serif;
		color: #0f172a;
	}
	.axomeme-empty {
		color: #64748b;
		font-style: italic;
	}
	.axomeme-beta {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
		margin-left: 0.5rem;
		padding: 2px 8px;
		background: #ede9fe;
		border: 1px solid #8b5cf6;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 500;
		color: #5b21b6;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.axomeme-header h3 {
		margin: 0 0 0.25rem;
		font-size: 1.125rem;
		font-weight: 700;
	}
	.axomeme-header p {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #475569;
		max-width: 70ch;
	}
	.axomeme-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.axomeme-stat {
		background: #f8fafc;
		border-radius: 0.375rem;
		padding: 0.625rem 0.75rem;
	}
	.axomeme-stat strong {
		display: block;
		font-size: 1.5rem;
		line-height: 1.1;
	}
	.axomeme-stat span {
		font-size: 0.75rem;
		color: #64748b;
	}
	.axomeme-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}
	.axomeme-controls select {
		margin-left: 0.375rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.25rem;
	}
	.axomeme-check {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.axomeme-plot-description {
		font-size: 0.8125rem;
		color: #475569;
		line-height: 1.5;
		max-width: 80ch;
		margin: 0 0 0.5rem;
	}
	.axomeme-plot {
		overflow-x: auto;
		margin-bottom: 1rem;
	}
	.axomeme-table-wrap {
		overflow-x: auto;
	}
	.axomeme-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}
	.axomeme-table th {
		text-align: left;
		padding: 0.5rem;
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #64748b;
		cursor: pointer;
		white-space: nowrap;
	}
	.axomeme-table td {
		padding: 0.3rem 0.5rem;
		border-bottom: 1px solid #f1f5f9;
	}
	.axomeme-table .num {
		text-align: right;
	}
	.mono {
		font-family: ui-monospace, monospace;
	}
	.unscored {
		color: #94a3b8;
		font-family: inherit;
	}
	.axomeme-call {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		white-space: nowrap;
	}
	.axomeme-pagination {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
		font-size: 0.8125rem;
		color: #475569;
	}
	.axomeme-pagination button {
		padding: 0.25rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.25rem;
		background: white;
		cursor: pointer;
	}
	.axomeme-pagination button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.axomeme-footer {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e2e8f0;
		font-size: 0.75rem;
		color: #64748b;
	}
</style>

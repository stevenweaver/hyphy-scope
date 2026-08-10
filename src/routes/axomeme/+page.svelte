<script lang="ts">
	/**
	 * Development page for AxomemeVisualization.
	 *
	 * Matches the other per-method routes in this app: synthetic data, every plot reachable, no
	 * network. It exists because the component's failure modes are browser-only — Observable Plot
	 * renders nothing meaningful under jsdom, so a component test can pass while the real thing
	 * misbehaves in a way only a browser shows.
	 */
	import { AxomemeVisualization } from '$lib/index.js';

	/** Deterministic synthetic sites: no random, so a visual regression is a real change. */
	function makeSites(n: number) {
		const sites = [];
		for (let i = 1; i <= n; i++) {
			// Every fifth site is invariant, which is roughly the real proportion and exercises the
			// "not scored" row.
			const isVariable = i % 5 !== 0;
			const score = isVariable ? ((i * 37) % 100) / 33 : 0;
			const pct = isVariable ? ((i * 37) % 100) : 0;
			sites.push({
				site: i,
				refCodon: ['ATG', 'TTA', 'GGC', 'AAA', 'TCA'][i % 5],
				refAa: ['M', 'L', 'G', 'K', 'S'][i % 5],
				isVariable,
				lrt: score,
				logLrt: Math.log1p(score),
				alphaDs: isVariable ? ((i * 13) % 50) / 25 : 0,
				betaPosDn: isVariable ? ((i * 7) % 60) / 20 : 0,
				pPos: isVariable ? 0.5 + ((i * 11) % 50) / 100 : 0,
				zScore: isVariable ? (score - 1.5) / 0.8 : 0,
				percentile: pct,
				call: !isVariable ? 'Neutral' : pct >= 98 ? 'Top 2%' : pct >= 95 ? 'Top 5%' : 'Neutral'
			});
		}
		return sites;
	}

	let siteCount = 200;
	$: data = {
		method: 'AxoMEME',
		modelVersion: '2.0-viral-finetuned',
		isSurrogate: true,
		surrogateFor: 'MEME',
		sites: makeSites(siteCount),
		summary: { callMode: 'percentile', referenceSequence: 'synthetic_ref' }
	};
</script>

<svelte:head><title>AxoMEME — hyphy-scope</title></svelte:head>

<main>
	<h1>AxoMEME visualization</h1>
	<label>
		Sites
		<input type="range" min="10" max="2000" step="10" bind:value={siteCount} />
		{siteCount}
	</label>
	<hr />
	<AxomemeVisualization {data} />
</main>

<style>
	main {
		max-width: 900px;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: ui-sans-serif, system-ui, sans-serif;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}
	hr {
		border: none;
		border-top: 1px solid #e2e8f0;
		margin: 1rem 0 1.5rem;
	}
</style>

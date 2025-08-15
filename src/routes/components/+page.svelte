<script>
	import { onMount } from 'svelte';
	import { HelloWorld, FelVisualization, MemeVisualization } from '$lib';
	import { getTestData } from '$lib/data/data-loader';

	let memeTestData = null;
	let felTestData = null;

	onMount(async () => {
		memeTestData = await getTestData('meme');
		felTestData = await getTestData('fel');
	});
	
	// Demo data for FEL component
	const felDemoData = {
		MLE: {
			headers: [
				["alpha", "Synonymous substitution rate at a site"],
				["beta", "Non-synonymous substitution rate at a site"],
				["alpha=beta", "Synonymous substitution rate at a site"],
				["dN/dS MLE", "Maximum likelihood estimate of dN/dS"],
				["p-value", "Asymptotic p-value for non-neutrality"]
			],
			content: {
				"0": [
					[0.1, 0.2, 0.15, 2.0, 0.05],
					[0.3, 0.1, 0.2, 0.33, 0.15],
					[0.2, 0.2, 0.2, 1.0, 0.8]
				]
			}
		},
		"data partitions": {
			"0": {
				coverage: [[0, 1, 2]]
			}
		},
		"confidence interval": false,
		simulated: null,
		analysis: {
			citation: "Kosakovsky Pond SL and Frost SDW (2005). Not so different after all: a comparison of methods for detecting amino acid sites under selection. Mol Biol Evol. 22(5): 1208-22."
		}
	};
</script>

<svelte:head>
	<title>Components - HyPhy Scope</title>
</svelte:head>

<section>
	<h1>Component Gallery</h1>
	<p>Explore all available components in the HyPhy Scope library.</p>

	<div class="component-showcase">
		<div class="component-item">
			<h2>HelloWorld</h2>
			<p>A simple greeting component for demonstration purposes.</p>
			
			<div class="demo-area">
				<HelloWorld />
				<HelloWorld name="Scientists" />
				<HelloWorld name="Researchers" />
			</div>

			<details>
				<summary>Code Example</summary>
				<pre><code>&lt;script&gt;
	import &#123; HelloWorld &#125; from 'hyphy-scope';
&lt;/script&gt;

&lt;HelloWorld /&gt;
&lt;HelloWorld name="Scientists" /&gt;</code></pre>
			</details>
		</div>

		<div class="component-item">
			<h2>FelVisualization</h2>
			<p>Interactive visualization for Fixed Effects Likelihood (FEL) analysis results from HyPhy.</p>
			
			<div class="demo-area">
				<div class="fel-preview">
					{#if felTestData}
						<FelVisualization data={felTestData} />
					{:else}
						<p>Loading FEL demo...</p>
					{/if}
				</div>
			</div>

			<details>
				<summary>Code Example</summary>
				<pre><code>{@html `&lt;script&gt;
	import { FelVisualization, loadDataFromUrl } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadDataFromUrl(params.json) ||
		       loadDataFromStorage(params.id) ||
		       defaultData;
	});
&lt;/script&gt;

&lt;FelVisualization {data} /&gt;`}</code></pre>
			</details>
			
			<p><a href="/fel">→ View full FEL demo</a></p>
		</div>

		<div class="component-item">
			<h2>MemeVisualization</h2>
			<p>Interactive visualization for Mixed Effects Model of Evolution (MEME) analysis results from HyPhy.</p>
			
			<div class="demo-area">
				<div class="meme-preview">
					{#if memeTestData}
						<MemeVisualization data={memeTestData} />
					{:else}
						<p>Loading MEME demo...</p>
					{/if}
				</div>
			</div>

			<details>
				<summary>Code Example</summary>
				<pre><code>{@html `&lt;script&gt;
	import { MemeVisualization } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadMemeData();
	});
&lt;/script&gt;

&lt;MemeVisualization {data} /&gt;`}</code></pre>
			</details>
			
			<p><a href="/meme">→ View full MEME demo</a></p>
		</div>

		<div class="placeholder">
			<h2>More Components Coming Soon</h2>
			<p>This is where we'll showcase:</p>
			<ul>
				<li>Phylogenetic tree visualizations</li>
				<li>Selection analysis charts</li>
				<li>Data tables for results</li>
				<li>Interactive plots</li>
			</ul>
		</div>
	</div>
</section>

<style>
	section {
		max-width: 1000px;
		margin: 0 auto;
	}

	.component-showcase {
		display: grid;
		gap: 2rem;
		margin-top: 2rem;
	}

	.component-item {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		background: white;
	}

	.demo-area {
		margin: 1rem 0;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 4px;
		border: 1px solid #eee;
	}

	.placeholder {
		padding: 2rem;
		background: #f8f9fa;
		border-radius: 8px;
		text-align: center;
		color: #666;
	}

	.placeholder ul {
		text-align: left;
		display: inline-block;
	}

	details {
		margin-top: 1rem;
	}

	details summary {
		cursor: pointer;
		padding: 0.5rem;
		background: #f4f4f4;
		border-radius: 4px;
	}

	details pre {
		background: #f4f4f4;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		margin-top: 0.5rem;
	}

	.fel-preview, .meme-preview {
		max-height: 400px;
		overflow-y: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
	}
</style>
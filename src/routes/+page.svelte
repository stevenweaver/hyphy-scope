<script>
	import { HelloWorld } from '$lib';
</script>

<svelte:head>
	<title>HyPhy Scope - Component Library</title>
	<meta name="description" content="Reusable Svelte components for HyPhy analysis visualization" />
</svelte:head>

<section>
	<h1>Welcome to HyPhy Scope</h1>
	<p>A collection of reusable Svelte components for HyPhy phylogenetic analysis visualization.</p>
	
	<div class="demo">
		<h2>Quick Demo</h2>
		<HelloWorld name="HyPhy" />
	</div>

	<div class="features">
		<h2>Features</h2>
		<ul>
			<li>🧬 HyPhy analysis visualizations (FEL, MEME, SLAC, BUSTED, FUBAR, aBSREL, etc.)</li>
			<li>📊 Interactive Observable Plot charts</li>
			<li>🎨 Clean, responsive design</li>
			<li>📦 Easy npm installation</li>
			<li>🔧 Full TypeScript support</li>
		</ul>
	</div>

	<div class="available-components">
		<h2>Available Components</h2>
		<div class="component-grid">
			<a href="/fel" class="component-card">
				<h3>FEL</h3>
				<p>Fixed Effects Likelihood</p>
			</a>
			<a href="/meme" class="component-card">
				<h3>MEME</h3>
				<p>Mixed Effects Model of Evolution</p>
			</a>
			<a href="/slac" class="component-card">
				<h3>SLAC</h3>
				<p>Single Likelihood Ancestor Counting</p>
			</a>
			<a href="/absrel" class="component-card">
				<h3>aBSREL</h3>
				<p>Adaptive Branch-Site REL</p>
			</a>
			<a href="/busted" class="component-card">
				<h3>BUSTED</h3>
				<p>Branch-Site Unrestricted Statistical Test</p>
			</a>
			<a href="/fubar" class="component-card">
				<h3>FUBAR</h3>
				<p>Fast Unconstrained Bayesian AppRoximation</p>
			</a>
			<a href="/relax" class="component-card">
				<h3>RELAX</h3>
				<p>Test for Relaxed Selection</p>
			</a>
			<a href="/fade" class="component-card">
				<h3>FADE</h3>
				<p>FUBAR Approach to Directional Evolution</p>
			</a>
			<a href="/bgm" class="component-card">
				<h3>BGM</h3>
				<p>Bayesian Graphical Model</p>
			</a>
			<a href="/gard" class="component-card">
				<h3>GARD</h3>
				<p>Genetic Algorithm for Recombination Detection</p>
			</a>
			<a href="/multihit" class="component-card">
				<h3>Multi-Hit</h3>
				<p>Instantaneous Multiple-Nucleotide Changes</p>
			</a>
		</div>
		<p style="text-align: center; margin-top: 1rem;">
			<a href="/components">→ View all components with examples</a>
		</p>
	</div>

	<div class="getting-started">
		<h2>Getting Started</h2>
		<pre><code>npm install hyphy-scope</code></pre>
		<pre><code>import &#123; HelloWorld &#125; from 'hyphy-scope';</code></pre>
	</div>
</section>

<style>
	section {
		max-width: 800px;
		margin: 0 auto;
	}

	.demo {
		margin: 2rem 0;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: #f9f9f9;
	}

	.features ul {
		list-style: none;
		padding: 0;
	}

	.features li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
	}

	.getting-started pre {
		background: #f4f4f4;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
	}

	.available-components {
		margin: 2rem 0;
	}

	.component-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.component-card {
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: white;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.component-card:hover {
		border-color: #007bff;
		box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
		transform: translateY(-2px);
	}

	.component-card h3 {
		margin: 0 0 0.5rem 0;
		color: #007bff;
		font-size: 1.2rem;
	}

	.component-card p {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}
</style>
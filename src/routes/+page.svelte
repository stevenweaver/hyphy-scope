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
			<li>🧬 HyPhy analysis visualizations (FEL, MEME, SLAC, BUSTED, etc.)</li>
			<li>📊 Interactive Observable Plot charts</li>
			<li>🎨 Clean, responsive design</li>
			<li>📦 Easy npm installation</li>
			<li>🔧 Full TypeScript support</li>
		</ul>
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
</style>
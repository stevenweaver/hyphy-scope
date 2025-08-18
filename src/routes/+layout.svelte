<script>
	import '../app.css';
</script>

<div class="app">
	<header>
		<nav>
			<a href="/">Home</a>
			<a href="/components">Components</a>
			<div class="nav-section">
				<span class="nav-label">Demos:</span>
				<a href="/fel">FEL</a>
				<a href="/meme">MEME</a>
				<a href="/absrel">aBSREL</a>
				<a href="/busted">BUSTED</a>
				<a href="/relax">RELAX</a>
				<a href="/slac">SLAC</a>
				<a href="/bgm">BGM</a>
				<a href="/fade">FADE</a>
				<a href="/gard">GARD</a>
				<a href="/tree">Tree</a>
			</div>
		</nav>
		<h1>HyPhy Scope</h1>
		<p>Component Library & Demo</p>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<p>Built with SvelteKit</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		padding: 1rem;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
	}

	nav {
		margin-bottom: 1rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.nav-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.nav-label {
		font-weight: bold;
		color: #666;
		margin-right: 0.5rem;
	}

	nav a {
		text-decoration: none;
		color: #0066cc;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	nav a:hover {
		background: #e3f2fd;
		text-decoration: none;
	}

	h1 {
		margin: 0;
		color: #333;
	}

	main {
		flex: 1;
		padding: 2rem;
	}

	footer {
		padding: 1rem;
		background: #f8f9fa;
		border-top: 1px solid #dee2e6;
		text-align: center;
		color: #666;
	}
</style>
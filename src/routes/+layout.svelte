<script>
	import '../app.css';
</script>

<div class="app">
	<header>
		<nav>
			<a href="/">Home</a>
			<a href="/components">Components</a>
			<a href="/fel">FEL Demo</a>
			<a href="/meme">MEME Demo</a>
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
	}

	nav a {
		margin-right: 1rem;
		text-decoration: none;
		color: #0066cc;
	}

	nav a:hover {
		text-decoration: underline;
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
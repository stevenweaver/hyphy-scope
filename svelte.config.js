import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({
		// Explicitly ensure no deprecated options
		typescript: {
			compilerOptions: {
				verbatimModuleSyntax: true
			}
		}
	}),
	kit: {
		adapter: adapter()
	}
};

export default config;
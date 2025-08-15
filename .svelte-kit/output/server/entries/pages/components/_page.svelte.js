import { y as head, v as pop, t as push } from "../../../chunks/index.js";
import { H as HelloWorld } from "../../../chunks/HelloWorld.js";
import "@observablehq/plot";
/* empty css                                                              */
import { h as html } from "../../../chunks/html.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Components - HyPhy Scope</title>`;
  });
  $$payload.out.push(`<section class="svelte-1dekztq"><h1>Component Gallery</h1> <p>Explore all available components in the HyPhy Scope library.</p> <div class="component-showcase svelte-1dekztq"><div class="component-item svelte-1dekztq"><h2>HelloWorld</h2> <p>A simple greeting component for demonstration purposes.</p> <div class="demo-area svelte-1dekztq">`);
  HelloWorld($$payload, {});
  $$payload.out.push(`<!----> `);
  HelloWorld($$payload, { name: "Scientists" });
  $$payload.out.push(`<!----> `);
  HelloWorld($$payload, { name: "Researchers" });
  $$payload.out.push(`<!----></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code>&lt;script>
	import { HelloWorld } from 'hyphy-scope';
&lt;/script>

&lt;HelloWorld />
&lt;HelloWorld name="Scientists" /></code></pre></details></div> <div class="component-item svelte-1dekztq"><h2>FelVisualization</h2> <p>Interactive visualization for Fixed Effects Likelihood (FEL) analysis results from HyPhy.</p> <div class="demo-area svelte-1dekztq"><div class="fel-preview svelte-1dekztq">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<p>Loading FEL demo...</p>`);
  }
  $$payload.out.push(`<!--]--></div></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code>${html(`&lt;script&gt;
	import { FelVisualization, loadDataFromUrl } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadDataFromUrl(params.json) ||
		       loadDataFromStorage(params.id) ||
		       defaultData;
	});
&lt;/script&gt;

&lt;FelVisualization {data} /&gt;`)}</code></pre></details> <p><a href="/fel">→ View full FEL demo</a></p></div> <div class="component-item svelte-1dekztq"><h2>MemeVisualization</h2> <p>Interactive visualization for Mixed Effects Model of Evolution (MEME) analysis results from HyPhy.</p> <div class="demo-area svelte-1dekztq"><div class="meme-preview svelte-1dekztq">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<p>Loading MEME demo...</p>`);
  }
  $$payload.out.push(`<!--]--></div></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code>${html(`&lt;script&gt;
	import { MemeVisualization } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadMemeData();
	});
&lt;/script&gt;

&lt;MemeVisualization {data} /&gt;`)}</code></pre></details> <p><a href="/meme">→ View full MEME demo</a></p></div> <div class="component-item svelte-1dekztq"><h2>AbsrelVisualization</h2> <p>Interactive visualization for Adaptive Branch-Site Random Effects Likelihood (aBSREL) analysis results from HyPhy.</p> <div class="demo-area svelte-1dekztq"><div class="absrel-preview svelte-1dekztq">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<p>Loading aBSREL demo...</p>`);
  }
  $$payload.out.push(`<!--]--></div></div> <details class="svelte-1dekztq"><summary class="svelte-1dekztq">Code Example</summary> <pre class="svelte-1dekztq"><code>${html(`&lt;script&gt;
	import { AbsrelVisualization } from 'hyphy-scope';
	import { onMount } from 'svelte';
	
	let data = null;
	
	onMount(async () => {
		data = await loadAbsrelData();
	});
&lt;/script&gt;

&lt;AbsrelVisualization {data} /&gt;`)}</code></pre></details> <p><a href="/absrel">→ View full aBSREL demo</a></p></div> <div class="placeholder svelte-1dekztq"><h2>More Components Coming Soon</h2> <p>This is where we'll showcase:</p> <ul class="svelte-1dekztq"><li>Phylogenetic tree visualizations</li> <li>BUSTED analysis results</li> <li>RELAX analysis results</li> <li>Additional HyPhy methods</li></ul></div></div></section>`);
  pop();
}
export {
  _page as default
};

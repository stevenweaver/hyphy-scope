import { y as head } from "../../chunks/index.js";
import { H as HelloWorld } from "../../chunks/HelloWorld.js";
import "@observablehq/plot";
/* empty css                                                           */
function _page($$payload) {
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>HyPhy Scope - Component Library</title>`;
    $$payload2.out.push(`<meta name="description" content="Reusable Svelte components for HyPhy analysis visualization"/>`);
  });
  $$payload.out.push(`<section class="svelte-1v6w2p6"><h1>Welcome to HyPhy Scope</h1> <p>A collection of reusable Svelte components for HyPhy phylogenetic analysis visualization.</p> <div class="demo svelte-1v6w2p6"><h2>Quick Demo</h2> `);
  HelloWorld($$payload, { name: "HyPhy" });
  $$payload.out.push(`<!----></div> <div class="features svelte-1v6w2p6"><h2>Features</h2> <ul class="svelte-1v6w2p6"><li class="svelte-1v6w2p6">🧬 HyPhy analysis visualizations (FEL, MEME, SLAC, BUSTED, etc.)</li> <li class="svelte-1v6w2p6">📊 Interactive Observable Plot charts</li> <li class="svelte-1v6w2p6">🎨 Clean, responsive design</li> <li class="svelte-1v6w2p6">📦 Easy npm installation</li> <li class="svelte-1v6w2p6">🔧 Full TypeScript support</li></ul></div> <div class="getting-started svelte-1v6w2p6"><h2>Getting Started</h2> <pre class="svelte-1v6w2p6"><code>npm install hyphy-scope</code></pre> <pre class="svelte-1v6w2p6"><code>import { HelloWorld } from 'hyphy-scope';</code></pre></div></section>`);
}
export {
  _page as default
};

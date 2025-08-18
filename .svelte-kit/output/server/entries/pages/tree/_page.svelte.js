import "clsx";
import { v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                                   */
import "@observablehq/plot";
import "d3";
function _page($$payload, $$props) {
  push();
  $$payload.out.push(`<div class="page-container svelte-1hrhwcl"><h1 class="svelte-1hrhwcl">Phylogenetic Tree Viewer Demo</h1> <p class="description svelte-1hrhwcl">This is a simple phylogenetic tree viewer component for visualizing trees from HyPhy analysis results.
    It supports basic tree rendering with branch coloring and node labels.</p> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading svelte-1hrhwcl">Loading tree data...</div>`);
  }
  $$payload.out.push(`<!--]--> <div class="info-section svelte-1hrhwcl"><h2 class="svelte-1hrhwcl">Features</h2> <ul class="svelte-1hrhwcl"><li class="svelte-1hrhwcl"><strong>Tree Rendering</strong>: Uses the phylotree.js library for robust tree visualization</li> <li class="svelte-1hrhwcl"><strong>Branch Coloring</strong>: Color branches by branch length or other attributes</li> <li class="svelte-1hrhwcl"><strong>Node Labels</strong>: Display sequence names and other node information</li> <li class="svelte-1hrhwcl"><strong>Interactive Controls</strong>: Toggle labels and coloring options</li> <li class="svelte-1hrhwcl"><strong>Multiple Trees</strong>: Support for datasets with multiple trees</li> <li class="svelte-1hrhwcl"><strong>HyPhy Integration</strong>: Designed to work with HyPhy analysis results</li></ul> <h2 class="svelte-1hrhwcl">Supported Data Format</h2> <p>The component expects HyPhy analysis results with:</p> <ul class="svelte-1hrhwcl"><li class="svelte-1hrhwcl"><code class="svelte-1hrhwcl">input.trees</code>: Newick format tree string(s)</li> <li class="svelte-1hrhwcl"><code class="svelte-1hrhwcl">branch attributes</code>: Branch-specific data for coloring and tooltips</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

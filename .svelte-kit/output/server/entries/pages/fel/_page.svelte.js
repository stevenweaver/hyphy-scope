import { y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                                   */
import "@observablehq/plot";
import "d3";
import { a as attr } from "../../../chunks/attributes.js";
import { h as html } from "../../../chunks/html.js";
function _page($$payload, $$props) {
  push();
  let selectedTestData = "fel";
  let jsonUrl = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>FEL Visualization - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive FEL (Fixed Effects Likelihood) analysis visualization"/>`);
  });
  $$payload.out.push(`<div class="fel-demo svelte-xnod31"><div class="header svelte-xnod31"><h1 class="svelte-xnod31">FEL Analysis Visualization</h1> <p class="svelte-xnod31">Interactive visualization for Fixed Effects Likelihood (FEL) analysis results from HyPhy.</p></div> <div class="data-loading svelte-xnod31"><h2>Load Data</h2> <div class="loading-options svelte-xnod31"><div class="option svelte-xnod31"><h3 class="svelte-xnod31">Upload File</h3> <input type="file" accept=".json" class="svelte-xnod31"/> <p class="help svelte-xnod31">Select a HyPhy FEL results JSON file</p></div> <div class="option svelte-xnod31"><h3 class="svelte-xnod31">Load from URL</h3> <div class="url-input svelte-xnod31"><input type="url" placeholder="https://example.com/results.json"${attr("value", jsonUrl)} class="svelte-xnod31"/> <button${attr("disabled", !jsonUrl.trim(), true)} class="svelte-xnod31">Load</button></div> <p class="help svelte-xnod31">Enter a URL to a publicly accessible JSON file</p></div> <div class="option svelte-xnod31"><h3 class="svelte-xnod31">Test Data</h3> <div class="test-data-controls svelte-xnod31"><select class="svelte-xnod31">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<option value="fel"${maybe_selected($$payload, "fel")}>FEL</option><option value="meme"${maybe_selected($$payload, "meme")}>MEME</option><option value="slac"${maybe_selected($$payload, "slac")}>SLAC</option><option value="busted"${maybe_selected($$payload, "busted")}>BUSTED</option><option value="absrel"${maybe_selected($$payload, "absrel")}>aBSREL</option><option value="relax"${maybe_selected($$payload, "relax")}>RELAX</option><option value="bgm"${maybe_selected($$payload, "bgm")}>BGM</option><option value="fade"${maybe_selected($$payload, "fade")}>FADE</option><option value="gard"${maybe_selected($$payload, "gard")}>GARD</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button class="svelte-xnod31">Load Test Data</button></div> <p class="help svelte-xnod31">Select from available test datasets</p></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="no-data svelte-xnod31"><p>Please load FEL analysis data to begin visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-xnod31"><h2 class="svelte-xnod31">Usage</h2> <h3 class="svelte-xnod31">As a Component</h3> <pre class="svelte-xnod31"><code class="svelte-xnod31">${html(`&lt;script&gt;
  import { FelVisualization } from 'hyphy-scope';
  
  let data = null;
  
  // Load your data
  onMount(async () => {
    data = await loadDataFromUrl(params.json) ||
           loadDataFromStorage(params.id) ||
           defaultData;
  });
&lt;/script&gt;

&lt;FelVisualization {data} /&gt;`)}</code></pre> <h3 class="svelte-xnod31">URL Parameters</h3> <ul class="svelte-xnod31"><li class="svelte-xnod31"><code class="svelte-xnod31">?json=URL</code> - Load data from external URL</li> <li class="svelte-xnod31"><code class="svelte-xnod31">?id=ID</code> - Load data from localStorage</li> <li class="svelte-xnod31"><code class="svelte-xnod31">?data=JSON</code> - Parse JSON data directly</li></ul> <h3 class="svelte-xnod31">Features</h3> <ul class="svelte-xnod31"><li class="svelte-xnod31">Interactive plots with multiple visualization types</li> <li class="svelte-xnod31">Filterable results table</li> <li class="svelte-xnod31">Configurable p-value thresholds</li> <li class="svelte-xnod31">Site classification by selection pressure</li> <li class="svelte-xnod31">Summary statistics</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

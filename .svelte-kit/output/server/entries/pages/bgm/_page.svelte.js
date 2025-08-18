import { z as ensure_array_like, y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                                   */
import "@observablehq/plot";
import "d3";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let dataUrl = "";
  let selectedTestData = "bgm";
  const availableTestData = [
    { value: "fel", label: "FEL" },
    { value: "meme", label: "MEME" },
    { value: "absrel", label: "aBSREL" },
    { value: "busted", label: "BUSTED" },
    { value: "relax", label: "RELAX" },
    { value: "slac", label: "SLAC" },
    { value: "bgm", label: "BGM" }
  ];
  const each_array = ensure_array_like(availableTestData);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>BGM Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of BGM (Bayesian Graphical Model) analysis results"/>`);
  });
  $$payload.out.push(`<div class="bgm-demo svelte-2x16si"><div class="header svelte-2x16si"><h1 class="svelte-2x16si">BGM Analysis</h1> <p class="svelte-2x16si">Interactive visualization of Bayesian Graphical Model analysis.
      BGM detects correlated evolution between sites using graphical models.</p></div> <div class="data-loading svelte-2x16si"><h2>Load Data</h2> <div class="loading-options svelte-2x16si"><div class="option svelte-2x16si"><h3 class="svelte-2x16si">Test Data</h3> <div class="test-data-controls svelte-2x16si"><select class="svelte-2x16si">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-2x16si">${escape_html("Load Test Data")}</button></div> <p class="help svelte-2x16si">Load example data to explore the visualization features.</p></div> <div class="option svelte-2x16si"><h3 class="svelte-2x16si">Load from URL</h3> <div class="url-input svelte-2x16si"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-2x16si"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-2x16si">Load</button></div> <p class="help svelte-2x16si">Load BGM results from a remote JSON file.</p></div> <div class="option svelte-2x16si"><h3 class="svelte-2x16si">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-2x16si"/> <p class="help svelte-2x16si">Upload a local BGM JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-2x16si"><h3>No Data Loaded</h3> <p>Please load BGM analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-2x16si"><h2 class="svelte-2x16si">About BGM</h2> <h3 class="svelte-2x16si">What is BGM?</h3> <p><strong>BGM (Bayesian Graphical Model)</strong> is a method for detecting correlated 
      evolution between sites in protein-coding sequences. It uses probabilistic graphical 
      models to identify pairs of sites that evolve in a coordinated manner.</p> <h3 class="svelte-2x16si">Key Features</h3> <ul class="svelte-2x16si"><li class="svelte-2x16si"><strong>Bayesian framework:</strong> Uses Bayesian inference for model selection</li> <li class="svelte-2x16si"><strong>Graphical models:</strong> Models dependencies between sites</li> <li class="svelte-2x16si"><strong>Correlation detection:</strong> Identifies correlated evolutionary patterns</li> <li class="svelte-2x16si"><strong>Network analysis:</strong> Reveals evolutionary networks between sites</li> <li class="svelte-2x16si"><strong>Statistical rigor:</strong> Provides posterior probabilities for correlations</li></ul> <h3 class="svelte-2x16si">Interpretation</h3> <ul class="svelte-2x16si"><li class="svelte-2x16si"><strong>High correlation:</strong> Sites evolve together (functional/structural constraints)</li> <li class="svelte-2x16si"><strong>Positive correlation:</strong> Similar evolutionary pressures</li> <li class="svelte-2x16si"><strong>Negative correlation:</strong> Compensatory changes</li> <li class="svelte-2x16si"><strong>p-value &lt; 0.05:</strong> Significant evidence for correlation</li> <li class="svelte-2x16si"><strong>Network structure:</strong> Reveals functional domains or interactions</li></ul> <h3 class="svelte-2x16si">Using This Component</h3> <pre class="svelte-2x16si"><code class="svelte-2x16si">import { BgmVisualization } from 'hyphy-scope';

&lt;BgmVisualization data={bgmResults} /></code></pre> <h3 class="svelte-2x16si">Data Format</h3> <p>The component expects BGM analysis results in JSON format with the following structure:</p> <ul class="svelte-2x16si"><li class="svelte-2x16si"><code class="svelte-2x16si">test results</code> - Correlation results for site pairs</li> <li class="svelte-2x16si"><code class="svelte-2x16si">data partitions</code> - Partition information for sites</li> <li class="svelte-2x16si"><code class="svelte-2x16si">input</code> - Input parameters (sequences, sites)</li></ul> <h3 class="svelte-2x16si">Applications</h3> <ul class="svelte-2x16si"><li class="svelte-2x16si"><strong>Protein structure:</strong> Identify structurally interacting residues</li> <li class="svelte-2x16si"><strong>Functional domains:</strong> Discover co-evolving functional regions</li> <li class="svelte-2x16si"><strong>Compensatory mutations:</strong> Find sites with coordinated changes</li> <li class="svelte-2x16si"><strong>Drug resistance:</strong> Understand resistance mutation networks</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

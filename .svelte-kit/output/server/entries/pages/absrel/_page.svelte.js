import { z as ensure_array_like, y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                              */
import "@observablehq/plot";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let dataUrl = "";
  let selectedTestData = "absrel";
  const availableTestData = [
    { value: "fel", label: "FEL" },
    { value: "meme", label: "MEME" },
    { value: "absrel", label: "aBSREL" },
    { value: "busted", label: "BUSTED" },
    { value: "relax", label: "RELAX" }
  ];
  const each_array = ensure_array_like(availableTestData);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>aBSREL Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of aBSREL (Adaptive Branch-Site Random Effects Likelihood) analysis results"/>`);
  });
  $$payload.out.push(`<div class="absrel-demo svelte-1768dd3"><div class="header svelte-1768dd3"><h1 class="svelte-1768dd3">aBSREL Analysis</h1> <p class="svelte-1768dd3">Interactive visualization of Adaptive Branch-Site Random Effects Likelihood analysis.
      aBSREL tests for episodic positive selection on branches without requiring 
      a priori specification of lineages.</p></div> <div class="data-loading svelte-1768dd3"><h2>Load Data</h2> <div class="loading-options svelte-1768dd3"><div class="option svelte-1768dd3"><h3 class="svelte-1768dd3">Test Data</h3> <div class="test-data-controls svelte-1768dd3"><select class="svelte-1768dd3">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-1768dd3">${escape_html("Load Test Data")}</button></div> <p class="help svelte-1768dd3">Load example data to explore the visualization features.</p></div> <div class="option svelte-1768dd3"><h3 class="svelte-1768dd3">Load from URL</h3> <div class="url-input svelte-1768dd3"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-1768dd3"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-1768dd3">Load</button></div> <p class="help svelte-1768dd3">Load aBSREL results from a remote JSON file.</p></div> <div class="option svelte-1768dd3"><h3 class="svelte-1768dd3">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-1768dd3"/> <p class="help svelte-1768dd3">Upload a local aBSREL JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-1768dd3"><h3>No Data Loaded</h3> <p>Please load aBSREL analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-1768dd3"><h2 class="svelte-1768dd3">About aBSREL</h2> <h3 class="svelte-1768dd3">What is aBSREL?</h3> <p>The <strong>Adaptive Branch-Site Random Effects Likelihood (aBSREL)</strong> method 
      tests whether a gene has experienced positive selection along individual branches 
      without requiring a priori specification of lineages. It uses an adaptive approach 
      to determine the optimal number of rate classes for each branch.</p> <h3 class="svelte-1768dd3">Key Features</h3> <ul class="svelte-1768dd3"><li class="svelte-1768dd3"><strong>Branch-specific testing:</strong> Tests each branch individually for positive selection</li> <li class="svelte-1768dd3"><strong>Adaptive rate classes:</strong> Automatically determines optimal number of rate classes</li> <li class="svelte-1768dd3"><strong>No a priori specification:</strong> Does not require prior knowledge of which branches to test</li> <li class="svelte-1768dd3"><strong>Multiple testing correction:</strong> Applies Holm-Bonferroni correction for multiple comparisons</li> <li class="svelte-1768dd3"><strong>Bayes Factor support:</strong> Provides evidence ratios for selection</li></ul> <h3 class="svelte-1768dd3">Interpretation</h3> <ul class="svelte-1768dd3"><li class="svelte-1768dd3"><strong>p-value &lt; 0.05:</strong> Evidence of positive selection on the branch</li> <li class="svelte-1768dd3"><strong>ω > 1:</strong> Rate classes with positive selection (dN/dS > 1)</li> <li class="svelte-1768dd3"><strong>Bayes Factor > 100:</strong> Very strong evidence for selection</li> <li class="svelte-1768dd3"><strong>Rate classes:</strong> Number of selective regimes fitted to the branch</li></ul> <h3 class="svelte-1768dd3">Using This Component</h3> <pre class="svelte-1768dd3"><code class="svelte-1768dd3">import { AbsrelVisualization } from 'hyphy-scope';

&lt;AbsrelVisualization data={absrelResults} /></code></pre> <h3 class="svelte-1768dd3">Data Format</h3> <p>The component expects aBSREL analysis results in JSON format with the following structure:</p> <ul class="svelte-1768dd3"><li class="svelte-1768dd3"><code class="svelte-1768dd3">test results</code> - Statistical test results for each branch</li> <li class="svelte-1768dd3"><code class="svelte-1768dd3">Site Log Likelihood</code> - Site-level likelihood data</li> <li class="svelte-1768dd3"><code class="svelte-1768dd3">branch attributes</code> - Branch-specific rate distributions</li> <li class="svelte-1768dd3"><code class="svelte-1768dd3">fits</code> - Model comparison statistics</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

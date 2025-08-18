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
  let selectedTestData = "relax";
  const availableTestData = [
    { value: "fel", label: "FEL" },
    { value: "meme", label: "MEME" },
    { value: "absrel", label: "aBSREL" },
    { value: "busted", label: "BUSTED" },
    { value: "relax", label: "RELAX" },
    { value: "slac", label: "SLAC" }
  ];
  const each_array = ensure_array_like(availableTestData);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>RELAX Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of RELAX analysis results for detecting relaxed or intensified selection"/>`);
  });
  $$payload.out.push(`<div class="relax-demo svelte-19s98ge"><div class="header svelte-19s98ge"><h1 class="svelte-19s98ge">RELAX Analysis</h1> <p class="svelte-19s98ge">Interactive visualization of RELAX analysis for detecting relaxed or intensified selection.
      RELAX tests whether selection pressure has changed between test and reference branches.</p></div> <div class="data-loading svelte-19s98ge"><h2>Load Data</h2> <div class="loading-options svelte-19s98ge"><div class="option svelte-19s98ge"><h3 class="svelte-19s98ge">Test Data</h3> <div class="test-data-controls svelte-19s98ge"><select class="svelte-19s98ge">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-19s98ge">${escape_html("Load Test Data")}</button></div> <p class="help svelte-19s98ge">Load example data to explore the visualization features.</p></div> <div class="option svelte-19s98ge"><h3 class="svelte-19s98ge">Load from URL</h3> <div class="url-input svelte-19s98ge"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-19s98ge"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-19s98ge">Load</button></div> <p class="help svelte-19s98ge">Load RELAX results from a remote JSON file.</p></div> <div class="option svelte-19s98ge"><h3 class="svelte-19s98ge">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-19s98ge"/> <p class="help svelte-19s98ge">Upload a local RELAX JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-19s98ge"><h3>No Data Loaded</h3> <p>Please load RELAX analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-19s98ge"><h2 class="svelte-19s98ge">About RELAX</h2> <h3 class="svelte-19s98ge">What is RELAX?</h3> <p><strong>RELAX</strong> is a hypothesis test that asks whether the strength of natural 
      selection has been relaxed or intensified along a specified set of test branches relative 
      to a set of reference branches. It uses a covarion-style model to compare selection 
      pressure between branch sets.</p> <h3 class="svelte-19s98ge">Key Concepts</h3> <ul class="svelte-19s98ge"><li class="svelte-19s98ge"><strong>K Parameter:</strong> Selection intensity parameter comparing test vs reference branches</li> <li class="svelte-19s98ge"><strong>K > 1:</strong> Selection has been intensified on test branches</li> <li class="svelte-19s98ge"><strong>K &lt; 1:</strong> Selection has been relaxed on test branches</li> <li class="svelte-19s98ge"><strong>K = 1:</strong> No difference in selection pressure</li> <li class="svelte-19s98ge"><strong>Test branches:</strong> Branches where selection change is tested</li> <li class="svelte-19s98ge"><strong>Reference branches:</strong> Branches used as baseline for comparison</li></ul> <h3 class="svelte-19s98ge">Interpretation</h3> <ul class="svelte-19s98ge"><li class="svelte-19s98ge"><strong>Significant p-value &amp; K > 1:</strong> Selection intensified on test branches</li> <li class="svelte-19s98ge"><strong>Significant p-value &amp; K &lt; 1:</strong> Selection relaxed on test branches</li> <li class="svelte-19s98ge"><strong>Non-significant p-value:</strong> No detectable change in selection pressure</li> <li class="svelte-19s98ge"><strong>Rate distributions:</strong> Show ω categories and their proportions</li></ul> <h3 class="svelte-19s98ge">Common Applications</h3> <ul class="svelte-19s98ge"><li class="svelte-19s98ge"><strong>Gene duplication:</strong> Test if selection relaxed after duplication</li> <li class="svelte-19s98ge"><strong>Functional changes:</strong> Test if selection changed with function</li> <li class="svelte-19s98ge"><strong>Environmental shifts:</strong> Test if selection changed with environment</li> <li class="svelte-19s98ge"><strong>Lineage-specific evolution:</strong> Compare selection between lineages</li></ul> <h3 class="svelte-19s98ge">Using This Component</h3> <pre class="svelte-19s98ge"><code class="svelte-19s98ge">import { RelaxVisualization } from 'hyphy-scope';

&lt;RelaxVisualization data={relaxResults} /></code></pre> <h3 class="svelte-19s98ge">Data Format</h3> <p>The component expects RELAX analysis results in JSON format with the following structure:</p> <ul class="svelte-19s98ge"><li class="svelte-19s98ge"><code class="svelte-19s98ge">test results</code> - K parameter, p-value, and likelihood ratio test</li> <li class="svelte-19s98ge"><code class="svelte-19s98ge">tested</code> - Definition of test and reference branch sets</li> <li class="svelte-19s98ge"><code class="svelte-19s98ge">branch attributes</code> - Rate distributions for each branch set</li> <li class="svelte-19s98ge"><code class="svelte-19s98ge">fits</code> - Model comparison statistics</li></ul> <h3 class="svelte-19s98ge">Method Comparison</h3> <p>RELAX differs from other HyPhy methods:</p> <ul class="svelte-19s98ge"><li class="svelte-19s98ge"><strong>vs. BUSTED:</strong> Tests selection change rather than presence</li> <li class="svelte-19s98ge"><strong>vs. aBSREL:</strong> Compares branch sets rather than testing individual branches</li> <li class="svelte-19s98ge"><strong>vs. FEL/MEME:</strong> Tests selection pressure changes rather than site-level selection</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

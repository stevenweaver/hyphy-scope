import { z as ensure_array_like, y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                              */
import "@observablehq/plot";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let dataUrl = "";
  let selectedTestData = "slac";
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
    $$payload2.title = `<title>SLAC Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of SLAC (Single Likelihood Ancestor Counting) analysis results"/>`);
  });
  $$payload.out.push(`<div class="slac-demo svelte-1vcjtdf"><div class="header svelte-1vcjtdf"><h1 class="svelte-1vcjtdf">SLAC Analysis</h1> <p class="svelte-1vcjtdf">Interactive visualization of Single Likelihood Ancestor Counting analysis.
      SLAC uses maximum likelihood to infer synonymous and non-synonymous substitutions at each site.</p></div> <div class="data-loading svelte-1vcjtdf"><h2>Load Data</h2> <div class="loading-options svelte-1vcjtdf"><div class="option svelte-1vcjtdf"><h3 class="svelte-1vcjtdf">Test Data</h3> <div class="test-data-controls svelte-1vcjtdf"><select class="svelte-1vcjtdf">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-1vcjtdf">${escape_html("Load Test Data")}</button></div> <p class="help svelte-1vcjtdf">Load example data to explore the visualization features.</p></div> <div class="option svelte-1vcjtdf"><h3 class="svelte-1vcjtdf">Load from URL</h3> <div class="url-input svelte-1vcjtdf"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-1vcjtdf"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-1vcjtdf">Load</button></div> <p class="help svelte-1vcjtdf">Load SLAC results from a remote JSON file.</p></div> <div class="option svelte-1vcjtdf"><h3 class="svelte-1vcjtdf">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-1vcjtdf"/> <p class="help svelte-1vcjtdf">Upload a local SLAC JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-1vcjtdf"><h3>No Data Loaded</h3> <p>Please load SLAC analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-1vcjtdf"><h2 class="svelte-1vcjtdf">About SLAC</h2> <h3 class="svelte-1vcjtdf">What is SLAC?</h3> <p><strong>SLAC (Single Likelihood Ancestor Counting)</strong> is a maximum likelihood method 
      for detecting sites under positive selection. It counts the number of synonymous (dS) and 
      non-synonymous (dN) substitutions at each site by reconstructing ancestral sequences.</p> <h3 class="svelte-1vcjtdf">Key Features</h3> <ul class="svelte-1vcjtdf"><li class="svelte-1vcjtdf"><strong>Maximum likelihood:</strong> Uses ML to reconstruct ancestral sequences</li> <li class="svelte-1vcjtdf"><strong>Site-by-site analysis:</strong> Tests each codon site individually</li> <li class="svelte-1vcjtdf"><strong>dN/dS ratios:</strong> Calculates selection pressure at each site</li> <li class="svelte-1vcjtdf"><strong>Statistical testing:</strong> Provides p-values for significance</li> <li class="svelte-1vcjtdf"><strong>Fast computation:</strong> Efficient algorithm for large datasets</li></ul> <h3 class="svelte-1vcjtdf">Interpretation</h3> <ul class="svelte-1vcjtdf"><li class="svelte-1vcjtdf"><strong>dN/dS > 1:</strong> May indicate positive selection</li> <li class="svelte-1vcjtdf"><strong>dN/dS &lt; 1:</strong> Indicates purifying/negative selection</li> <li class="svelte-1vcjtdf"><strong>dN/dS ≈ 1:</strong> Indicates neutral evolution</li> <li class="svelte-1vcjtdf"><strong>p-value &lt; 0.1:</strong> Significant evidence for non-neutral evolution</li> <li class="svelte-1vcjtdf"><strong>Normalized dN-dS:</strong> Difference measure accounting for variance</li></ul> <h3 class="svelte-1vcjtdf">Using This Component</h3> <pre class="svelte-1vcjtdf"><code class="svelte-1vcjtdf">import { SlacVisualization } from 'hyphy-scope';

&lt;SlacVisualization data={slacResults} /></code></pre> <h3 class="svelte-1vcjtdf">Data Format</h3> <p>The component expects SLAC analysis results in JSON format with the following structure:</p> <ul class="svelte-1vcjtdf"><li class="svelte-1vcjtdf"><code class="svelte-1vcjtdf">MLE</code> - Maximum likelihood estimates for each site</li> <li class="svelte-1vcjtdf"><code class="svelte-1vcjtdf">MLE.content</code> - Site-by-site results [dN, dS, dN-dS, dN/dS, p-value]</li> <li class="svelte-1vcjtdf"><code class="svelte-1vcjtdf">data partitions</code> - Partition information for sites</li></ul> <h3 class="svelte-1vcjtdf">Method Comparison</h3> <p>SLAC differs from other HyPhy methods:</p> <ul class="svelte-1vcjtdf"><li class="svelte-1vcjtdf"><strong>vs. FEL:</strong> Uses counting approach rather than likelihood ratios</li> <li class="svelte-1vcjtdf"><strong>vs. MEME:</strong> Tests for consistent rather than episodic selection</li> <li class="svelte-1vcjtdf"><strong>vs. BUSTED:</strong> Site-level rather than gene-level testing</li> <li class="svelte-1vcjtdf"><strong>Speed:</strong> Faster than FEL but may be less powerful</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

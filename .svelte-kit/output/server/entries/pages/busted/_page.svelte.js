import { z as ensure_array_like, y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                              */
import "@observablehq/plot";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let dataUrl = "";
  let selectedTestData = "busted";
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
    $$payload2.title = `<title>BUSTED Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of BUSTED (Branch-site Unrestricted Statistical Test for Episodic Diversification) analysis results"/>`);
  });
  $$payload.out.push(`<div class="busted-demo svelte-m5loyz"><div class="header svelte-m5loyz"><h1 class="svelte-m5loyz">BUSTED Analysis</h1> <p class="svelte-m5loyz">Interactive visualization of Branch-site Unrestricted Statistical Test for Episodic Diversification.
      BUSTED tests whether a gene has experienced positive selection at some sites along some branches.</p></div> <div class="data-loading svelte-m5loyz"><h2>Load Data</h2> <div class="loading-options svelte-m5loyz"><div class="option svelte-m5loyz"><h3 class="svelte-m5loyz">Test Data</h3> <div class="test-data-controls svelte-m5loyz"><select class="svelte-m5loyz">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-m5loyz">${escape_html("Load Test Data")}</button></div> <p class="help svelte-m5loyz">Load example data to explore the visualization features.</p></div> <div class="option svelte-m5loyz"><h3 class="svelte-m5loyz">Load from URL</h3> <div class="url-input svelte-m5loyz"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-m5loyz"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-m5loyz">Load</button></div> <p class="help svelte-m5loyz">Load BUSTED results from a remote JSON file.</p></div> <div class="option svelte-m5loyz"><h3 class="svelte-m5loyz">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-m5loyz"/> <p class="help svelte-m5loyz">Upload a local BUSTED JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-m5loyz"><h3>No Data Loaded</h3> <p>Please load BUSTED analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-m5loyz"><h2 class="svelte-m5loyz">About BUSTED</h2> <h3 class="svelte-m5loyz">What is BUSTED?</h3> <p><strong>BUSTED (Branch-site Unrestricted Statistical Test for Episodic Diversification)</strong> is a likelihood ratio test that provides evidence for positive selection occurring at 
      some sites along some branches in a phylogeny. Unlike site-specific methods, BUSTED 
      tests for selection at the gene level.</p> <h3 class="svelte-m5loyz">Key Features</h3> <ul class="svelte-m5loyz"><li class="svelte-m5loyz"><strong>Gene-wide test:</strong> Tests whether ANY sites have experienced positive selection</li> <li class="svelte-m5loyz"><strong>No multiple testing:</strong> Single test per gene, avoiding multiple comparison issues</li> <li class="svelte-m5loyz"><strong>Flexible framework:</strong> Can test specific branches or all branches</li> <li class="svelte-m5loyz"><strong>Evidence ratios:</strong> Provides site-level evidence for positive selection</li> <li class="svelte-m5loyz"><strong>Robust method:</strong> Uses likelihood ratio test with known statistical properties</li></ul> <h3 class="svelte-m5loyz">Interpretation</h3> <ul class="svelte-m5loyz"><li class="svelte-m5loyz"><strong>p-value &lt; 0.05:</strong> Evidence of positive selection somewhere in the gene</li> <li class="svelte-m5loyz"><strong>Evidence Ratios:</strong> Site-level support for positive selection</li> <li class="svelte-m5loyz"><strong>≥100:</strong> Strong evidence for positive selection at site</li> <li class="svelte-m5loyz"><strong>≥10:</strong> Moderate evidence for positive selection</li> <li class="svelte-m5loyz"><strong>≥3:</strong> Weak evidence for positive selection</li></ul> <h3 class="svelte-m5loyz">Using This Component</h3> <pre class="svelte-m5loyz"><code class="svelte-m5loyz">import { BustedVisualization } from 'hyphy-scope';

&lt;BustedVisualization data={bustedResults} /></code></pre> <h3 class="svelte-m5loyz">Data Format</h3> <p>The component expects BUSTED analysis results in JSON format with the following structure:</p> <ul class="svelte-m5loyz"><li class="svelte-m5loyz"><code class="svelte-m5loyz">test results</code> - Overall test statistics and p-value</li> <li class="svelte-m5loyz"><code class="svelte-m5loyz">Evidence Ratios</code> - Site-level evidence for positive selection</li> <li class="svelte-m5loyz"><code class="svelte-m5loyz">Synonymous site-posteriors</code> - Synonymous substitution rates</li> <li class="svelte-m5loyz"><code class="svelte-m5loyz">fits</code> - Model comparison statistics</li></ul> <h3 class="svelte-m5loyz">Method Comparison</h3> <p>BUSTED differs from other HyPhy methods:</p> <ul class="svelte-m5loyz"><li class="svelte-m5loyz"><strong>vs. FEL/MEME:</strong> Tests gene-wide rather than site-by-site</li> <li class="svelte-m5loyz"><strong>vs. aBSREL:</strong> Tests all branches rather than individual branches</li> <li class="svelte-m5loyz"><strong>vs. RELAX:</strong> Tests for selection rather than relaxation of selection</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

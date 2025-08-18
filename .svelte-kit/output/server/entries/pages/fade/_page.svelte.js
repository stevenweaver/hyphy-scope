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
  let selectedTestData = "fade";
  const availableTestData = [
    { value: "fel", label: "FEL" },
    { value: "meme", label: "MEME" },
    { value: "absrel", label: "aBSREL" },
    { value: "busted", label: "BUSTED" },
    { value: "relax", label: "RELAX" },
    { value: "slac", label: "SLAC" },
    { value: "bgm", label: "BGM" },
    { value: "fade", label: "FADE" }
  ];
  const each_array = ensure_array_like(availableTestData);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>FADE Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of FADE (FUBAR Approach to Directional Evolution) analysis results"/>`);
  });
  $$payload.out.push(`<div class="fade-demo svelte-14pglpm"><div class="header svelte-14pglpm"><h1 class="svelte-14pglpm">FADE Analysis</h1> <p class="svelte-14pglpm">Interactive visualization of FUBAR Approach to Directional Evolution analysis.
      FADE tests for directional selection toward specific amino acids.</p></div> <div class="data-loading svelte-14pglpm"><h2>Load Data</h2> <div class="loading-options svelte-14pglpm"><div class="option svelte-14pglpm"><h3 class="svelte-14pglpm">Test Data</h3> <div class="test-data-controls svelte-14pglpm"><select class="svelte-14pglpm">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-14pglpm">${escape_html("Load Test Data")}</button></div> <p class="help svelte-14pglpm">Load example data to explore the visualization features.</p></div> <div class="option svelte-14pglpm"><h3 class="svelte-14pglpm">Load from URL</h3> <div class="url-input svelte-14pglpm"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-14pglpm"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-14pglpm">Load</button></div> <p class="help svelte-14pglpm">Load FADE results from a remote JSON file.</p></div> <div class="option svelte-14pglpm"><h3 class="svelte-14pglpm">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-14pglpm"/> <p class="help svelte-14pglpm">Upload a local FADE JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-14pglpm"><h3>No Data Loaded</h3> <p>Please load FADE analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-14pglpm"><h2 class="svelte-14pglpm">About FADE</h2> <h3 class="svelte-14pglpm">What is FADE?</h3> <p><strong>FADE (FUBAR Approach to Directional Evolution)</strong> is a maximum likelihood 
      method for testing directional selection toward specific amino acids. It extends FUBAR 
      to detect directional evolutionary bias in protein sequences.</p> <h3 class="svelte-14pglpm">Key Features</h3> <ul class="svelte-14pglpm"><li class="svelte-14pglpm"><strong>Directional bias:</strong> Tests for selection toward specific amino acids</li> <li class="svelte-14pglpm"><strong>Maximum likelihood:</strong> Uses ML framework for parameter estimation</li> <li class="svelte-14pglpm"><strong>FUBAR extension:</strong> Built on the FUBAR methodology</li> <li class="svelte-14pglpm"><strong>Branch-level analysis:</strong> Detects directional bias on specific branches</li> <li class="svelte-14pglpm"><strong>Statistical testing:</strong> Provides likelihood ratio tests for significance</li></ul> <h3 class="svelte-14pglpm">Interpretation</h3> <ul class="svelte-14pglpm"><li class="svelte-14pglpm"><strong>Positive bias:</strong> Selection favors specific amino acid changes</li> <li class="svelte-14pglpm"><strong>Negative bias:</strong> Selection disfavors certain amino acid changes</li> <li class="svelte-14pglpm"><strong>Magnitude:</strong> Strength of directional selection pressure</li> <li class="svelte-14pglpm"><strong>p-value &lt; 0.05:</strong> Significant evidence for directional bias</li> <li class="svelte-14pglpm"><strong>Branch patterns:</strong> Reveals lineage-specific directional evolution</li></ul> <h3 class="svelte-14pglpm">Using This Component</h3> <pre class="svelte-14pglpm"><code class="svelte-14pglpm">import { FadeVisualization } from 'hyphy-scope';

&lt;FadeVisualization data={fadeResults} /></code></pre> <h3 class="svelte-14pglpm">Data Format</h3> <p>The component expects FADE analysis results in JSON format with the following structure:</p> <ul class="svelte-14pglpm"><li class="svelte-14pglpm"><code class="svelte-14pglpm">test results</code> - Statistical test results (p-value, LRT)</li> <li class="svelte-14pglpm"><code class="svelte-14pglpm">branch attributes</code> - Branch-specific bias measurements</li> <li class="svelte-14pglpm"><code class="svelte-14pglpm">input</code> - Input parameters (sequences, sites)</li> <li class="svelte-14pglpm"><code class="svelte-14pglpm">data partitions</code> - Partition information</li></ul> <h3 class="svelte-14pglpm">Applications</h3> <ul class="svelte-14pglpm"><li class="svelte-14pglpm"><strong>Protein evolution:</strong> Identify directional changes in protein function</li> <li class="svelte-14pglpm"><strong>Host adaptation:</strong> Detect adaptation to new host environments</li> <li class="svelte-14pglpm"><strong>Drug resistance:</strong> Understand directional changes in drug targets</li> <li class="svelte-14pglpm"><strong>Immune escape:</strong> Identify directional evolution in immune-targeted regions</li> <li class="svelte-14pglpm"><strong>Functional shifts:</strong> Detect systematic changes in protein function</li></ul> <h3 class="svelte-14pglpm">Method Comparison</h3> <p>FADE differs from other HyPhy methods:</p> <ul class="svelte-14pglpm"><li class="svelte-14pglpm"><strong>vs. FEL/MEME:</strong> Tests directional bias rather than positive selection</li> <li class="svelte-14pglpm"><strong>vs. RELAX:</strong> Detects bias toward specific changes, not intensity changes</li> <li class="svelte-14pglpm"><strong>vs. BUSTED:</strong> Branch-specific rather than gene-wide testing</li> <li class="svelte-14pglpm"><strong>Specialization:</strong> Designed specifically for directional evolution detection</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

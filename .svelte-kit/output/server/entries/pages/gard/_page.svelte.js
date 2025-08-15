import { z as ensure_array_like, y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                              */
import "@observablehq/plot";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let dataUrl = "";
  let selectedTestData = "gard";
  const availableTestData = [
    { value: "fel", label: "FEL" },
    { value: "meme", label: "MEME" },
    { value: "absrel", label: "aBSREL" },
    { value: "busted", label: "BUSTED" },
    { value: "relax", label: "RELAX" },
    { value: "slac", label: "SLAC" },
    { value: "bgm", label: "BGM" },
    { value: "fade", label: "FADE" },
    { value: "gard", label: "GARD" }
  ];
  const each_array = ensure_array_like(availableTestData);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>GARD Analysis - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive visualization of GARD (Genetic Algorithm for Recombination Detection) analysis results"/>`);
  });
  $$payload.out.push(`<div class="gard-demo svelte-xmeofi"><div class="header svelte-xmeofi"><h1 class="svelte-xmeofi">GARD Analysis</h1> <p class="svelte-xmeofi">Interactive visualization of Genetic Algorithm for Recombination Detection analysis.
      GARD identifies recombination breakpoints in sequence alignments.</p></div> <div class="data-loading svelte-xmeofi"><h2>Load Data</h2> <div class="loading-options svelte-xmeofi"><div class="option svelte-xmeofi"><h3 class="svelte-xmeofi">Test Data</h3> <div class="test-data-controls svelte-xmeofi"><select class="svelte-xmeofi">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button${attr("disabled", loading, true)} class="svelte-xmeofi">${escape_html("Load Test Data")}</button></div> <p class="help svelte-xmeofi">Load example data to explore the visualization features.</p></div> <div class="option svelte-xmeofi"><h3 class="svelte-xmeofi">Load from URL</h3> <div class="url-input svelte-xmeofi"><input type="url"${attr("value", dataUrl)} placeholder="Enter JSON file URL..."${attr("disabled", loading, true)} class="svelte-xmeofi"/> <button${attr("disabled", !dataUrl.trim(), true)} class="svelte-xmeofi">Load</button></div> <p class="help svelte-xmeofi">Load GARD results from a remote JSON file.</p></div> <div class="option svelte-xmeofi"><h3 class="svelte-xmeofi">Upload File</h3> <input type="file" accept=".json,.gz"${attr("disabled", loading, true)} class="svelte-xmeofi"/> <p class="help svelte-xmeofi">Upload a local GARD JSON file from your computer.</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-xmeofi"><h3>No Data Loaded</h3> <p>Please load GARD analysis data using one of the options above to see the visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-xmeofi"><h2 class="svelte-xmeofi">About GARD</h2> <h3 class="svelte-xmeofi">What is GARD?</h3> <p><strong>GARD (Genetic Algorithm for Recombination Detection)</strong> is a method for 
      detecting recombination breakpoints in nucleotide sequence alignments. It uses genetic 
      algorithms to search for the optimal placement of breakpoints that best explain 
      phylogenetic incongruence in the data.</p> <h3 class="svelte-xmeofi">Key Features</h3> <ul class="svelte-xmeofi"><li class="svelte-xmeofi"><strong>Genetic algorithm:</strong> Uses GA optimization for breakpoint detection</li> <li class="svelte-xmeofi"><strong>Model selection:</strong> Compares models with and without recombination</li> <li class="svelte-xmeofi"><strong>Breakpoint mapping:</strong> Identifies precise locations of recombination events</li> <li class="svelte-xmeofi"><strong>Statistical testing:</strong> Provides significance tests for recombination</li> <li class="svelte-xmeofi"><strong>Multiple breakpoints:</strong> Can detect multiple recombination events</li></ul> <h3 class="svelte-xmeofi">Interpretation</h3> <ul class="svelte-xmeofi"><li class="svelte-xmeofi"><strong>Breakpoint position:</strong> Location where recombination occurred</li> <li class="svelte-xmeofi"><strong>Support values:</strong> Statistical support for each breakpoint</li> <li class="svelte-xmeofi"><strong>Confidence intervals:</strong> Uncertainty in breakpoint positions</li> <li class="svelte-xmeofi"><strong>p-value &lt; 0.05:</strong> Significant evidence for recombination</li> <li class="svelte-xmeofi"><strong>Model improvement:</strong> Better fit with recombination model</li></ul> <h3 class="svelte-xmeofi">Using This Component</h3> <pre class="svelte-xmeofi"><code class="svelte-xmeofi">import { GardVisualization } from 'hyphy-scope';

&lt;GardVisualization data={gardResults} /></code></pre> <h3 class="svelte-xmeofi">Data Format</h3> <p>The component expects GARD analysis results in JSON format with the following structure:</p> <ul class="svelte-xmeofi"><li class="svelte-xmeofi"><code class="svelte-xmeofi">breakpoints</code> - Array of detected breakpoint locations</li> <li class="svelte-xmeofi"><code class="svelte-xmeofi">p-value</code> - Overall significance of recombination detection</li> <li class="svelte-xmeofi"><code class="svelte-xmeofi">recombinants</code> - Information about recombinant sequences</li> <li class="svelte-xmeofi"><code class="svelte-xmeofi">input</code> - Input parameters (sequences, sites)</li></ul> <h3 class="svelte-xmeofi">Applications</h3> <ul class="svelte-xmeofi"><li class="svelte-xmeofi"><strong>Viral evolution:</strong> Detect recombination in viral genomes</li> <li class="svelte-xmeofi"><strong>Population genetics:</strong> Identify recombination hotspots</li> <li class="svelte-xmeofi"><strong>Phylogenetic analysis:</strong> Account for recombination in tree construction</li> <li class="svelte-xmeofi"><strong>HIV research:</strong> Study recombination in HIV sequences</li> <li class="svelte-xmeofi"><strong>Bacterial genomics:</strong> Detect horizontal gene transfer events</li></ul> <h3 class="svelte-xmeofi">Method Comparison</h3> <p>GARD differs from other recombination detection methods:</p> <ul class="svelte-xmeofi"><li class="svelte-xmeofi"><strong>Model-based:</strong> Uses maximum likelihood framework</li> <li class="svelte-xmeofi"><strong>GA optimization:</strong> Efficient search through breakpoint space</li> <li class="svelte-xmeofi"><strong>Multiple breakpoints:</strong> Can handle complex recombination patterns</li> <li class="svelte-xmeofi"><strong>Statistical rigor:</strong> Provides formal hypothesis testing</li> <li class="svelte-xmeofi"><strong>HyPhy integration:</strong> Seamlessly works with other HyPhy analyses</li></ul> <h3 class="svelte-xmeofi">Workflow Integration</h3> <p>GARD is often used as a preliminary step:</p> <ul class="svelte-xmeofi"><li class="svelte-xmeofi"><strong>Before selection analysis:</strong> Detect recombination first</li> <li class="svelte-xmeofi"><strong>Data partitioning:</strong> Analyze non-recombinant segments separately</li> <li class="svelte-xmeofi"><strong>Model selection:</strong> Choose appropriate evolutionary models</li> <li class="svelte-xmeofi"><strong>Quality control:</strong> Identify problematic sequences or regions</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

import { y as head, F as maybe_selected, v as pop, t as push } from "../../../chunks/index.js";
/* empty css                                                              */
import "@observablehq/plot";
import { a as attr } from "../../../chunks/attributes.js";
import { h as html } from "../../../chunks/html.js";
function _page($$payload, $$props) {
  push();
  let selectedTestData = "meme";
  let jsonUrl = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>MEME Visualization - HyPhy Scope</title>`;
    $$payload2.out.push(`<meta name="description" content="Interactive MEME (Mixed Effects Model of Evolution) analysis visualization"/>`);
  });
  $$payload.out.push(`<div class="meme-demo svelte-tshmbw"><div class="header svelte-tshmbw"><h1 class="svelte-tshmbw">MEME Analysis Visualization</h1> <p class="svelte-tshmbw">Interactive visualization for Mixed Effects Model of Evolution (MEME) analysis results from HyPhy.</p></div> <div class="data-loading svelte-tshmbw"><h2>Load Data</h2> <div class="loading-options svelte-tshmbw"><div class="option svelte-tshmbw"><h3 class="svelte-tshmbw">Upload File</h3> <input type="file" accept=".json" class="svelte-tshmbw"/> <p class="help svelte-tshmbw">Select a HyPhy MEME results JSON file</p></div> <div class="option svelte-tshmbw"><h3 class="svelte-tshmbw">Load from URL</h3> <div class="url-input svelte-tshmbw"><input type="url" placeholder="https://example.com/results.json"${attr("value", jsonUrl)} class="svelte-tshmbw"/> <button${attr("disabled", !jsonUrl.trim(), true)} class="svelte-tshmbw">Load</button></div> <p class="help svelte-tshmbw">Enter a URL to a publicly accessible JSON file</p></div> <div class="option svelte-tshmbw"><h3 class="svelte-tshmbw">Test Data</h3> <div class="test-data-controls svelte-tshmbw"><select class="svelte-tshmbw">`);
  $$payload.select_value = selectedTestData;
  $$payload.out.push(`<option value="meme"${maybe_selected($$payload, "meme")}>MEME</option><option value="fel"${maybe_selected($$payload, "fel")}>FEL</option><option value="slac"${maybe_selected($$payload, "slac")}>SLAC</option><option value="busted"${maybe_selected($$payload, "busted")}>BUSTED</option><option value="absrel"${maybe_selected($$payload, "absrel")}>aBSREL</option><option value="relax"${maybe_selected($$payload, "relax")}>RELAX</option><option value="bgm"${maybe_selected($$payload, "bgm")}>BGM</option><option value="fade"${maybe_selected($$payload, "fade")}>FADE</option><option value="gard"${maybe_selected($$payload, "gard")}>GARD</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select> <button class="svelte-tshmbw">Load Test Data</button></div> <p class="help svelte-tshmbw">Select from available test datasets</p></div></div> `);
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
      $$payload.out.push(`<div class="no-data svelte-tshmbw"><p>Please load MEME analysis data to begin visualization.</p></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <div class="usage-info svelte-tshmbw"><h2 class="svelte-tshmbw">Usage</h2> <h3 class="svelte-tshmbw">As a Component</h3> <pre class="svelte-tshmbw"><code class="svelte-tshmbw">${html(`&lt;script&gt;
  import { MemeVisualization } from 'hyphy-scope';
  
  let data = null;
  
  // Load your data
  onMount(async () => {
    data = await loadDataFromUrl(params.json) ||
           loadDataFromStorage(params.id) ||
           defaultData;
  });
&lt;/script&gt;

&lt;MemeVisualization {data} /&gt;`)}</code></pre> <h3 class="svelte-tshmbw">Features</h3> <ul class="svelte-tshmbw"><li class="svelte-tshmbw">Multiple plot types: p-values, site rates, density plots, Bayes factors</li> <li class="svelte-tshmbw">Interactive controls for p-value thresholds</li> <li class="svelte-tshmbw">Site classification filtering</li> <li class="svelte-tshmbw">Detailed results table with episodic selection analysis</li> <li class="svelte-tshmbw">Summary statistics and tile visualization</li> <li class="svelte-tshmbw">Support for parametric bootstrap and asymptotic tests</li></ul> <h3 class="svelte-tshmbw">MEME Method</h3> <p>MEME (Mixed Effects Model of Evolution) identifies sites that have experienced <strong>episodic diversifying selection</strong>. Unlike methods that assume selection 
      affects all branches uniformly, MEME allows for different selective pressures on 
      different branches at the same site.</p> <h3 class="svelte-tshmbw">Key Features</h3> <ul class="svelte-tshmbw"><li class="svelte-tshmbw"><strong>Episodic Selection:</strong> Detects selection that affects only some lineages</li> <li class="svelte-tshmbw"><strong>Two Rate Classes:</strong> β- (constrained) and β+ (unconstrained) rates</li> <li class="svelte-tshmbw"><strong>Branch-Site Model:</strong> Different branches can have different selection pressures</li> <li class="svelte-tshmbw"><strong>Statistical Testing:</strong> LRT with parametric bootstrap or asymptotic approximation</li></ul></div></div>`);
  pop();
}
export {
  _page as default
};

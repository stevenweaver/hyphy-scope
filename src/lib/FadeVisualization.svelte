<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  $: summary = data ? getFadeSummary(data) : null;
  $: biasData = data ? getBiasData(data) : [];

  let biasContainer: HTMLDivElement;

  function getFadeSummary(data: any) {
    const testResults = data['test results'] || {};
    return {
      sequences: data.input?.sequences || 0,
      sites: data.input?.sites || 0,
      partitions: Object.keys(data['data partitions'] || {}).length,
      pValue: testResults['p-value'] || 1,
      lrt: testResults.LRT || 0,
      hasDirectionalBias: (testResults['p-value'] || 1) <= 0.05
    };
  }

  function getBiasData(data: any) {
    // Simplified bias data extraction
    const branchAttrs = data['branch attributes'] || {};
    const biases = [];
    
    Object.entries(branchAttrs).forEach(([branch, attrs]: [string, any]) => {
      if (attrs && attrs.bias) {
        biases.push({
          branch,
          bias: attrs.bias,
          direction: attrs.bias > 0 ? 'Positive' : 'Negative'
        });
      }
    });
    
    return biases;
  }

  function createBiasPlot(data: any[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Directional Selection Bias",
      width: 800,
      height: 300,
      x: { label: "Branch", type: "band" },
      y: { label: "Bias Score", grid: true },
      color: { legend: true },
      marks: [
        Plot.ruleY([0], { stroke: "#666", strokeDasharray: "3,3" }),
        Plot.barY(data, {
          x: "branch",
          y: "bias",
          fill: "direction",
          title: d => `${d.branch}\nBias: ${d.bias.toFixed(3)}\nDirection: ${d.direction}`
        })
      ]
    });
  }

  onMount(() => {
    if (biasData.length > 0) {
      renderPlots();
    }
  });

  $: if (biasData.length > 0) {
    renderPlots();
  }

  function renderPlots() {
    if (biasContainer) {
      const plot = createBiasPlot(biasData);
      if (plot) {
        biasContainer.innerHTML = '';
        biasContainer.appendChild(plot);
      }
    }
  }
</script>

<div class="fade-visualization">
  {#if !data}
    <div class="loading">Loading FADE data...</div>
  {:else}
    <div class="analysis-info">
      <h2>FADE Analysis Results</h2>
      <p><strong>FUBAR Approach to Directional Evolution</strong> tests for directional selection toward specific amino acids.</p>
    </div>

    {#if summary}
      <div class="summary-tiles">
        <div class="tile">
          <div class="tile-number">{summary.sequences}</div>
          <div class="tile-description">Sequences</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.sites}</div>
          <div class="tile-description">Sites</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.hasDirectionalBias ? '#e3243b' : '#666'}">
            {summary.pValue.toExponential(3)}
          </div>
          <div class="tile-description">p-value</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.hasDirectionalBias ? '#e3243b' : '#666'}">
            {summary.hasDirectionalBias ? 'YES' : 'NO'}
          </div>
          <div class="tile-description">Directional Bias</div>
        </div>
      </div>
    {/if}

    <div class="plot-section">
      <h3>Directional Selection Bias</h3>
      <div class="plot-container" bind:this={biasContainer}></div>
    </div>

    <div class="citation">
      <h3>Citation</h3>
      <code>Kosakovsky Pond SL, Poon AFY, Leigh Brown AJ, Frost SDW. A maximum likelihood method for detecting directional evolution in protein sequences and its application to influenza A virus. Mol Biol Evol. 2008;25(9):1809-24.</code>
    </div>
  {/if}
</div>

<style>
  .fade-visualization {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .summary-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .tile {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    text-align: center;
  }

  .tile-number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .tile-description {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .analysis-info {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    border-left: 4px solid #fd7e14;
  }

  .plot-section {
    margin-bottom: 2rem;
  }

  .plot-container {
    min-height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
  }

  .citation {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;
  }

  .citation code {
    background: #f4f4f4;
    padding: 1rem;
    border-radius: 4px;
    display: block;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  h2, h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }
</style>
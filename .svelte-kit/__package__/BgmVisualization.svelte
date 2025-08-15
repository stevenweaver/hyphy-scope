<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  // Simple BGM visualization focused on key results
  $: summary = data ? getBgmSummary(data) : null;
  $: correlationData = data ? getCorrelationData(data) : [];

  let correlationContainer: HTMLDivElement;

  function getBgmSummary(data: any) {
    const testResults = data['test results'] || {};
    return {
      sequences: data.input?.sequences || 0,
      sites: data.input?.sites || 0,
      partitions: Object.keys(data['data partitions'] || {}).length,
      correlations: Object.keys(testResults).length,
      significantCorrelations: Object.values(testResults).filter((r: any) => (r['p-value'] || 1) <= 0.05).length
    };
  }

  function getCorrelationData(data: any) {
    const testResults = data['test results'] || {};
    return Object.entries(testResults).map(([pair, result]: [string, any]) => ({
      pair,
      correlation: result.correlation || 0,
      pValue: result['p-value'] || 1,
      significant: (result['p-value'] || 1) <= 0.05
    }));
  }

  function createCorrelationPlot(data: any[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Site-to-Site Correlations",
      width: 800,
      height: 400,
      x: { label: "Site Pair", type: "band" },
      y: { label: "Correlation Coefficient", grid: true },
      color: { legend: true },
      marks: [
        Plot.ruleY([0], { stroke: "#666", strokeDasharray: "3,3" }),
        Plot.barY(data, {
          x: "pair",
          y: "correlation",
          fill: "significant",
          title: d => `${d.pair}\nCorrelation: ${d.correlation.toFixed(3)}\np-value: ${d.pValue.toFixed(4)}`
        })
      ]
    });
  }

  onMount(() => {
    if (correlationData.length > 0) {
      renderPlots();
    }
  });

  $: if (correlationData.length > 0) {
    renderPlots();
  }

  function renderPlots() {
    if (correlationContainer) {
      const plot = createCorrelationPlot(correlationData);
      if (plot) {
        correlationContainer.innerHTML = '';
        correlationContainer.appendChild(plot);
      }
    }
  }
</script>

<div class="bgm-visualization">
  {#if !data}
    <div class="loading">Loading BGM data...</div>
  {:else}
    <div class="analysis-info">
      <h2>BGM Analysis Results</h2>
      <p><strong>Bayesian Graphical Model</strong> for detecting correlated evolution between sites.</p>
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
          <div class="tile-number">{summary.correlations}</div>
          <div class="tile-description">Tested Pairs</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: #e3243b">
            {summary.significantCorrelations}
          </div>
          <div class="tile-description">Significant Correlations</div>
        </div>
      </div>
    {/if}

    <div class="plot-section">
      <h3>Site Correlations</h3>
      <div class="plot-container" bind:this={correlationContainer}></div>
    </div>

    <div class="citation">
      <h3>Citation</h3>
      <code>Poon AFY, Lewis FI, Pond SLK, Frost SDW. An evolutionary-network model reveals stratified interactions in the V3 loop of the HIV-1 envelope. PLoS Comput Biol. 2007;3(11):e231.</code>
    </div>
  {/if}
</div>

<style>
  .bgm-visualization {
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
    border-left: 4px solid #6f42c1;
  }

  .plot-section {
    margin-bottom: 2rem;
  }

  .plot-container {
    min-height: 400px;
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
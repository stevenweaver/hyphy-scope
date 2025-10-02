<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  // Simple BGM visualization focused on key results
  $: summary = data ? getBgmSummary(data) : null;
  $: correlationData = data ? getCorrelationData(data) : [];

  let correlationContainer: HTMLDivElement;

  function getBgmSummary(data: any) {
    // BGM data has MLE.content array instead of test results object
    const mleContent = data.MLE?.content || [];
    const significantThreshold = 0.5; // P[Site 1 <-> Site 2] > 0.5 for meaningful dependency
    
    // Validate data structure
    if (!Array.isArray(mleContent)) {
      console.warn('BGM data MLE.content is not an array');
      return null;
    }
    
    return {
      sequences: data.input?.['number of sequences'] || 0,
      sites: data.input?.['number of sites'] || 0,
      partitions: Object.keys(data['data partitions'] || {}).length,
      correlations: mleContent.length,
      significantCorrelations: mleContent.filter((row: any[]) => Array.isArray(row) && row.length > 4 && (row[4] || 0) > significantThreshold).length
    };
  }

  function getCorrelationData(data: any) {
    // BGM MLE content structure:
    // [0]: Site 1 index
    // [1]: Site 2 index
    // [2]: P[Site 1 -> Site 2]
    // [3]: P[Site 2 -> Site 1]
    // [4]: P[Site 1 <-> Site 2] (bidirectional probability)
    // [5]: Site 1 subs
    // [6]: Site 2 subs
    // [7]: Shared subs
    const mleContent = data.MLE?.content || [];
    
    // Validate data structure
    if (!Array.isArray(mleContent)) {
      console.warn('BGM data MLE.content is not an array');
      return [];
    }
    
    // Filter valid rows and sort by bidirectional probability
    const validRows = mleContent.filter((row: any[]) => Array.isArray(row) && row.length > 4);
    const sortedData = validRows
      .sort((a: any[], b: any[]) => (b[4] || 0) - (a[4] || 0))
      .slice(0, 50);
    
    return sortedData.map((row: any[]) => ({
      pair: `${row[0]}-${row[1]}`,
      correlation: row[4] || 0, // Using bidirectional probability as correlation strength
      pValue: 1 - (row[4] || 0), // Convert probability to pseudo p-value for visualization
      significant: (row[4] || 0) > 0.5 // Meaningful dependency threshold
    }));
  }

  function createCorrelationPlot(data: any[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Site-to-Site Conditional Dependencies (Top 50)",
      width: 800,
      height: 400,
      x: { label: "Site Pair", type: "band", tickRotate: -45 },
      y: { label: "P[Site 1 ↔ Site 2]", grid: true, domain: [0, 1] },
      color: { 
        legend: true,
        domain: [false, true],
        range: ["#6c757d", "#e3243b"],
        label: "Significant (P > 0.5)"
      },
      marks: [
        Plot.ruleY([0.5], { stroke: "#e3243b", strokeDasharray: "3,3", strokeWidth: 2 }),
        Plot.barY(data, {
          x: "pair",
          y: "correlation",
          fill: "significant",
          title: d => `Sites ${d.pair}\nP[dependency]: ${d.correlation.toFixed(4)}\nSignificant: ${d.significant ? 'Yes' : 'No'}`
        })
      ]
    });
  }

  // Initialize plots when data is available and component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  $: if (mounted && correlationData.length > 0) {
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
      <h3>Conditional Dependencies Between Sites</h3>
      <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0 1rem 0;">
        Posterior probabilities of conditional dependence between codon sites. 
        Values > 0.5 indicate meaningful evidence for co-evolution.
      </p>
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
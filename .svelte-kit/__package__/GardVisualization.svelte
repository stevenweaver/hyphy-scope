<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  $: summary = data ? getGardSummary(data) : null;
  $: breakpointData = data ? getBreakpointData(data) : [];

  let breakpointContainer: HTMLDivElement;

  function getGardSummary(data: any) {
    const breakpoints = data.breakpoints || [];
    return {
      sequences: data.input?.sequences || 0,
      sites: data.input?.sites || 0,
      breakpoints: breakpoints.length,
      recombinants: data.recombinants?.length || 0,
      pValue: data['p-value'] || 1,
      hasRecombination: (data['p-value'] || 1) <= 0.05
    };
  }

  function getBreakpointData(data: any) {
    const breakpoints = data.breakpoints || [];
    return breakpoints.map((bp: any, index: number) => ({
      id: index + 1,
      position: bp.position || 0,
      support: bp.support || 0,
      confidence: bp.confidence || 0
    }));
  }

  function createBreakpointPlot(data: any[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Recombination Breakpoints",
      width: 800,
      height: 300,
      x: { label: "Sequence Position", grid: true },
      y: { label: "Support", grid: true },
      marks: [
        Plot.dot(data, {
          x: "position",
          y: "support",
          r: 6,
          fill: "#e3243b",
          title: d => `Breakpoint ${d.id}\nPosition: ${d.position}\nSupport: ${d.support.toFixed(3)}\nConfidence: ${d.confidence.toFixed(3)}`
        }),
        Plot.ruleX(data, {
          x: "position",
          stroke: "#e3243b",
          strokeDasharray: "2,2",
          strokeOpacity: 0.5
        })
      ]
    });
  }

  // Initialize plots when data is available and component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  $: if (mounted && breakpointData.length > 0) {
    renderPlots();
  }

  function renderPlots() {
    if (breakpointContainer) {
      const plot = createBreakpointPlot(breakpointData);
      if (plot) {
        breakpointContainer.innerHTML = '';
        breakpointContainer.appendChild(plot);
      }
    }
  }
</script>

<div class="gard-visualization">
  {#if !data}
    <div class="loading">Loading GARD data...</div>
  {:else}
    <div class="analysis-info">
      <h2>GARD Analysis Results</h2>
      <p><strong>Genetic Algorithm for Recombination Detection</strong> identifies recombination breakpoints in alignments.</p>
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
          <div class="tile-number" style="color: #e3243b">
            {summary.breakpoints}
          </div>
          <div class="tile-description">Breakpoints</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.hasRecombination ? '#e3243b' : '#666'}">
            {summary.hasRecombination ? 'YES' : 'NO'}
          </div>
          <div class="tile-description">Recombination</div>
        </div>
      </div>
    {/if}

    <div class="plot-section">
      <h3>Breakpoint Locations</h3>
      <div class="plot-container" bind:this={breakpointContainer}></div>
    </div>

    <div class="citation">
      <h3>Citation</h3>
      <code>Kosakovsky Pond SL, Posada D, Gravenor MB, Woelk CH, Frost SDW. GARD: a genetic algorithm for recombination detection. Bioinformatics. 2006;22(24):3096-8.</code>
    </div>
  {/if}
</div>

<style>
  .gard-visualization {
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
    border-left: 4px solid #20c997;
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
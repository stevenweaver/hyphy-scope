<script lang="ts">
  import { onMount } from 'svelte';
  import * as _ from 'lodash-es';
  import * as Plot from '@observablehq/plot';
  // Define constants and interfaces locally
  const COLORS = {
    'Diversifying': '#e74c3c',
    'Neutral': '#95a5a6', 
    'Purifying': '#3498db',
    'Invariable': '#ecf0f1'
  };

  interface SiteData {
    codon: number;
    alpha: number;
    beta: number;
    'p-value': number;
    'dN/dS MLE': number;
    LRT: number;
    class: string;
  }

  // Duplicate utility functions locally
  function getFelAttributes(data: any) {
    return {
      numberOfSites: data?.MLE?.content?.["0"]?.length || 0,
      numberOfBranches: Object.keys(data?.MLE?.content || {}).length
    };
  }

  function getFelTileSpecs(data: any, pValue: number) {
    if (!data?.MLE?.content?.["0"]) return [];
    
    const sites = data.MLE.content["0"];
    let diversifying = 0, neutral = 0, purifying = 0, invariable = 0;
    
    sites.forEach((site: any[]) => {
      const pVal = site[4] || 1;
      const omega = site[2] || 1;
      
      if (pVal <= pValue) {
        if (omega > 1) diversifying++;
        else if (omega < 1) purifying++;
        else neutral++;
      } else {
        invariable++;
      }
    });

    return [
      { number: sites.length, description: "Total sites" },
      { number: diversifying, description: "Diversifying", color: COLORS['Diversifying'] },
      { number: purifying, description: "Purifying", color: COLORS['Purifying'] }, 
      { number: neutral, description: "Neutral", color: COLORS['Neutral'] },
      { number: invariable, description: "Invariable", color: COLORS['Invariable'] }
    ];
  }

  function getFelSiteTableData(data: any, pValue: number): [SiteData[], any[], any] {
    if (!data?.MLE?.content?.["0"]) return [[], [], {}];
    
    const sites = data.MLE.content["0"];
    const processedSites: SiteData[] = sites.map((site: any[], index: number) => {
      const pVal = site[4] || 1;
      const omega = site[2] || 1;
      let classification = 'Invariable';
      
      if (pVal <= pValue) {
        if (omega > 1) classification = 'Diversifying';
        else if (omega < 1) classification = 'Purifying';
        else classification = 'Neutral';
      }
      
      return {
        codon: index + 1,
        alpha: site[0] || 0,
        beta: site[1] || 0,
        'p-value': pVal,
        'dN/dS MLE': omega,
        LRT: site[3] || 0,
        class: classification
      };
    });

    return [processedSites, [], {}];
  }

  export let data: any = null;

  let attributes: any = {};
  let sitesTable: [SiteData[], any[], any] = [[], [], {}];
  let tileSpecs: any[] = [];
  let plotContainer: HTMLElement;

  $: if (data) {
    processData();
  }

  function processData() {
    if (!data?.MLE) return;

    attributes = getFelAttributes(data);
    sitesTable = getFelSiteTableData(data, 0.1);
    tileSpecs = getFelTileSpecs(data, 0.1);
    updatePlot();
  }

  function updatePlot() {
    if (!plotContainer || !sitesTable[0].length) return;
    
    plotContainer.innerHTML = '';
    
    try {
      // Simple scatter plot
      const plot = Plot.plot({
        width: 600,
        height: 300,
        marks: [
          Plot.dot(sitesTable[0], {
            x: "codon",
            y: "dN/dS MLE",
            fill: "class",
            tip: true
          }),
          Plot.ruleY([1], { stroke: "gray", strokeDasharray: "2,2" })
        ],
        color: {
          domain: Object.keys(COLORS),
          range: Object.values(COLORS)
        }
      });
      
      plotContainer.appendChild(plot);
    } catch (error) {
      console.error('Plot error:', error);
      plotContainer.innerHTML = '<p>Error creating plot</p>';
    }
  }
</script>

<div class="fel-visualization">
  {#if !data}
    <p>No data loaded</p>
  {:else}
    <h2>FEL Analysis Results</h2>
    
    <!-- Summary -->
    <div class="summary">
      <p>Analysis includes {attributes.numberOfSites} sites with {tileSpecs[6]?.number || 0} under positive selection.</p>
    </div>

    <!-- Simple plot -->
    <div class="plot-section">
      <h3>dN/dS by Codon Position</h3>
      <div bind:this={plotContainer} class="plot-container"></div>
    </div>

    <!-- Simple table -->
    <div class="table-section">
      <h3>Site Results (first 10)</h3>
      <table>
        <thead>
          <tr>
            <th>Codon</th>
            <th>dN/dS</th>
            <th>p-value</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {#each sitesTable[0].slice(0, 10) as row}
            <tr>
              <td>{row.codon}</td>
              <td>{row['dN/dS MLE'].toFixed(3)}</td>
              <td>{row['p-value'].toFixed(4)}</td>
              <td style="color: {COLORS[row.class]}">{row.class}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .fel-visualization {
    padding: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .summary {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .plot-container {
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 4px;
    min-height: 300px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 0.5rem;
    text-align: left;
  }

  th {
    background: #f8f9fa;
  }

  h2, h3 {
    color: #333;
  }
</style>
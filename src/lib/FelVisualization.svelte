<script lang="ts">
  import { onMount } from 'svelte';
  import * as _ from 'lodash-es';
  import { 
    getFelAttributes, 
    getFelTileSpecs, 
    getFelSiteTableData,
    COLORS,
    type SiteData
  } from './utils/fel-utils.js';
  import { 
    getFelPlotOptions,
    getFelPlotDescription,
    createFelPlot
  } from './utils/fel-plots.js';

  export let data: any = null;
  export let pvalueThreshold: number = 0.1;
  export let showColumns: string[] = ["Diversifying", "Purifying", "Neutral", "Invariable"];
  export let plotType: string = "alpha/beta site-level estimates";

  let attributes: any = {};
  let sitesTable: [SiteData[], any[], any] = [[], [], {}];
  let filteredSiteData: SiteData[] = [];
  let tileSpecs: any[] = [];
  let plotDescription: string = "";
  let availablePlotTypes: string[] = [];
  let plotContainer: HTMLElement;

  $: if (data) {
    processData();
  }

  $: if (sitesTable[0].length > 0 && showColumns) {
    const inSet = new Set(filteredSiteData.map(d => d.codon));
    filteredSiteData = sitesTable[0].filter(x => 
      showColumns.includes(x.class) && (!filteredSiteData.length || inSet.has(x.codon))
    );
    updatePlot();
  }

  $: if (pvalueThreshold !== undefined) {
    processData();
  }

  $: if (plotType && filteredSiteData.length > 0) {
    updatePlot();
  }

  function processData() {
    if (!data?.MLE) return;

    attributes = getFelAttributes(data);
    sitesTable = getFelSiteTableData(data, pvalueThreshold);
    tileSpecs = getFelTileSpecs(data, pvalueThreshold);
    
    const plotOptions = getFelPlotOptions(attributes.hasPasmt);
    availablePlotTypes = plotOptions
      .filter(option => option.available(data))
      .map(option => option.label);
    
    if (!availablePlotTypes.includes(plotType) && availablePlotTypes.length > 0) {
      plotType = availablePlotTypes[0];
    }

    filteredSiteData = sitesTable[0].filter(x => showColumns.includes(x.class));
    updatePlot();
  }

  function updatePlot() {
    if (!data || !plotType || filteredSiteData.length === 0 || !plotContainer) return;
    
    plotDescription = getFelPlotDescription(plotType, pvalueThreshold);
    
    // Clear previous plot
    plotContainer.innerHTML = '';
    
    try {
      const plot = createFelPlot(plotType, filteredSiteData, pvalueThreshold);
      if (plot) {
        plotContainer.appendChild(plot);
      }
    } catch (error) {
      console.error('Error creating plot:', error);
      plotContainer.innerHTML = '<p class="error">Error rendering plot</p>';
    }
  }

  function formatValue(value: any, formatter: (v: any) => any): string {
    if (typeof formatter === 'function') {
      const result = formatter(value);
      return typeof result === 'string' ? result : String(result);
    }
    return String(value);
  }
</script>

<div class="fel-visualization">
  {#if !data}
    <div class="loading">
      <p>Loading FEL data...</p>
    </div>
  {:else}
    <!-- Summary tiles -->
    <div class="summary-tiles">
      {#each tileSpecs as tile}
        <div class="tile" style="border-left: 4px solid var(--color-{tile.color}, #ccc)">
          <div class="tile-number">{tile.number}</div>
          <div class="tile-description">{tile.description}</div>
        </div>
      {/each}
    </div>

    <!-- Analysis description -->
    <div class="analysis-info">
      <p>
        Statistical significance is evaluated based on 
        {#if data.simulated}
          <code>{data.simulated}</code> site-level parametric bootstrap replicates
        {:else}
          the asymptotic chi-squared distribution
        {/if}.
        This analysis <strong>{attributes.hasBackground ? 'included' : 'does not include'}</strong> 
        site to site synonymous rate variation.
        {#if attributes.hasCi}
          Profile approximate confidence intervals for site-level dN/dS ratios have been computed.
        {/if}
      </p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="pvalue-threshold">p-value threshold:</label>
        <input 
          id="pvalue-threshold"
          type="number" 
          step="0.01" 
          min="0" 
          max="1" 
          bind:value={pvalueThreshold}
        />
      </div>

      <div class="control-group">
        <label>Show classes:</label>
        <div class="checkbox-group">
          {#each Object.keys(COLORS) as className}
            <label class="checkbox-label" style="border-bottom: 2px solid {COLORS[className as keyof typeof COLORS]}">
              <input 
                type="checkbox" 
                bind:group={showColumns} 
                value={className}
              />
              {className}
            </label>
          {/each}
        </div>
      </div>

      <div class="control-group">
        <label for="plot-type">Plot type:</label>
        <select id="plot-type" bind:value={plotType}>
          {#each availablePlotTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Plot -->
    {#if filteredSiteData.length > 0}
      <div class="plot-section">
        <h3>Figure 1</h3>
        <p class="plot-description">{plotDescription}</p>
        <div 
          class="plot-container"
          bind:this={plotContainer}
        ></div>
      </div>
    {/if}

    <!-- Results table -->
    <div class="table-section">
      <h3>Table 1</h3>
      <p class="table-description">Detailed site-by-site results from the FEL analysis</p>
      
      {#if filteredSiteData.length > 0}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                {#each sitesTable[1] as [key, description]}
                  <th title={description}>{key}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each filteredSiteData.slice(0, 50) as row}
                <tr>
                  {#each sitesTable[1] as [key]}
                    <td>
                      {@html formatValue(row[key], sitesTable[2][key])}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
          
          {#if filteredSiteData.length > 50}
            <p class="table-note">Showing first 50 of {filteredSiteData.length} results</p>
          {/if}
        </div>
      {:else}
        <p>No data to display with current filters.</p>
      {/if}
    </div>

    <!-- Citation -->
    <div class="citation">
      <h3>Suggested Citation</h3>
      <p><code>{data.analysis.citation}</code></p>
    </div>
  {/if}
</div>

<style>
  .fel-visualization {
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
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .tile {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 2rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-group label {
    font-weight: 500;
    color: #333;
  }

  .checkbox-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    margin-bottom: -2px;
    text-transform: capitalize;
  }

  .plot-section, .table-section {
    margin-bottom: 2rem;
  }

  .plot-description, .table-description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1rem;
  }

  .plot-container {
    min-height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
  }

  .table-container {
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
  }

  th {
    background: #f8f9fa;
    font-weight: 500;
    position: sticky;
    top: 0;
  }

  .table-note {
    padding: 0.5rem;
    background: #f8f9fa;
    font-size: 0.8rem;
    color: #666;
    margin: 0;
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

  .error {
    color: #e74c3c;
    text-align: center;
    padding: 1rem;
  }

  h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  input[type="number"], select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  :global(.plot-container svg) {
    max-width: 100%;
    height: auto;
  }
</style>
<script lang="ts">
  import * as _ from 'lodash-es';
  import { 
    getMemeAttributes, 
    getMemeTileSpecs, 
    getMemeSiteTableData,
    getMemeCountSitesByPvalue,
    getMemePosteriorsPerBranchSite,
    MEME_COLORS,
    type MemeSiteData
  } from './utils/meme-utils.js';
  import { 
    getMemePlotOptions,
    getMemePlotDescription,
    createMemePlot
  } from './utils/meme-plots.js';

  export let data: any = null;
  export let pvalueThreshold: number = 0.1;
  export let showColumns: string[] = ["Diversifying", "Neutral", "Invariable"];
  export let plotType: string = "p-values for selection";

  let attributes: any = {};
  let sitesTable: [MemeSiteData[], any[], any] = [[], [], {}];
  let filteredSiteData: MemeSiteData[] = [];
  let tileSpecs: any[] = [];
  let plotDescription: string = "";
  let availablePlotTypes: string[] = [];
  let plotContainer: HTMLElement;
  let countSites: number = 0;
  let bsPositiveSelection: any[] = [];

  // Helper function for color lookup
  function getMemeColorForClass(className: string): string {
    return MEME_COLORS[className as keyof typeof MEME_COLORS] || '#000000';
  }

  // Main data processing reactive statement
  $: if (data && pvalueThreshold !== undefined) {
    processData();
  }

  // Filter data when sitesTable or showColumns change
  $: {
    if (sitesTable && sitesTable[0] && sitesTable[0].length > 0 && showColumns && showColumns.length > 0) {
      const newFilteredData = sitesTable[0].filter(x => showColumns.includes(x.class));
      if (newFilteredData.length !== filteredSiteData.length || 
          !newFilteredData.every((item, index) => item === filteredSiteData[index])) {
        filteredSiteData = newFilteredData;
      }
    }
  }

  // Update plot when ready
  $: {
    if (plotType && filteredSiteData && filteredSiteData.length > 0 && plotContainer) {
      updatePlot();
    }
  }

  function processData() {
    if (!data?.MLE) return;

    attributes = getMemeAttributes(data);
    sitesTable = getMemeSiteTableData(data, pvalueThreshold);
    tileSpecs = getMemeTileSpecs(data, pvalueThreshold);
    countSites = getMemeCountSitesByPvalue(data, pvalueThreshold);
    
    // Get Bayes factor data if available
    try {
      bsPositiveSelection = getMemePosteriorsPerBranchSite(data);
    } catch (e) {
      bsPositiveSelection = [];
    }
    
    const plotOptions = getMemePlotOptions(attributes.hasSiteLRT, attributes.hasResamples, bsPositiveSelection);
    availablePlotTypes = plotOptions
      .filter(option => option.available(data))
      .map(option => option.label);
    
    if (!availablePlotTypes.includes(plotType) && availablePlotTypes.length > 0) {
      plotType = availablePlotTypes[0];
    }
    
    // Filtering will be handled by reactive statement
  }

  function updatePlot() {
    if (!data || !plotType || filteredSiteData.length === 0 || !plotContainer) return;
    
    plotDescription = getMemePlotDescription(plotType, attributes.hasResamples);
    
    // Clear previous plot
    plotContainer.innerHTML = '';
    
    try {
      const plot = createMemePlot(plotType, filteredSiteData, pvalueThreshold, bsPositiveSelection);
      if (plot) {
        plotContainer.appendChild(plot);
      }
    } catch (error) {
      console.error('Error creating plot:', error);
      plotContainer.innerHTML = '<p class="error">Error rendering plot</p>';
    }
  }

  function formatValue(value: any): string {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  }
</script>

<div class="meme-visualization">
  {#if !data}
    <div class="loading">
      <p>Loading MEME data...</p>
    </div>
  {:else}
    <h2>MEME Results Summary</h2>
    
    <!-- Summary description -->
    <div class="analysis-info">
      <p>
        Based on the likelihood ratio test, <strong>episodic diversifying selection</strong> has acted on 
        <strong>{countSites}</strong> sites in this dataset (p≤{pvalueThreshold}).
        {#if attributes.hasResamples > 0}
          This analysis used parametric bootstrap with {attributes.hasResamples} replicates to test for significance.
        {/if}
        {#if +data.analysis.version < 3.0}
          <small><strong>Some of the visualizations are not available for MEME analyses before v3.0</strong></small>
        {/if}
      </p>
    </div>

    <!-- Summary tiles -->
    <div class="summary-tiles">
      {#each tileSpecs as tile}
        <div class="tile" style="border-left: 4px solid var(--color-{tile.color}, #ccc)">
          <div class="tile-number">{tile.number}</div>
          <div class="tile-description">{tile.description}</div>
        </div>
      {/each}
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
          {#each Object.keys(MEME_COLORS) as className}
            <label class="checkbox-label" style="border-bottom: 2px solid {getMemeColorForClass(className)}">
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
      <p class="table-description">Detailed site-by-site results from the MEME analysis</p>
      
      {#if filteredSiteData.length > 0}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Partition</th>
                <th>Codon</th>
                <th>α</th>
                <th>β-</th>
                <th>p-</th>
                <th>β+</th>
                <th>p+</th>
                <th>p-value</th>
                <th>Branches</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredSiteData.slice(0, 50) as row}
                <tr>
                  <td>{row.Partition}</td>
                  <td>{row.Codon}</td>
                  <td>{formatValue(row.alpha)}</td>
                  <td>{formatValue(row["beta-"])}</td>
                  <td>{formatValue(row["p-"])}</td>
                  <td>{formatValue(row["beta+"])}</td>
                  <td>{formatValue(row["p+"])}</td>
                  <td style="font-weight: {row['p-value'] <= pvalueThreshold ? 'bold' : 'normal'}">
                    {formatValue(row["p-value"])}
                  </td>
                  <td>{row.Branches}</td>
                  <td style="color: {MEME_COLORS[row.class]}">{row.class}</td>
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
  .meme-visualization {
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

  .analysis-info {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    border-left: 4px solid #e3243b;
  }

  .summary-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

  h2, h3 {
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
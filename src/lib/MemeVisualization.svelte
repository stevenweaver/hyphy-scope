<script lang="ts">
  import { onMount, tick } from 'svelte';
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
  import PhylogeneticTreeViewer from './PhylogeneticTreeViewer.svelte';

  export let data: any = null;
  export let pvalueThreshold: number = 0.1;
  export let showColumns: string[] = ["Diversifying", "Neutral", "Invariable"];
  export let plotType: string = "p-values for selection";

  // Tree visualization settings
  let treeWidth = 800;
  let treeHeight = 500;

  // Core state
  let attributes: any = {};
  let sitesTable: [MemeSiteData[], any[], any] = [[], [], {}];
  let tileSpecs: any[] = [];
  let plotDescription: string = "";
  let availablePlotTypes: string[] = [];
  let plotContainer: HTMLElement;
  let countSites: number = 0;
  let bsPositiveSelection: any[] = [];
  let dataProcessed = false;

  // Computed data - we'll calculate these explicitly
  let allSiteData: MemeSiteData[] = [];
  let filteredSiteData: MemeSiteData[] = [];

  // Helper function for color lookup
  function getMemeColorForClass(className: string): string {
    return MEME_COLORS[className as keyof typeof MEME_COLORS] || '#000000';
  }

  // Update all computed values
  function updateComputedData() {
    // Get all site data
    allSiteData = sitesTable[0] || [];
    
    // Filter by selected columns
    filteredSiteData = allSiteData.filter(x => showColumns.includes(x.class));
  }

  // Process the main data
  async function processData() {
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
    
    // Update computed data
    updateComputedData();
    
    // Mark data as processed
    dataProcessed = true;
    
    // Force UI update
    await tick();
    
    // Update plot if container is ready
    if (plotContainer) {
      updatePlot();
    }
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

  // Initialize on mount
  onMount(async () => {
    await tick();
    if (data) {
      dataProcessed = false;
      await processData();
    }
  });

  // Reactive updates
  $: if (data && pvalueThreshold !== undefined) {
    dataProcessed = false;
    processData();
  }

  $: if (showColumns && sitesTable[0]?.length > 0) {
    updateComputedData();
    updatePlot();
  }

  $: if (plotType && filteredSiteData.length > 0 && plotContainer) {
    updatePlot();
  }

  function formatValue(value: any, formatter: (v: any) => any): string {
    return formatter ? formatter(value) : String(value);
  }
</script>

<div class="meme-visualization">
  {#if !data}
    <div class="loading">Loading MEME data...</div>
  {:else}
    <!-- Summary Tiles -->
    {#if dataProcessed && tileSpecs.length > 0}
      <div class="summary-tiles">
        {#each tileSpecs as tile}
          <div class="tile">
            <div class="tile-number" style="color: {tile.color || '#333'}">
              {tile.number}
            </div>
            <div class="tile-description">{tile.description}</div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls-section">
      <div class="control-group">
        <label for="pvalue-threshold">p-value threshold:</label>
        <input 
          id="pvalue-threshold"
          type="number" 
          bind:value={pvalueThreshold} 
          min="0" 
          max="1" 
          step="0.01"
        />
      </div>

      <div class="control-group">
        <label for="plot-select">Plot type:</label>
        <select id="plot-select" bind:value={plotType}>
          {#each availablePlotTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <fieldset>
          <legend>Show classes:</legend>
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
        </fieldset>
      </div>
    </div>

    <!-- Plot section -->
    <div class="plot-section">
      <h3>Figure 1</h3>
      <p class="plot-description">{plotDescription}</p>
      <div 
        class="plot-container" 
        bind:this={plotContainer}
      ></div>
    </div>

    <!-- Phylogenetic Tree section -->
    <div class="tree-section">
      <h3>Figure 2</h3>
      <p class="tree-description">Phylogenetic tree used in the MEME analysis. Branches can be colored by evolutionary rates.</p>
      
      <!-- Tree size controls -->
      <div class="tree-controls">
        <div class="tree-control-group">
          <label for="tree-width">Width: {treeWidth}px</label>
          <input 
            id="tree-width"
            type="range" 
            bind:value={treeWidth} 
            min="400" 
            max="1200" 
            step="50"
            class="tree-slider"
          />
        </div>
        <div class="tree-control-group">
          <label for="tree-height">Height: {treeHeight}px</label>
          <input 
            id="tree-height"
            type="range" 
            bind:value={treeHeight} 
            min="300" 
            max="800" 
            step="25"
            class="tree-slider"
          />
        </div>
      </div>

      <PhylogeneticTreeViewer 
        {data} 
        width={treeWidth} 
        height={treeHeight}
        branchLengthProperty="branch length"
        colorBranches="none"
        showLabels={true}
        showScale={true}
        isRadial={false}
        treeIndex={0}
      />
    </div>

    <!-- Results table -->
    <div class="table-section">
      <h3>Table 1</h3>
      <p class="table-description">
        {countSites} sites found to be under positive selection at p ≤ {pvalueThreshold}
      </p>
      
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
              {#each filteredSiteData as row}
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
        </div>
      {:else}
        <p class="no-data">No sites match the current filter criteria.</p>
      {/if}
    </div>

    <!-- Citation -->
    <div class="citation">
      <h3>Citation</h3>
      <code>
        Murrell B, Wertheim JO, Moola S, Weighill T, Scheffler K, Kosakovsky Pond SL. 
        Detecting individual sites subject to episodic diversifying selection. 
        PLoS Genet. 2012;8(7):e1002764. doi:10.1371/journal.pgen.1002764
      </code>
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

  .controls-section {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-group label {
    font-weight: 500;
    color: #333;
  }

  .control-group input[type="number"],
  .control-group select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 3px;
  }

  .checkbox-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    padding-bottom: 2px;
  }

  .plot-section {
    margin-bottom: 2rem;
  }

  .plot-section h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }

  .plot-description {
    margin-bottom: 1rem;
    color: #666;
    font-style: italic;
  }

  .plot-container {
    min-height: 400px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    background: #fff;
    overflow-x: auto;
  }

  .tree-section {
    margin: 2rem 0;
  }

  .tree-description {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .tree-controls {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
    flex-wrap: wrap;
  }

  .tree-control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 200px;
  }

  .tree-control-group label {
    font-weight: 500;
    color: #333;
    font-size: 0.9rem;
  }

  .tree-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #ddd;
    outline: none;
    cursor: pointer;
  }

  .tree-slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .tree-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .table-section {
    margin-bottom: 2rem;
  }

  .table-container {
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: #f8f9fa;
  }

  th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #dee2e6;
  }

  td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #dee2e6;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }

  .no-data {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
  }

  .citation {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #dee2e6;
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
    padding: 2rem;
  }
</style>
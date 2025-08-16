<script lang="ts">
  import { onMount, tick } from 'svelte';
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

  // Core state
  let attributes: any = {};
  let sitesTable: [SiteData[], any[], any] = [[], [], {}];
  let tileSpecs: any[] = [];
  let plotDescription: string = "";
  let availablePlotTypes: string[] = [];
  let plotContainer: HTMLElement;
  
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 50;
  
  // Sorting
  let sortColumn = "Site";
  let sortDirection: "asc" | "desc" = "asc";
  
  // Computed data - we'll calculate these explicitly
  let allSiteData: SiteData[] = [];
  let filteredSiteData: SiteData[] = [];
  let sortedData: SiteData[] = [];
  let paginatedData: SiteData[] = [];
  let totalPages = 0;
  
  // Helper function for color lookup
  function getColorForClass(className: string): string {
    return COLORS[className as keyof typeof COLORS] || '#000000';
  }
  
  // Update all computed values
  function updateComputedData() {
    
    // Get all site data
    allSiteData = sitesTable[0] || [];
    
    // Filter by selected columns
    filteredSiteData = allSiteData.filter(x => showColumns.includes(x.class));
    
    // Sort the filtered data
    sortedData = [...filteredSiteData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    
    // Calculate pagination
    totalPages = Math.ceil(sortedData.length / itemsPerPage);
    paginatedData = sortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    
  }
  
  // Process the main data
  async function processData() {
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
    
    // Update computed data
    updateComputedData();
    
    // Force UI update
    await tick();
    
    // Update plot if container is ready
    if (plotContainer) {
      updatePlot();
    }
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
  
  // Pagination functions
  function goToPage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    updateComputedData();
  }
  
  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      updateComputedData();
    }
  }
  
  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      updateComputedData();
    }
  }
  
  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
    currentPage = 1;
    updateComputedData();
  }
  
  // Initialize on mount
  onMount(async () => {
    await tick();
    if (data) {
      await processData();
    }
  });
  
  // Reactive updates
  $: if (data && pvalueThreshold !== undefined) {
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

<div class="fel-visualization">
  {#if !data}
    <div class="loading">Loading FEL data...</div>
  {:else}
    <!-- Summary Tiles -->
    {#if tileSpecs.length > 0}
      <div class="summary-tiles">
        {#each tileSpecs as tile}
          <div class="tile">
            <div class="tile-number" style="color: {tile.color || '#333'}">
              {tile.value}
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
        <label>Show classes:</label>
        <div class="checkbox-group">
          {#each Object.keys(COLORS) as className}
            <label class="checkbox-label" style="border-bottom: 2px solid {getColorForClass(className)}">
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
                  <th 
                    title={description}
                    class="sortable {sortColumn === key ? 'sorted' : ''}"
                    on:click={() => handleSort(key)}
                  >
                    <span class="header-content">
                      {key}
                      <span class="sort-indicator">
                        {#if sortColumn === key}
                          {sortDirection === "asc" ? "↑" : "↓"}
                        {:else}
                          ↕
                        {/if}
                      </span>
                    </span>
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each paginatedData as row (row.codon)}
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
          
          <!-- Pagination Controls -->
          {#if totalPages > 1}
            <div class="pagination">
              <div class="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
              </div>
              
              <div class="pagination-controls">
                <button 
                  on:click={prevPage} 
                  disabled={currentPage === 1}
                  class="page-btn"
                >
                  Previous
                </button>
                
                {#if totalPages <= 7}
                  {#each Array(totalPages).fill(0) as _, i}
                    <button 
                      on:click={() => goToPage(i + 1)}
                      class="page-btn {currentPage === i + 1 ? 'active' : ''}"
                    >
                      {i + 1}
                    </button>
                  {/each}
                {:else}
                  <button 
                    on:click={() => goToPage(1)}
                    class="page-btn {currentPage === 1 ? 'active' : ''}"
                  >
                    1
                  </button>
                  
                  {#if currentPage > 3}
                    <span class="ellipsis">...</span>
                  {/if}
                  
                  {#each Array(3).fill(0) as _, i}
                    {#if currentPage + i - 1 > 1 && currentPage + i - 1 < totalPages}
                      <button 
                        on:click={() => goToPage(currentPage + i - 1)}
                        class="page-btn {currentPage === currentPage + i - 1 ? 'active' : ''}"
                      >
                        {currentPage + i - 1}
                      </button>
                    {/if}
                  {/each}
                  
                  {#if currentPage < totalPages - 2}
                    <span class="ellipsis">...</span>
                  {/if}
                  
                  <button 
                    on:click={() => goToPage(totalPages)}
                    class="page-btn {currentPage === totalPages ? 'active' : ''}"
                  >
                    {totalPages}
                  </button>
                {/if}
                
                <button 
                  on:click={nextPage} 
                  disabled={currentPage === totalPages}
                  class="page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <p class="no-data">No sites match the current filter criteria.</p>
      {/if}
    </div>

    <!-- Citation -->
    <div class="citation">
      <h3>Citation</h3>
      <code>
        Kosakovsky Pond SL, Frost SDW. Not so different after all: a comparison of methods for detecting amino acid sites under selection. 
        Mol Biol Evol. 2005;22(5):1208-22. doi:10.1093/molbev/msi105
      </code>
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

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    background: #e9ecef;
  }

  th.sorted {
    background: #e3f2fd;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sort-indicator {
    color: #6c757d;
    font-size: 0.875rem;
  }

  td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #dee2e6;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }

  .pagination {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #dee2e6;
  }

  .pagination-info {
    color: #6c757d;
    font-size: 0.875rem;
  }

  .pagination-controls {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .page-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid #dee2e6;
    background: #fff;
    color: #333;
    cursor: pointer;
    border-radius: 3px;
    font-size: 0.875rem;
  }

  .page-btn:hover:not(:disabled) {
    background: #e9ecef;
  }

  .page-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .page-btn.active {
    background: #007bff;
    color: #fff;
    border-color: #007bff;
  }

  .ellipsis {
    padding: 0 0.5rem;
    color: #6c757d;
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
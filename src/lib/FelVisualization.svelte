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
  
  // Pagination variables
  let currentPage = 1;
  let itemsPerPage = 50;
  
  // Sorting variables
  let sortColumn = "Site";
  let sortDirection: "asc" | "desc" = "asc";
  
  $: sortedData = [...filteredSiteData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    // Handle numeric values
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    
    // Handle string values
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === "asc") {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });
  
  $: totalPages = Math.ceil(sortedData.length / itemsPerPage);
  $: paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  function goToPage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }
  
  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }
  
  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
  
  function handleSort(column: string) {
    if (sortColumn === column) {
      // Toggle direction if same column
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      // New column, default to ascending
      sortColumn = column;
      sortDirection = "asc";
    }
    // Reset to first page when sorting changes
    currentPage = 1;
  }

  $: if (data) {
    processData();
  }

  $: if (sitesTable[0].length > 0 && showColumns) {
    const inSet = new Set(filteredSiteData.map(d => d.codon));
    filteredSiteData = sitesTable[0].filter(x => 
      showColumns.includes(x.class) && (!filteredSiteData.length || inSet.has(x.codon))
    );
    currentPage = 1; // Reset to first page when filters change
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
              {#each paginatedData as row}
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
              
              <div class="page-size-control">
                <label for="page-size">Items per page:</label>
                <select id="page-size" bind:value={itemsPerPage} on:change={() => currentPage = 1}>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
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

  th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
  }

  th.sortable:hover {
    background: #e9ecef;
  }

  th.sortable.sorted {
    background: #dee2e6;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-indicator {
    font-size: 0.8rem;
    color: #666;
    opacity: 0.7;
    min-width: 12px;
    text-align: center;
  }

  th.sortable.sorted .sort-indicator {
    color: #333;
    opacity: 1;
  }

  th.sortable:not(.sorted) .sort-indicator {
    opacity: 0.4;
  }

  th.sortable:hover .sort-indicator {
    opacity: 1;
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

  /* Pagination Styles */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-top: 1px solid #ddd;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pagination-info {
    font-size: 0.9rem;
    color: #666;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .page-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    background: white;
    color: #333;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 40px;
    transition: all 0.2s ease;
  }

  .page-btn:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #adb5bd;
  }

  .page-btn:disabled {
    background: #f8f9fa;
    color: #adb5bd;
    cursor: not-allowed;
  }

  .page-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .page-btn.active:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  .ellipsis {
    padding: 0.5rem;
    color: #666;
  }

  .page-size-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .page-size-control label {
    color: #666;
  }

  .page-size-control select {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    .pagination {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }
    
    .pagination-controls {
      justify-content: center;
    }
  }
</style>
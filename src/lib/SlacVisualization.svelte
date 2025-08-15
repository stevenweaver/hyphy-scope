<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  // Interfaces
  interface SlacSiteData {
    site: number;
    partition: number;
    'dN/dS': number;
    'dN': number;
    'dS': number;
    'Normalized dN-dS': number;
    'p-value': number;
    significance: string;
  }

  interface SlacSummary {
    sequences: number;
    sites: number;
    partitions: number;
    testedSites: number;
    significantSites: number;
    positivelySelected: number;
    negativelySelected: number;
    pValueThreshold: number;
  }

  // Reactive data processing
  $: summary = data ? getSlacSummary(data) : null;
  $: siteData = data ? getSlacSiteData(data) : [];

  // Controls
  let pValueThreshold = 0.1;
  let showOnlySignificant = false;
  let selectedVisualization = 'dnds';

  // Sorting and pagination
  let sortColumn = 'p-value';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let currentPage = 1;
  let itemsPerPage = 50;

  // Filtered and sorted data
  $: filteredData = showOnlySignificant 
    ? siteData.filter(site => site['p-value'] <= pValueThreshold)
    : siteData;

  $: sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortColumn as keyof SlacSiteData];
    const bVal = b[sortColumn as keyof SlacSiteData];
    
    const comparison = typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal));
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  $: totalPages = Math.ceil(sortedData.length / itemsPerPage);
  $: paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Plot containers
  let dndsPlotContainer: HTMLDivElement;
  let normalizedPlotContainer: HTMLDivElement;
  let pvaluePlotContainer: HTMLDivElement;

  // Utility Functions
  function getSlacSummary(data: any): SlacSummary {
    const mleData = data.MLE?.content?.['0'] || [];
    const pThreshold = 0.1;
    
    let significantSites = 0;
    let positivelySelected = 0;
    let negativelySelected = 0;

    mleData.forEach((site: any) => {
      const pValue = site[4] || 1; // p-value is typically the 5th column
      const dnds = site[3] || 0;   // dN/dS is typically the 4th column
      
      if (pValue <= pThreshold) {
        significantSites++;
        if (dnds > 1) positivelySelected++;
        else negativelySelected++;
      }
    });

    return {
      sequences: data.input?.sequences || 0,
      sites: mleData.length,
      partitions: Object.keys(data['data partitions'] || {}).length,
      testedSites: mleData.length,
      significantSites,
      positivelySelected,
      negativelySelected,
      pValueThreshold: pThreshold
    };
  }

  function getSlacSiteData(data: any): SlacSiteData[] {
    const mleData = data.MLE?.content?.['0'] || [];
    const partitions = data['data partitions'] || {};
    
    return mleData.map((site: any, index: number) => {
      const dN = site[0] || 0;
      const dS = site[1] || 0;
      const dnds = site[3] || 0;
      const pValue = site[4] || 1;
      const normalizedDiff = (site[5] !== undefined) ? site[5] : (dN - dS);

      return {
        site: index + 1,
        partition: getPartitionForSite(index, partitions),
        'dN/dS': dnds,
        'dN': dN,
        'dS': dS,
        'Normalized dN-dS': normalizedDiff,
        'p-value': pValue,
        significance: getSignificanceCategory(pValue, dnds)
      };
    });
  }

  function getPartitionForSite(siteIndex: number, partitions: any): number {
    // Simple partition assignment - could be more sophisticated
    return 1;
  }

  function getSignificanceCategory(pValue: number, dnds: number): string {
    if (pValue > pValueThreshold) return 'Not Significant';
    if (dnds > 1) return 'Positive Selection';
    return 'Negative Selection';
  }

  function getSignificanceColor(significance: string): string {
    switch (significance) {
      case 'Positive Selection': return '#e3243b';
      case 'Negative Selection': return '#1f77b4';
      default: return '#666';
    }
  }

  // Plotting Functions
  function createDNDSPlot(data: SlacSiteData[]): any {
    if (!data.length) return null;

    const cappedData = data.map(d => ({
      ...d,
      cappedDNDS: Math.min(d['dN/dS'], 10) // Cap at 10 for visualization
    }));

    return Plot.plot({
      title: "dN/dS Ratios Across Sites",
      subtitle: "Sites with dN/dS > 1 may be under positive selection",
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "dN/dS (capped at 10)",
        grid: true
      },
      color: {
        type: "ordinal",
        domain: ["Positive Selection", "Negative Selection", "Not Significant"],
        range: ["#e3243b", "#1f77b4", "#666"]
      },
      marks: [
        // Reference line at dN/dS = 1
        Plot.ruleY([1], { stroke: "#666", strokeDasharray: "5,5" }),
        
        // Points
        Plot.dot(cappedData, {
          x: "site",
          y: "cappedDNDS",
          fill: "significance",
          r: 3,
          title: d => `Site ${d.site}\ndN/dS: ${d['dN/dS'].toFixed(3)}\np-value: ${d['p-value'].toFixed(4)}\n${d.significance}`
        }),
        
        // Line
        Plot.line(cappedData, {
          x: "site",
          y: "cappedDNDS",
          stroke: "#999",
          strokeWidth: 1
        })
      ]
    });
  }

  function createNormalizedPlot(data: SlacSiteData[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Normalized dN - dS",
      subtitle: "Positive values indicate excess of non-synonymous substitutions",
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "Normalized dN - dS",
        grid: true
      },
      color: {
        type: "ordinal",
        domain: ["Positive Selection", "Negative Selection", "Not Significant"],
        range: ["#e3243b", "#1f77b4", "#666"]
      },
      marks: [
        // Reference line at 0
        Plot.ruleY([0], { stroke: "#666", strokeDasharray: "5,5" }),
        
        // Points
        Plot.dot(data, {
          x: "site",
          y: "Normalized dN-dS",
          fill: "significance",
          r: 3,
          title: d => `Site ${d.site}\nNormalized dN-dS: ${d['Normalized dN-dS'].toFixed(3)}\np-value: ${d['p-value'].toFixed(4)}`
        }),
        
        // Line
        Plot.line(data, {
          x: "site",
          y: "Normalized dN-dS",
          stroke: "#999",
          strokeWidth: 1
        })
      ]
    });
  }

  function createPValuePlot(data: SlacSiteData[]): any {
    if (!data.length) return null;

    const logPData = data.map(d => ({
      ...d,
      negLogP: -Math.log10(Math.max(d['p-value'], 1e-10))
    }));

    const thresholdLine = -Math.log10(pValueThreshold);

    return Plot.plot({
      title: "Statistical Significance",
      subtitle: `p-value threshold: ${pValueThreshold}`,
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "-log₁₀(p-value)",
        grid: true
      },
      color: {
        type: "ordinal",
        domain: ["Positive Selection", "Negative Selection", "Not Significant"],
        range: ["#e3243b", "#1f77b4", "#666"]
      },
      marks: [
        // Threshold line
        Plot.ruleY([thresholdLine], { stroke: "#e3243b", strokeDasharray: "5,5" }),
        
        // Points
        Plot.dot(logPData, {
          x: "site",
          y: "negLogP",
          fill: "significance",
          r: 3,
          title: d => `Site ${d.site}\np-value: ${d['p-value'].toExponential(3)}\n${d.significance}`
        })
      ]
    });
  }

  // Initialize plots
  onMount(() => {
    if (siteData.length > 0) {
      renderPlots();
    }
  });

  $: if (siteData.length > 0) {
    renderPlots();
  }

  function renderPlots() {
    if (dndsPlotContainer && (selectedVisualization === 'dnds' || selectedVisualization === 'all')) {
      const plot = createDNDSPlot(siteData);
      if (plot) {
        dndsPlotContainer.innerHTML = '';
        dndsPlotContainer.appendChild(plot);
      }
    }

    if (normalizedPlotContainer && (selectedVisualization === 'normalized' || selectedVisualization === 'all')) {
      const plot = createNormalizedPlot(siteData);
      if (plot) {
        normalizedPlotContainer.innerHTML = '';
        normalizedPlotContainer.appendChild(plot);
      }
    }

    if (pvaluePlotContainer && (selectedVisualization === 'pvalue' || selectedVisualization === 'all')) {
      const plot = createPValuePlot(siteData);
      if (plot) {
        pvaluePlotContainer.innerHTML = '';
        pvaluePlotContainer.appendChild(plot);
      }
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = column === 'p-value' ? 'asc' : 'desc';
    }
    currentPage = 1;
  }

  function formatValue(value: any, column: string): string {
    if (typeof value !== 'number') return String(value);
    
    if (column === 'p-value') {
      return value < 0.001 ? value.toExponential(2) : value.toFixed(4);
    }
    if (column === 'dN/dS' || column === 'dN' || column === 'dS') {
      return value.toFixed(4);
    }
    if (column === 'Normalized dN-dS') {
      return value.toFixed(3);
    }
    return value.toString();
  }

  const tableHeaders = [
    { key: 'site', label: 'Site', sortable: true },
    { key: 'dN/dS', label: 'dN/dS', sortable: true },
    { key: 'dN', label: 'dN', sortable: true },
    { key: 'dS', label: 'dS', sortable: true },
    { key: 'Normalized dN-dS', label: 'Normalized dN-dS', sortable: true },
    { key: 'p-value', label: 'p-value', sortable: true },
    { key: 'significance', label: 'Significance', sortable: true }
  ];
</script>

<div class="slac-visualization">
  {#if !data}
    <div class="loading">
      Loading SLAC data...
    </div>
  {:else}
    <!-- Analysis Summary -->
    <div class="analysis-info">
      <h2>SLAC Analysis Results</h2>
      <p>
        <strong>Single Likelihood Ancestor Counting (SLAC)</strong> uses a maximum likelihood 
        approach to infer the number of synonymous and non-synonymous substitutions at each site.
      </p>
    </div>

    <!-- Summary Tiles -->
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
          <div class="tile-number">{summary.significantSites}</div>
          <div class="tile-description">Significant Sites</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: #e3243b">
            {summary.positivelySelected}
          </div>
          <div class="tile-description">Positive Selection</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: #1f77b4">
            {summary.negativelySelected}
          </div>
          <div class="tile-description">Negative Selection</div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="pvalue-threshold">p-value threshold:</label>
        <input 
          type="number" 
          id="pvalue-threshold"
          bind:value={pValueThreshold} 
          min="0.001" 
          max="0.5" 
          step="0.01"
        />
      </div>

      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            bind:checked={showOnlySignificant}
          />
          Show only significant sites
        </label>
      </div>

      <div class="control-group">
        <label for="visualization-type">Show plots:</label>
        <select id="visualization-type" bind:value={selectedVisualization}>
          <option value="dnds">dN/dS Ratios</option>
          <option value="normalized">Normalized dN-dS</option>
          <option value="pvalue">p-values</option>
          <option value="all">All Plots</option>
        </select>
      </div>
    </div>

    <!-- dN/dS Plot -->
    {#if selectedVisualization === 'dnds' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>dN/dS Ratios</h3>
        <p class="plot-description">
          Ratio of non-synonymous to synonymous substitution rates. 
          Values > 1 may indicate positive selection.
        </p>
        <div class="plot-container" bind:this={dndsPlotContainer}></div>
      </div>
    {/if}

    <!-- Normalized dN-dS Plot -->
    {#if selectedVisualization === 'normalized' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>Normalized dN - dS</h3>
        <p class="plot-description">
          Normalized difference between non-synonymous and synonymous rates. 
          Positive values indicate excess non-synonymous substitutions.
        </p>
        <div class="plot-container" bind:this={normalizedPlotContainer}></div>
      </div>
    {/if}

    <!-- p-value Plot -->
    {#if selectedVisualization === 'pvalue' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>Statistical Significance</h3>
        <p class="plot-description">
          -log₁₀(p-value) for each site. Sites above the threshold line are significant.
        </p>
        <div class="plot-container" bind:this={pvaluePlotContainer}></div>
      </div>
    {/if}

    <!-- Site Results Table -->
    <div class="table-section">
      <h3>Site-Level Results</h3>
      <p class="table-description">
        SLAC results for each site. Click column headers to sort.
      </p>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              {#each tableHeaders as header}
                <th 
                  class:sortable={header.sortable}
                  class:sorted={sortColumn === header.key}
                  on:click={() => header.sortable && handleSort(header.key)}
                >
                  <div class="header-content">
                    <span>{header.label}</span>
                    {#if header.sortable}
                      <span class="sort-indicator">
                        {#if sortColumn === header.key}
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        {:else}
                          ↕
                        {/if}
                      </span>
                    {/if}
                  </div>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each paginatedData as site}
              <tr>
                {#each tableHeaders as header}
                  <td 
                    style="color: {header.key === 'significance' ? getSignificanceColor(site[header.key]) : 'inherit'}"
                  >
                    {formatValue(site[header.key], header.key)}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="pagination">
          <div class="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} 
            of {sortedData.length} sites
          </div>
          
          <div class="pagination-controls">
            <button 
              class="page-btn" 
              disabled={currentPage === 1}
              on:click={() => currentPage = 1}
            >
              ‹‹
            </button>
            <button 
              class="page-btn" 
              disabled={currentPage === 1}
              on:click={() => currentPage--}
            >
              ‹
            </button>
            
            {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              return start + i;
            }).filter(page => page <= totalPages) as page}
              <button 
                class="page-btn"
                class:active={page === currentPage}
                on:click={() => currentPage = page}
              >
                {page}
              </button>
            {/each}
            
            <button 
              class="page-btn" 
              disabled={currentPage === totalPages}
              on:click={() => currentPage++}
            >
              ›
            </button>
            <button 
              class="page-btn" 
              disabled={currentPage === totalPages}
              on:click={() => currentPage = totalPages}
            >
              ››
            </button>
          </div>

          <div class="page-size-control">
            <label for="page-size">Per page:</label>
            <select id="page-size" bind:value={itemsPerPage} on:change={() => currentPage = 1}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      {/if}
    </div>

    <!-- Citation -->
    <div class="citation">
      <h3>Citation</h3>
      <code>
        Kosakovsky Pond SL, Frost SDW. Not so different after all: a comparison of methods 
        for detecting amino acid sites under selection. Mol Biol Evol. 2005;22(5):1208-22.
      </code>
    </div>
  {/if}
</div>

<style>
  .slac-visualization {
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
    border-left: 4px solid #28a745;
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
    background: #fff;
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
    color: #fff;
    border-color: #007bff;
  }

  .page-size-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
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

  input[type="number"], select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
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
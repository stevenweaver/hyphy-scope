<script lang="ts">
  import { onMount } from 'svelte';
  import type { AbsrelResults, AbsrelBranchData, AbsrelSiteData } from './utils/absrel-utils.js';
  import { 
    getAbsrelSummary, 
    getTestedBranches, 
    getAbsrelSiteData,
    getSignificantBranches,
    getAbsrelTableHeaders,
    formatAbsrelValue,
    getPValueColor
  } from './utils/absrel-utils.js';
  import { 
    createPValuePlot,
    createBayesFactorPlot,
    createOmegaDistributionPlot,
    createSiteLogLikelihoodPlot,
    createModelComparisonPlot
  } from './utils/absrel-plots.js';

  export let data: AbsrelResults;

  // Reactive data processing
  $: summary = data ? getAbsrelSummary(data) : null;
  $: testedBranches = data ? getTestedBranches(data) : [];
  $: significantBranches = testedBranches ? getSignificantBranches(testedBranches) : [];
  $: siteData = data ? getAbsrelSiteData(data) : [];

  // Controls and filters
  let pValueThreshold = 0.05;
  let selectedBranches: string[] = [];
  let showOnlySignificant = false;
  let selectedBranchForOmega: string = '';

  // Sorting and pagination
  let sortColumn = 'Corrected P-value';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let currentPage = 1;
  let itemsPerPage = 25;

  // Reactive filtering and sorting
  $: filteredBranches = showOnlySignificant 
    ? significantBranches 
    : testedBranches;

  $: sortedBranches = [...filteredBranches].sort((a, b) => {
    const aVal = a[sortColumn as keyof AbsrelBranchData];
    const bVal = b[sortColumn as keyof AbsrelBranchData];
    
    const comparison = typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal));
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  $: totalPages = Math.ceil(sortedBranches.length / itemsPerPage);
  $: paginatedBranches = sortedBranches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Plot containers
  let pValuePlotContainer: HTMLDivElement;
  let bayesFactorPlotContainer: HTMLDivElement;
  let omegaPlotContainer: HTMLDivElement;
  let siteLogLikePlotContainer: HTMLDivElement;
  let modelComparisonPlotContainer: HTMLDivElement;

  // Initialize plots
  onMount(() => {
    if (testedBranches.length > 0) {
      renderPlots();
    }
  });

  $: if (testedBranches.length > 0) {
    renderPlots();
  }

  function renderPlots() {
    // P-value plot
    if (pValuePlotContainer) {
      const pValuePlot = createPValuePlot(testedBranches, pValueThreshold);
      if (pValuePlot) {
        pValuePlotContainer.innerHTML = '';
        pValuePlotContainer.appendChild(pValuePlot);
      }
    }

    // Bayes Factor plot
    if (bayesFactorPlotContainer) {
      const bayesFactorPlot = createBayesFactorPlot(testedBranches);
      if (bayesFactorPlot) {
        bayesFactorPlotContainer.innerHTML = '';
        bayesFactorPlotContainer.appendChild(bayesFactorPlot);
      }
    }

    // Omega distribution plot
    if (omegaPlotContainer && selectedBranchForOmega) {
      const selectedBranch = testedBranches.find(b => b.name === selectedBranchForOmega);
      if (selectedBranch) {
        const omegaPlot = createOmegaDistributionPlot(selectedBranch);
        if (omegaPlot) {
          omegaPlotContainer.innerHTML = '';
          omegaPlotContainer.appendChild(omegaPlot);
        }
      }
    }

    // Site log likelihood plot
    if (siteLogLikePlotContainer && siteData.length > 0) {
      const sitePlot = createSiteLogLikelihoodPlot(siteData, selectedBranches);
      if (sitePlot) {
        siteLogLikePlotContainer.innerHTML = '';
        siteLogLikePlotContainer.appendChild(sitePlot);
      }
    }

    // Model comparison plot
    if (modelComparisonPlotContainer && data) {
      const modelPlot = createModelComparisonPlot(data);
      if (modelPlot) {
        modelComparisonPlotContainer.innerHTML = '';
        modelComparisonPlotContainer.appendChild(modelPlot);
      }
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    currentPage = 1;
  }

  function handleBranchSelection(branchName: string) {
    if (selectedBranches.includes(branchName)) {
      selectedBranches = selectedBranches.filter(b => b !== branchName);
    } else {
      selectedBranches = [...selectedBranches, branchName];
    }
  }

  $: tableHeaders = getAbsrelTableHeaders();
</script>

<div class="absrel-visualization">
  {#if !data}
    <div class="loading">
      Loading ABSREL data...
    </div>
  {:else}
    <!-- Analysis Summary -->
    <div class="analysis-info">
      <h2>aBSREL Analysis Results</h2>
      <p>
        <strong>Adaptive Branch-Site Random Effects Likelihood</strong> test for 
        episodic positive selection. This analysis tests whether branches have 
        experienced episodic positive selection without requiring a priori 
        specification of lineages.
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
          <div class="tile-number">{summary.branchesTested}</div>
          <div class="tile-description">Branches Tested</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.branchesWithSelection}</div>
          <div class="tile-description">Branches with Selection</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.lrt.toFixed(2)}</div>
          <div class="tile-description">Likelihood Ratio Test</div>
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
          max="0.1" 
          step="0.001"
        />
      </div>

      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            bind:checked={showOnlySignificant}
          />
          Show only significant branches
        </label>
      </div>

      <div class="control-group">
        <label for="omega-branch">ω distribution for branch:</label>
        <select id="omega-branch" bind:value={selectedBranchForOmega}>
          <option value="">Select a branch...</option>
          {#each testedBranches as branch}
            <option value={branch.name}>{branch.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Model Comparison -->
    <div class="plot-section">
      <h3>Model Comparison</h3>
      <p class="plot-description">
        Comparison of baseline and full adaptive models based on log likelihood.
      </p>
      <div class="plot-container" bind:this={modelComparisonPlotContainer}></div>
    </div>

    <!-- P-value Significance Plot -->
    <div class="plot-section">
      <h3>Branch Selection Significance</h3>
      <p class="plot-description">
        Uncorrected and corrected p-values for each tested branch. 
        Branches below the threshold line show evidence of selection.
      </p>
      <div class="plot-container" bind:this={pValuePlotContainer}></div>
    </div>

    <!-- Bayes Factor Plot -->
    <div class="plot-section">
      <h3>Bayes Factor Evidence</h3>
      <p class="plot-description">
        Bayes Factor evidence for positive selection on each branch. 
        Higher values indicate stronger evidence.
      </p>
      <div class="plot-container" bind:this={bayesFactorPlotContainer}></div>
    </div>

    <!-- Omega Distribution Plot -->
    {#if selectedBranchForOmega}
      <div class="plot-section">
        <h3>ω Distribution</h3>
        <p class="plot-description">
          Rate classes and their weights for the selected branch. 
          Classes with ω > 1 indicate positive selection.
        </p>
        <div class="plot-container" bind:this={omegaPlotContainer}></div>
      </div>
    {/if}

    <!-- Site Log Likelihood Plot -->
    {#if selectedBranches.length > 0}
      <div class="plot-section">
        <h3>Site-Level Log Likelihood</h3>
        <p class="plot-description">
          Log likelihood values across sites for selected branches.
        </p>
        <div class="plot-container" bind:this={siteLogLikePlotContainer}></div>
      </div>
    {/if}

    <!-- Branch Results Table -->
    <div class="table-section">
      <h3>Branch Test Results</h3>
      <p class="table-description">
        Statistical test results for each branch. Click column headers to sort. 
        Select branches to view in site-level plots.
      </p>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Select</th>
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
            {#each paginatedBranches as branch}
              <tr>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedBranches.includes(branch.name)}
                    on:change={() => handleBranchSelection(branch.name)}
                  />
                </td>
                {#each tableHeaders as header}
                  <td 
                    style="color: {header.key.includes('p-value') || header.key.includes('P-value') 
                      ? getPValueColor(branch[header.key], pValueThreshold) 
                      : 'inherit'}"
                  >
                    {formatAbsrelValue(branch[header.key], header.key)}
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
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedBranches.length)} 
            of {sortedBranches.length} branches
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
        Smith MD, Wertheim JO, Weaver S, Murrell B, Scheffler K, Kosakovsky Pond SL. 
        Less is more: an adaptive branch-site random effects model for efficient 
        detection of episodic diversifying selection. Mol Biol Evol. 2015;32(5):1342-53.
      </code>
    </div>
  {/if}
</div>

<style>
  .absrel-visualization {
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .tile {
    background: #fff;
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
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    border-left: 4px solid #e3243b;
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
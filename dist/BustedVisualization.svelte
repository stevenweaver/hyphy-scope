<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  // Interfaces
  interface BustedSiteData {
    site: number;
    partition: number;
    'Evidence Ratio': number;
    'Synonymous Rate': number;
    'Selection': string;
  }

  interface BustedSummary {
    sequences: number;
    sites: number;
    pValue: number;
    testStatistic: number;
    baselineLogL: number;
    alternativeLogL: number;
    hasSelection: boolean;
    branchesTestedCount: number;
  }

  // Reactive data processing
  $: summary = data ? getBustedSummary(data) : null;
  $: siteData = data ? getBustedSiteData(data) : [];
  $: distributionData = data ? getDistributionData(data) : null;

  // Controls
  let evidenceThreshold = 100;
  let showOnlySignificant = false;
  let selectedVisualization = 'evidence';

  // Sorting and pagination
  let sortColumn = 'Evidence Ratio';
  let sortDirection: 'asc' | 'desc' = 'desc';
  let currentPage = 1;
  let itemsPerPage = 50;

  // Filtered and sorted data
  $: filteredData = showOnlySignificant 
    ? siteData.filter(site => site['Evidence Ratio'] >= evidenceThreshold)
    : siteData;

  $: sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortColumn as keyof BustedSiteData];
    const bVal = b[sortColumn as keyof BustedSiteData];
    
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
  let evidenceRatioContainer: HTMLDivElement;
  let synonymousRateContainer: HTMLDivElement;
  let distributionContainer: HTMLDivElement;

  // Utility Functions
  function getBustedSummary(data: any): BustedSummary {
    const testResults = data['test results'];
    const fits = data.fits;
    
    return {
      sequences: data.input?.sequences || 0,
      sites: data.input?.sites || 0,
      pValue: testResults?.['p-value'] || 1,
      testStatistic: testResults?.['test statistic'] || 0,
      baselineLogL: fits?.['Baseline MG94xREV']?.['log-likelihood'] || 0,
      alternativeLogL: fits?.['Alternative model']?.['log-likelihood'] || 0,
      hasSelection: (testResults?.['p-value'] || 1) <= 0.05,
      branchesTestedCount: data.tested?.length || 0
    };
  }

  function getBustedSiteData(data: any): BustedSiteData[] {
    const evidenceRatios = data['Evidence Ratios'];
    const synonymousRates = data['Synonymous site-posteriors'];
    
    if (!evidenceRatios) return [];
    
    const sites = Object.keys(evidenceRatios).map(Number).sort((a, b) => a - b);
    
    return sites.map(site => {
      const evidence = evidenceRatios[site] || 0;
      const synRate = synonymousRates?.[site] || 0;
      
      return {
        site,
        partition: 1,
        'Evidence Ratio': evidence,
        'Synonymous Rate': synRate,
        'Selection': getSelectionCategory(evidence)
      };
    });
  }

  function getDistributionData(data: any) {
    const fits = data.fits;
    if (!fits) return null;

    const baseline = fits['Baseline MG94xREV'];
    const alternative = fits['Alternative model'];

    return {
      baseline: {
        logL: baseline?.['log-likelihood'] || 0,
        parameters: baseline?.parameters || 0,
        AIC: baseline?.AIC || 0
      },
      alternative: {
        logL: alternative?.['log-likelihood'] || 0,
        parameters: alternative?.parameters || 0,
        AIC: alternative?.AIC || 0
      },
      lrt: 2 * ((alternative?.['log-likelihood'] || 0) - (baseline?.['log-likelihood'] || 0))
    };
  }

  function getSelectionCategory(evidenceRatio: number): string {
    if (evidenceRatio >= 100) return 'Strong Positive';
    if (evidenceRatio >= 10) return 'Moderate Positive';
    if (evidenceRatio >= 3) return 'Weak Positive';
    return 'Neutral/Purifying';
  }

  function getSelectionColor(selection: string): string {
    switch (selection) {
      case 'Strong Positive': return '#e3243b';
      case 'Moderate Positive': return '#ff6b35';
      case 'Weak Positive': return '#ffa500';
      default: return '#666';
    }
  }

  // Plotting Functions
  function createEvidenceRatioPlot(data: BustedSiteData[]): any {
    if (!data.length) return null;

    const cappedData = data.map(d => ({
      ...d,
      cappedRatio: Math.min(d['Evidence Ratio'], 1000)
    }));

    return Plot.plot({
      title: "Evidence Ratios for Positive Selection",
      subtitle: "Sites with higher ratios show stronger evidence for selection",
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "Evidence Ratio (capped at 1000)",
        grid: true
      },
      color: {
        type: "ordinal",
        domain: ["Strong Positive", "Moderate Positive", "Weak Positive", "Neutral/Purifying"],
        range: ["#e3243b", "#ff6b35", "#ffa500", "#666"]
      },
      marks: [
        // Threshold lines
        Plot.ruleY([100], { stroke: "#e3243b", strokeDasharray: "5,5" }),
        Plot.ruleY([10], { stroke: "#ff6b35", strokeDasharray: "3,3" }),
        Plot.ruleY([3], { stroke: "#ffa500", strokeDasharray: "2,2" }),
        
        // Points
        Plot.dot(cappedData, {
          x: "site",
          y: "cappedRatio",
          fill: "Selection",
          r: 3,
          title: d => `Site ${d.site}\nEvidence Ratio: ${d['Evidence Ratio'].toFixed(2)}\nCategory: ${d.Selection}`
        }),
        
        // Line
        Plot.line(cappedData, {
          x: "site",
          y: "cappedRatio",
          stroke: "#999",
          strokeWidth: 1
        })
      ]
    });
  }

  function createSynonymousRatePlot(data: BustedSiteData[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Synonymous Substitution Rates",
      subtitle: "Rate of synonymous substitutions across sites",
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "Synonymous Rate",
        grid: true
      },
      marks: [
        Plot.line(data, {
          x: "site",
          y: "Synonymous Rate",
          stroke: "#1f77b4",
          strokeWidth: 2
        }),
        
        Plot.dot(data.filter((d, i) => i % 20 === 0), {
          x: "site",
          y: "Synonymous Rate",
          fill: "#1f77b4",
          r: 3,
          title: d => `Site ${d.site}\nSynonymous Rate: ${d['Synonymous Rate'].toFixed(4)}`
        })
      ]
    });
  }

  function createDistributionPlot(distData: any): any {
    if (!distData) return null;

    const plotData = [
      { model: "Baseline", logL: distData.baseline.logL, AIC: distData.baseline.AIC, parameters: distData.baseline.parameters },
      { model: "Alternative", logL: distData.alternative.logL, AIC: distData.alternative.AIC, parameters: distData.alternative.parameters }
    ];

    return Plot.plot({
      title: "Model Comparison",
      subtitle: `LRT = ${distData.lrt.toFixed(2)}`,
      width: 500,
      height: 300,
      marginLeft: 100,
      x: {
        type: "band",
        domain: ["Baseline", "Alternative"],
        label: "Model"
      },
      y: {
        label: "Log Likelihood",
        grid: true
      },
      marks: [
        Plot.barY(plotData, {
          x: "model",
          y: "logL",
          fill: "#1f77b4",
          title: d => `${d.model}\nLog-L: ${d.logL.toFixed(2)}\nAIC: ${d.AIC.toFixed(2)}\nParameters: ${d.parameters}`
        })
      ]
    });
  }

  // Initialize plots when data is available and component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  $: if (mounted && siteData.length > 0) {
    renderPlots();
  }

  function renderPlots() {
    if (evidenceRatioContainer && (selectedVisualization === 'evidence' || selectedVisualization === 'all')) {
      const plot = createEvidenceRatioPlot(siteData);
      if (plot) {
        evidenceRatioContainer.innerHTML = '';
        evidenceRatioContainer.appendChild(plot);
      }
    }

    if (synonymousRateContainer && (selectedVisualization === 'synonymous' || selectedVisualization === 'all')) {
      const plot = createSynonymousRatePlot(siteData);
      if (plot) {
        synonymousRateContainer.innerHTML = '';
        synonymousRateContainer.appendChild(plot);
      }
    }

    if (distributionContainer && distributionData) {
      const plot = createDistributionPlot(distributionData);
      if (plot) {
        distributionContainer.innerHTML = '';
        distributionContainer.appendChild(plot);
      }
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'desc';
    }
    currentPage = 1;
  }

  function formatValue(value: any, column: string): string {
    if (typeof value !== 'number') return String(value);
    
    if (column === 'Evidence Ratio') {
      return value < 0.001 ? value.toExponential(2) : value.toFixed(2);
    }
    if (column === 'Synonymous Rate') {
      return value.toFixed(4);
    }
    return value.toString();
  }

  const tableHeaders = [
    { key: 'site', label: 'Site', sortable: true },
    { key: 'Evidence Ratio', label: 'Evidence Ratio', sortable: true },
    { key: 'Synonymous Rate', label: 'Synonymous Rate', sortable: true },
    { key: 'Selection', label: 'Selection Category', sortable: true }
  ];
</script>

<div class="busted-visualization">
  {#if !data}
    <div class="loading">
      Loading BUSTED data...
    </div>
  {:else}
    <!-- Analysis Summary -->
    <div class="analysis-info">
      <h2>BUSTED Analysis Results</h2>
      <p>
        <strong>Branch-site Unrestricted Statistical Test for Episodic Diversification</strong> 
        tests whether a gene has experienced positive selection at some sites along some branches.
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
          <div class="tile-number" style="color: {summary.hasSelection ? '#e3243b' : '#666'}">
            {summary.pValue.toExponential(3)}
          </div>
          <div class="tile-description">p-value</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.testStatistic.toFixed(2)}</div>
          <div class="tile-description">Test Statistic</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.hasSelection ? '#e3243b' : '#666'}">
            {summary.hasSelection ? 'YES' : 'NO'}
          </div>
          <div class="tile-description">Selection Detected</div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="evidence-threshold">Evidence threshold:</label>
        <input 
          type="number" 
          id="evidence-threshold"
          bind:value={evidenceThreshold} 
          min="1" 
          max="1000" 
          step="10"
        />
      </div>

      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            bind:checked={showOnlySignificant}
          />
          Show only sites above threshold
        </label>
      </div>

      <div class="control-group">
        <label for="visualization-type">Show plots:</label>
        <select id="visualization-type" bind:value={selectedVisualization}>
          <option value="evidence">Evidence Ratios</option>
          <option value="synonymous">Synonymous Rates</option>
          <option value="all">All Plots</option>
        </select>
      </div>
    </div>

    <!-- Model Comparison -->
    <div class="plot-section">
      <h3>Model Comparison</h3>
      <p class="plot-description">
        Comparison of baseline and alternative models. The likelihood ratio test determines 
        if positive selection is present.
      </p>
      <div class="plot-container" bind:this={distributionContainer}></div>
    </div>

    <!-- Evidence Ratio Plot -->
    {#if selectedVisualization === 'evidence' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>Evidence Ratios for Positive Selection</h3>
        <p class="plot-description">
          Sites with higher evidence ratios show stronger statistical support for positive selection.
          Thresholds: Strong (≥100), Moderate (≥10), Weak (≥3).
        </p>
        <div class="plot-container" bind:this={evidenceRatioContainer}></div>
      </div>
    {/if}

    <!-- Synonymous Rate Plot -->
    {#if selectedVisualization === 'synonymous' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>Synonymous Substitution Rates</h3>
        <p class="plot-description">
          Rate of synonymous substitutions across sites, indicating background mutation rate.
        </p>
        <div class="plot-container" bind:this={synonymousRateContainer}></div>
      </div>
    {/if}

    <!-- Site Results Table -->
    <div class="table-section">
      <h3>Site-Level Results</h3>
      <p class="table-description">
        Statistical evidence for positive selection at each site. Click column headers to sort.
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
                    style="color: {header.key === 'Selection' ? getSelectionColor(site[header.key]) : 'inherit'}"
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
        Murrell B, Weaver S, Smith MD, Wertheim JO, Murrell S, Aylward A, Eren K, Pollner T, 
        Martin DP, Smith DM, Scheffler K, Kosakovsky Pond SL. Gene-wide identification of 
        episodic selection. Mol Biol Evol. 2015;32(5):1365-71.
      </code>
    </div>
  {/if}
</div>

<style>
  .busted-visualization {
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
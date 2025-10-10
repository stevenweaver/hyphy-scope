<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import CircosJS from 'circos';
  import type { MultiHitResults, ERThresholds } from './utils/multi-hit-utils.js';
  import {
    formatEvidenceRatios,
    formatSiteLogLikelihood,
    initializeERThresholds,
    getTestSummary,
    translationTable,
    getUniqueAminoAcids,
    getCodonColor,
    prepareCircosData
  } from './utils/multi-hit-utils.js';

  export let data: MultiHitResults;

  // State
  let activeTable: 'Evidence Ratios' | 'Site Log Likelihood' = 'Evidence Ratios';
  let pThreshold = 0.1;
  let erThresholds: ERThresholds = {};
  let minimumTransitions = 3;
  let showLabels = true;
  let showLegend = true;

  // Circos data
  let circosLayout: any[] = [];
  let circosChordData: any[] = [];
  let maxTransitionCount = 0;

  // Container refs
  let circosContainer: HTMLDivElement;
  let legendContainer: SVGSVGElement;

  // Reactive data
  $: erTableData = data ? formatEvidenceRatios(data) : [];
  $: logLTableData = data ? formatSiteLogLikelihood(data) : [];
  $: tableData = activeTable === 'Evidence Ratios' ? erTableData : logLTableData;
  $: testSummary = data ? getTestSummary(data, pThreshold) : { significant: [], total: 0 };

  // Table headers
  $: erHeaders = data ? ['Site', ...Object.keys(data['Evidence Ratios'])] : [];
  $: logLHeaders = data ? ['Site', ...Object.keys(data['Site Log Likelihood'])] : [];
  $: currentHeaders = activeTable === 'Evidence Ratios' ? erHeaders : logLHeaders;

  // Formatting
  const floatFormat = d3.format(".3f");
  const pValueFormat = d3.format(".4f");

  // Sort state
  let sortColumn: number | null = null;
  let sortAscending = true;

  // Pagination
  let currentPage = 1;
  let rowsPerPage = 20;
  $: totalPages = Math.ceil(tableData.length / rowsPerPage);
  $: paginatedData = sortedTableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Sorted table data
  $: sortedTableData = (() => {
    if (sortColumn === null) return tableData;
    return [...tableData].sort((a, b) => {
      const aVal = a[sortColumn!];
      const bVal = b[sortColumn!];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortAscending ? comparison : -comparison;
    });
  })();

  function handleSort(colIndex: number) {
    if (sortColumn === colIndex) {
      sortAscending = !sortAscending;
    } else {
      sortColumn = colIndex;
      sortAscending = true;
    }
  }

  function exportToCSV() {
    const rows = [
      currentHeaders,
      ...tableData.map(row => row.map(v => typeof v === 'number' ? floatFormat(v) : v))
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multihit-${activeTable.replace(' ', '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateCircosData() {
    if (!data?.['Site substitutions'] || !data?.['Evidence Ratios']) return;

    const { layout, chords, maxCount } = prepareCircosData(
      data['Site substitutions'],
      data['Evidence Ratios'],
      erThresholds,
      minimumTransitions
    );

    circosLayout = layout;
    circosChordData = chords;
    maxTransitionCount = maxCount;
  }

  function renderCircos() {
    if (!circosContainer || circosLayout.length === 0) return;

    // Clear previous rendering
    circosContainer.innerHTML = '';

    const circos = new CircosJS({
      container: circosContainer,
      width: 800,
      height: 800
    });

    const config = {
      innerRadius: 300,
      outerRadius: 350,
      cornerRadius: 0,
      gap: 0.04,
      labels: {
        display: showLabels,
        position: 'center',
        size: '14',
        color: 'black',
        radialOffset: 60
      },
      ticks: {
        display: false
      }
    };

    circos.layout(circosLayout, config);

    // Add chord track
    circos.chords('flow', circosChordData, {
      color: (d: any) => getCodonColor(d.source.codon),
      opacity: 0.2,
      tooltipContent: (d: any) => {
        const sourceAA = translationTable[d.source.codon] || '?';
        const targetAA = translationTable[d.target.codon] || '?';
        return `<div style="padding: 8px; background: white; border: 1px solid #ddd;">
          <strong>${d.source.codon}</strong> (${sourceAA}) → <strong>${d.target.codon}</strong> (${targetAA}): ${d.count}
        </div>`;
      }
    });

    circos.render();
  }

  function buildLegend() {
    if (!legendContainer || !showLegend) return;

    d3.select(legendContainer).selectAll('*').remove();

    const svg = d3.select(legendContainer);
    const uniqueAAs = getUniqueAminoAcids();

    const colors = uniqueAAs.map(aa => ({
      text: aa,
      color: getCodonColor(Object.keys(translationTable).find(c => translationTable[c] === aa) || 'AAA')
    }));

    svg
      .selectAll('circle')
      .data(colors)
      .enter()
      .append('circle')
      .attr('cx', 10)
      .attr('r', 6)
      .attr('cy', (d, i) => 20 + i * 20)
      .style('fill', d => d.color);

    svg
      .selectAll('text')
      .data(colors)
      .enter()
      .append('text')
      .attr('x', 25)
      .attr('y', (d, i) => 20 + i * 20)
      .text(d => d.text)
      .style('font-size', '14px')
      .attr('alignment-baseline', 'middle');
  }

  onMount(() => {
    if (data) {
      erThresholds = initializeERThresholds(data);
      updateCircosData();
    }
  });

  afterUpdate(() => {
    renderCircos();
    if (showLegend) {
      buildLegend();
    }
  });

  // Update circos when thresholds or transitions change
  $: if (erThresholds && minimumTransitions && data) {
    updateCircosData();
  }

  // Test name formatting
  const testNameMap: { [key: string]: { short: string; icon: string } } = {
    'Triple-hit vs single-hit': { short: '3H vs 1H', icon: '🎲³ vs 🎲¹' },
    'Triple-hit vs double-hit': { short: '3H vs 2H', icon: '🎲³ vs 🎲²' },
    'Triple-hit vs Triple-hit-island': { short: '3H vs 3HSI', icon: '🎲³ vs 🧭' },
    'Double-hit vs single-hit': { short: '2H vs 1H', icon: '🎲² vs 🎲¹' },
    'Triple-hit-island vs double-hit': { short: '3HSI vs 2H', icon: '🧭 vs 🎲²' }
  };
</script>

<style>
  .multihit-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .summary-box {
    border: 2px solid #007bff;
    border-left: 0;
    border-right: 0;
    padding: 20px;
    margin: 20px 0;
  }

  .highlight {
    color: #007bff;
    font-weight: bold;
  }

  .test-results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }

  .test-card {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
  }

  .test-card.significant {
    border-color: #007bff;
    border-width: 2px;
    background: #e7f3ff;
  }

  .test-card-header {
    font-weight: 600;
    margin-bottom: 10px;
    font-size: 16px;
  }

  .test-stat {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #dee2e6;
  }

  .test-stat:last-child {
    border-bottom: none;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .badge-secondary {
    background: #6c757d;
    color: white;
  }

  .badge-primary {
    background: #007bff;
    color: white;
  }

  .table-selector {
    display: flex;
    gap: 0;
    margin: 20px 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .table-selector button {
    flex: 1;
    padding: 12px 20px;
    border: 1px solid #6c757d;
    background: #6c757d;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .table-selector button:hover {
    background: #5a6268;
  }

  .table-selector button.active {
    background: #007bff;
    border-color: #007bff;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
  }

  th:hover {
    background-color: #e9ecef;
  }

  tr:hover {
    background-color: #f8f9fa;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 20px 0;
  }

  .pagination button {
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    background: white;
    cursor: pointer;
    border-radius: 4px;
  }

  .pagination button:hover:not(:disabled) {
    background-color: #f8f9fa;
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination button.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }

  .btn {
    padding: 10px 16px;
    border: 1px solid #007bff;
    background: #007bff;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn:hover {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    border-color: #6c757d;
  }

  .btn-secondary:hover {
    background: #5a6268;
  }

  .control-group {
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 5px;
  }

  .control-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }

  .control-group input[type="number"] {
    padding: 8px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    width: 120px;
  }

  section {
    margin: 40px 0;
  }

  h2 {
    font-size: 24px;
    margin-bottom: 15px;
    color: #333;
  }

  h3 {
    font-size: 20px;
    margin-bottom: 10px;
    color: #555;
  }

  .description {
    color: #666;
    font-size: 14px;
    margin: 10px 0;
    line-height: 1.6;
  }

  .er-threshold-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 15px 0;
  }

  .er-control {
    padding: 10px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
  }

  .er-control-header {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .er-inputs {
    display: flex;
    gap: 8px;
  }

  .er-inputs input {
    flex: 1;
    padding: 6px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 14px;
  }

  .alert-info {
    background: #e3f2fd;
    border: 1px solid #1976d2;
    border-radius: 4px;
    padding: 15px;
    margin: 15px 0;
    color: #0d47a1;
  }

  .alert-info hr {
    border: none;
    border-top: 1px solid #90caf9;
    margin: 10px 0;
  }

  .controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    gap: 20px;
  }

  .controls-row > div:first-child {
    flex: 1;
  }

  .slider {
    width: 100%;
    margin-top: 8px;
  }

  .toggle-buttons {
    display: flex;
    gap: 10px;
  }

  .toggle-btn {
    padding: 8px 16px;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: #f8f9fa;
  }

  .toggle-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .toggle-btn input {
    margin-right: 6px;
  }

  .circos-section {
    margin-top: 30px;
  }

  .circos-row {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: flex-start;
    margin: 20px 0;
  }

  .legend {
    flex-shrink: 0;
  }

  .circos-plot-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .circos-plot {
    min-height: 800px;
  }

  :global(.circos-plot svg) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>

<div class="multihit-container">
  <section id="summary-tab">
    <h2>Multi-Hit Analysis Summary</h2>
    <div class="summary-box">
      <p>
        MultiHit <strong class="highlight">analyzes evidence</strong> for instantaneous multiple-nucleotide changes
      </p>
      <p>
        Found <strong class="highlight">{testSummary.significant.length}</strong> of <strong class="highlight">{testSummary.total}</strong> test comparisons with significant evidence (p &lt; {pThreshold})
      </p>
      <div class="control-group">
        <label for="p-threshold">P-value threshold:</label>
        <input
          id="p-threshold"
          type="number"
          bind:value={pThreshold}
          min="0"
          max="1"
          step="0.01"
        />
      </div>
      <hr />
      <p class="description">
        <small>
          Please cite <a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0248337" target="_blank">
            Extra base hits: Widespread empirical support for instantaneous multiple-nucleotide changes (PMID: 33711070)
          </a> if you use this result in a publication.
        </small>
      </p>
    </div>

    <h3>Likelihood Test Results</h3>
    <div class="test-results-grid">
      {#each Object.entries(data['test results']) as [testName, result]}
        {#if result}
          <div class="test-card" class:significant={result['p-value'] < pThreshold}>
            <div class="test-card-header">
              {testNameMap[testName]?.short || testName}
            </div>
            <div class="test-stat">
              <span><span class="badge badge-secondary">LRT</span></span>
              <span>{floatFormat(result.LRT)}</span>
            </div>
            <div class="test-stat">
              <span><span class="badge" class:badge-primary={result['p-value'] < pThreshold} class:badge-secondary={result['p-value'] >= pThreshold}>p-value</span></span>
              <span>{pValueFormat(result['p-value'])}</span>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </section>

  <section id="table-tab">
    <h2>Model Test Statistics Per Site</h2>

    <div class="table-selector">
      <button
        class:active={activeTable === 'Evidence Ratios'}
        on:click={() => activeTable = 'Evidence Ratios'}
      >
        Evidence Ratios
      </button>
      <button
        class:active={activeTable === 'Site Log Likelihood'}
        on:click={() => activeTable = 'Site Log Likelihood'}
      >
        Site Log Likelihood
      </button>
    </div>

    <button class="btn btn-secondary" on:click={exportToCSV}>
      Export to CSV
    </button>

    <table>
      <thead>
        <tr>
          {#each currentHeaders as header, i}
            <th on:click={() => handleSort(i)}>
              {header}
              {#if sortColumn === i}
                {sortAscending ? '▲' : '▼'}
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each paginatedData as row}
          <tr>
            {#each row as cell, i}
              <td>
                {#if i === 0}
                  {cell}
                {:else}
                  {floatFormat(cell)}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="pagination">
      <button on:click={() => currentPage = 1} disabled={currentPage === 1}>First</button>
      <button on:click={() => currentPage--} disabled={currentPage === 1}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button on:click={() => currentPage++} disabled={currentPage === totalPages}>Next</button>
      <button on:click={() => currentPage = totalPages} disabled={currentPage === totalPages}>Last</button>
    </div>

    <p class="description">
      The table shows site-by-site {activeTable.toLowerCase()} for different model comparisons.
      Higher evidence ratios indicate stronger support for the more complex model at that site.
    </p>
  </section>

  {#if data['Site substitutions']}
    <section id="substitutions-tab">
      <h2>Site Substitutions</h2>

      <div class="control-group">
        <div class="alert alert-info">
          <p>
            Use the sliders or input to specify the evidence ratio range of each respective model.
            For example, if three-hit substitutions with 3H+ support are defined as those occurring
            at sites with ER(3H+:2H)>5, set 3H+ range to a minimum of 5 but leave all other settings
            to their respective maximum ranges.
          </p>
          <hr />
          <p><strong># of nucleotide changes</strong> slider specifies the minimum number of substitutions to display.</p>
        </div>

        <h3>Evidence Ratio Thresholds</h3>
        <div class="er-threshold-grid">
          {#each Object.keys(data['Evidence Ratios']) as erKey}
            <div class="er-control">
              <div class="er-control-header">{erKey}</div>
              <div class="er-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  bind:value={erThresholds[erKey][0]}
                  step="0.1"
                />
                <input
                  type="number"
                  placeholder="Max"
                  bind:value={erThresholds[erKey][1]}
                  step="0.1"
                />
              </div>
            </div>
          {/each}
        </div>

        <div class="controls-row">
          <div>
            <label for="min-transitions">
              # of nucleotide changes <span class="badge badge-secondary">{minimumTransitions}</span>
            </label>
            <input
              id="min-transitions"
              type="range"
              bind:value={minimumTransitions}
              min="1"
              max="3"
              step="1"
              class="slider"
            />
          </div>

          <div class="toggle-buttons">
            <label class="toggle-btn" class:active={showLabels}>
              <input type="checkbox" bind:checked={showLabels} />
              Labels
            </label>
            <label class="toggle-btn" class:active={showLegend}>
              <input type="checkbox" bind:checked={showLegend} />
              Legend
            </label>
          </div>
        </div>
      </div>

      <div class="circos-section">
        <div class="circos-row">
          {#if showLegend}
            <svg bind:this={legendContainer} class="legend" width="200" height="500"></svg>
          {/if}
          <div class="circos-plot-container">
            <div bind:this={circosContainer} class="circos-plot" id="circos-plot"></div>
          </div>
        </div>

        <p class="description">
          This circular plot shows the flow of codon substitutions across the alignment.
          The size of the ribbons (chords) is proportional to the number of substitutions between
          codon pairs. Colors represent the source codon's amino acid. Hover over a ribbon to see
          substitution details.
        </p>

        {#if circosChordData.length > 0}
          <h3>Substitution Details</h3>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Target</th>
                <th>Source AA</th>
                <th>Target AA</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {#each circosChordData.slice(0, 20) as chord}
                <tr>
                  <td>{chord.source.codon}</td>
                  <td>{chord.target.codon}</td>
                  <td>{translationTable[chord.source.codon] || '?'}</td>
                  <td>{translationTable[chord.target.codon] || '?'}</td>
                  <td>{chord.count}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if circosChordData.length > 20}
            <p class="description">Showing top 20 of {circosChordData.length} substitutions</p>
          {/if}
        {/if}
      </div>
    </section>
  {/if}
</div>

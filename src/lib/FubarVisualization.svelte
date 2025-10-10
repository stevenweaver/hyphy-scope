<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css"
  />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { FubarResults, FubarSiteData } from './utils/fubar-utils.js';
  import {
    getFubarSummary,
    getFubarSiteData,
    getPartitionColumn,
    getTreeNewick
  } from './utils/fubar-utils.js';
  import { phylotree } from 'phylotree';

  export let data: FubarResults;

  // Reactive data processing
  $: summary = data ? getFubarSummary(data, posteriorProbability) : null;
  $: siteData = data ? getFubarSiteData(data) : [];
  $: partitionColumn = data ? getPartitionColumn(data) : [];

  // Controls
  let posteriorProbability = 0.9;
  let selectedSite: number | null = null;
  let inputError = false;

  // Tree controls
  let showTree = true;
  let treeWidth = 800;
  let treeHeight = 600;
  let showScale = true;

  // Visualization refs
  let vizContainer: HTMLDivElement;
  let treeContainer: HTMLDivElement;

  // Formatting
  const formatter = d3.format(".3f");

  // Table data with highlighting
  $: tableData = siteData.map((row, index) => {
    const isPositive = row['Prob[α<β]'] > posteriorProbability;
    const isNegative = row['Prob[α>β]'] > posteriorProbability;
    const className = isPositive ? 'positive-selection-row' :
                     isNegative ? 'negative-selection-row' : '';
    return {
      ...row,
      className
    };
  });

  // Sort state
  let sortColumn: string | null = null;
  let sortAscending = true;

  // Sorted and paginated table data
  $: sortedTableData = (() => {
    if (!sortColumn) return tableData;
    return [...tableData].sort((a, b) => {
      const aVal = a[sortColumn as keyof typeof a];
      const bVal = b[sortColumn as keyof typeof b];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortAscending ? comparison : -comparison;
    });
  })();

  // Pagination
  let currentPage = 1;
  let rowsPerPage = 20;
  $: totalPages = Math.ceil(sortedTableData.length / rowsPerPage);
  $: paginatedData = sortedTableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortAscending = !sortAscending;
    } else {
      sortColumn = column;
      sortAscending = true;
    }
  }

  function handleSiteInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value;

    if (value === '' || value === '0') {
      selectedSite = null;
      inputError = false;
      return;
    }

    if (!/^\d+$/.test(value)) {
      inputError = true;
      return;
    }

    const siteNum = parseInt(value);
    if (siteNum > 0 && siteNum <= (data?.input?.['number of sites'] || 0)) {
      selectedSite = siteNum;
      inputError = false;
    } else {
      inputError = true;
    }
  }

  // Render the posterior distribution plot
  function renderPosteriorPlot() {
    if (!data?.grid || !vizContainer) return;

    // Clear previous content
    d3.select(vizContainer).html('');

    // Get grid data
    const gridData = selectedSite ? getGridDataForSite(selectedSite) : data.grid;
    const nGridpoints = Math.sqrt(gridData.length);
    const gridpoints = gridData.map(row => +row[1].toFixed(2)).slice(0, nGridpoints);

    const margin = { top: 15, right: 75, bottom: 75, left: 75 };
    const width = 800 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3.select(vizContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('fill', 'white');

    const main = svg.append('g')
      .attr('id', 'fubar-main')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scalePoint()
      .domain(gridpoints.map(String))
      .range([0, width])
      .padding(0.5);

    const y = d3.scalePoint()
      .domain(gridpoints.map(String))
      .range([height, 0])
      .padding(0.5);

    // Color scale: blue (purifying) -> white (neutral) -> red (positive)
    const color = d3.scaleLinear()
      .domain([0, 0.5, 1, 2, 10])
      .range(['#2166ac', '#67a9cf', '#f7f7f7', '#ef8a62', '#b2182b'] as any)
      .clamp(true);

    const magnitude = d3.scaleLinear()
      .domain([0, d3.max(gridData, d => +d[2]) || 1])
      .range([0, width / nGridpoints]);

    // Draw circles
    main.selectAll('.dot')
      .data(gridData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d[0].toFixed(2)) || 0)
      .attr('cy', d => y(d[1].toFixed(2)) || 0)
      .attr('r', d => magnitude(+d[2]) / 2)
      .attr('fill', d => color(+d[1] / (+d[0] + 0.001)));

    // Axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    main.append('g')
      .style('font', '12px')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'axis x-axis')
      .call(xAxis);

    main.append('g')
      .attr('class', 'axis')
      .call(yAxis);

    d3.selectAll('.x-axis > .tick > text')
      .attr('transform', 'rotate(-90) translate(-20, -15)');

    // Axis labels
    main.append('text')
      .attr('transform', `translate(${width / 2},${height + 55})`)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Synonymous substitution rate (α)');

    main.append('text')
      .attr('transform', `translate(-45,${height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Non-synonymous substitution rate (β)');

    // Color bar
    const linearGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'colorbar-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');

    // Gradient: top (high ω) = red, middle (ω=1) = white, bottom (low ω) = blue
    linearGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#b2182b'); // High ω (positive selection)

    linearGradient.append('stop')
      .attr('offset', '25%')
      .attr('stop-color', '#ef8a62'); // ω > 1

    linearGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#f7f7f7'); // ω = 1 (neutral)

    linearGradient.append('stop')
      .attr('offset', '75%')
      .attr('stop-color', '#67a9cf'); // ω < 1

    linearGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2166ac'); // Low ω (purifying selection)

    const colorbar = svg.append('g')
      .attr('transform', `translate(${margin.left + width},${margin.top})`);

    colorbar.append('rect')
      .attr('fill', 'url(#colorbar-gradient)')
      .attr('x', 5)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', height);

    colorbar.append('text')
      .attr('x', 15)
      .attr('y', height + 15)
      .attr('text-anchor', 'middle')
      .text('ω');

    const colorbarScale = d3.scaleLinear()
      .domain([0, 0.5, 1, 2, 10])
      .range([height, height * 0.75, height / 2, height * 0.25, 0]);

    const colorbarAxis = d3.axisRight(colorbarScale)
      .tickValues([0, 0.5, 1, 2, 10])
      .tickFormat(d3.format('.1f'));

    colorbar.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(25,0)')
      .call(colorbarAxis);
  }

  function getGridDataForSite(site: number): number[][] {
    if (!data?.posterior || !data?.['data partitions']) return data.grid;

    // Find partition and index for this site
    let partition = 0;
    let index = -1;
    const partitions = Object.values(data['data partitions']);

    for (let p = 0; p < partitions.length; p++) {
      const coverage = partitions[p].coverage[0];
      const idx = coverage.indexOf(site - 1);
      if (idx > -1) {
        partition = p;
        index = idx;
        break;
      }
    }

    if (index === -1) return data.grid;

    // Get site-specific posterior
    const sitePosterior = data.posterior[partition][index][0];

    // Combine with grid coordinates
    return data.grid.map((d, i) => [
      d[0],
      d[1],
      sitePosterior[i]
    ]);
  }

  function renderTree() {
    if (!data || !treeContainer) return;

    const newick = getTreeNewick(data);
    if (!newick) return;

    try {
      const tree = new phylotree(newick);

      const renderedTree = tree.render({
        container: '.fubar-tree-container',
        height: treeHeight,
        width: treeWidth,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'show-scale': showScale,
        'is-radial': false,
        'show-menu': false,
        selectable: false
      });

      treeContainer.innerHTML = '';
      treeContainer.appendChild(renderedTree.show());
    } catch (error) {
      console.error('Error rendering tree:', error);
    }
  }

  // Export to CSV
  function exportToCSV() {
    const headers = ['Site', 'Partition', 'α', 'β', 'α-β', 'Prob[α>β]', 'Prob[α<β]'];
    const rows = tableData.map(row => [
      row.Site,
      row.Partition,
      formatter(row.α),
      formatter(row.β),
      formatter(row['α-β']),
      formatter(row['Prob[α>β]']),
      formatter(row['Prob[α<β]'])
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fubar-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => {
    renderPosteriorPlot();
    if (showTree) {
      renderTree();
    }
  });

  $: if (selectedSite !== undefined || posteriorProbability) {
    renderPosteriorPlot();
  }

  $: if (showTree && treeContainer) {
    renderTree();
  }
</script>

<style>
  .fubar-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    max-width: 1200px;
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

  .positive-selection-row {
    background-color: #d4edda !important;
  }

  .negative-selection-row {
    background-color: #f8f9fa !important;
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

  .input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
  }

  .input-group input {
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .input-group input.error {
    border-color: #dc3545;
  }

  .alert {
    padding: 10px 15px;
    margin: 10px 0;
    border-radius: 4px;
  }

  .alert-danger {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .alert-info {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
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

  .pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 20px 0;
  }

  .pagination button {
    padding: 5px 10px;
    border: 1px solid #ddd;
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
    padding: 8px 16px;
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

  .viz-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  .description {
    color: #666;
    font-size: 14px;
    margin: 10px 0;
    line-height: 1.6;
  }

  .tree-controls {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    align-items: center;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 5px;
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
</style>

<div class="fubar-container">
  <section id="summary-tab">
    <h2>FUBAR Summary</h2>
    {#if summary}
      <div class="summary-box">
        <p>
          FUBAR <strong class="highlight">found evidence</strong> of
        </p>
        <p>
          <i>+</i> pervasive positive/diversifying selection at
          <span class="highlight">{summary.positiveSites}</span> sites
        </p>
        <p>
          <i>−</i> pervasive negative/purifying selection at
          <span class="highlight">{summary.negativeSites}</span> sites
        </p>
        <p>
          with posterior probability of
          <input
            type="number"
            value={posteriorProbability}
            min="0"
            max="1"
            step="0.01"
            on:input={(e) => posteriorProbability = parseFloat(e.currentTarget.value)}
            style="display: inline-block; margin-left: 5px; width: 100px;"
          />.
        </p>
        <hr />
        <p class="description">
          <small>
            See <a href="http://www.hyphy.org/methods/selection-methods/#fubar">here</a> for more information about the FUBAR method.
            <br />
            Please cite <a href="http://www.ncbi.nlm.nih.gov/pubmed/23420840" target="_blank">PMID 23420840</a> if you use this result in a publication, presentation, or other scientific work.
          </small>
        </p>
      </div>
    {/if}
  </section>

  <section id="plot-tab">
    <h2>Posterior Rate Distribution</h2>

    {#if inputError}
      <div class="alert alert-danger">
        <i>⚠</i> Enter a valid site (a number from 1 to {data?.input?.['number of sites'] || 0}).
      </div>
    {/if}

    <div class="control-group">
      <div class="input-group">
        <label for="site-input">Site:</label>
        <input
          id="site-input"
          type="text"
          placeholder="Alignment wide"
          value={selectedSite || ''}
          on:input={handleSiteInput}
          class:error={inputError}
        />
      </div>
    </div>

    <div class="viz-container" bind:this={vizContainer}></div>

    <p class="description">
      This graph shows the posterior distribution over the discretized rate grid.
      The size of a dot is proportional to the posterior weight allocated to that gridpoint,
      and the color shows the intensity of selection (ω = β/α): <strong style="color: #2166ac;">blue</strong> indicates
      purifying selection (ω &lt; 1), <strong style="color: #f7f7f7; background: #666; padding: 0 4px;">white</strong> indicates
      neutral evolution (ω ≈ 1), and <strong style="color: #b2182b;">red</strong> indicates positive selection (ω &gt; 1).
      Site-specific distributions can be viewed by entering a site number in the input box above. When empty,
      the alignment-wide distribution will be shown.
    </p>
  </section>

  <section id="table-tab">
    <h2>FUBAR Site Table</h2>

    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <div class="alert alert-info" style="flex: 1; background-color: #d4edda;">
        Positively selected sites with evidence are highlighted in green.
      </div>
      <div class="alert alert-info" style="flex: 1; background-color: #f8f9fa;">
        Negatively selected sites with evidence are highlighted in gray.
      </div>
    </div>

    <button class="btn btn-secondary" on:click={exportToCSV}>
      Export to CSV
    </button>

    <table>
      <thead>
        <tr>
          <th on:click={() => handleSort('Site')}>Site {sortColumn === 'Site' ? (sortAscending ? '▲' : '▼') : ''}</th>
          <th on:click={() => handleSort('Partition')}>Partition {sortColumn === 'Partition' ? (sortAscending ? '▲' : '▼') : ''}</th>
          <th on:click={() => handleSort('α')} title="Synonymous substitution rate">α {sortColumn === 'α' ? (sortAscending ? '▲' : '▼') : ''}</th>
          <th on:click={() => handleSort('β')} title="Non-synonymous substitution rate">β {sortColumn === 'β' ? (sortAscending ? '▲' : '▼') : ''}</th>
          <th on:click={() => handleSort('α-β')} title="Difference between α and β">α-β {sortColumn === 'α-β' ? (sortAscending ? '▲' : '▼') : ''}</th>
          <th on:click={() => handleSort('Prob[α>β]')} title="Probability of negative selection">Prob[α&gt;β] {sortColumn === 'Prob[α>β]' ? (sortAscending ? '▲' : '▼') : ''}</th>
          <th on:click={() => handleSort('Prob[α<β]')} title="Probability of positive selection">Prob[α&lt;β] {sortColumn === 'Prob[α<β]' ? (sortAscending ? '▲' : '▼') : ''}</th>
        </tr>
      </thead>
      <tbody>
        {#each paginatedData as row}
          <tr class={row.className}>
            <td>{row.Site}</td>
            <td>{row.Partition}</td>
            <td>{formatter(row.α)}</td>
            <td>{formatter(row.β)}</td>
            <td>{formatter(row['α-β'])}</td>
            <td>{formatter(row['Prob[α>β]'])}</td>
            <td>{formatter(row['Prob[α<β]'])}</td>
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
  </section>

  <section id="tree-tab">
    <h2>Phylogenetic Tree</h2>

    <div class="control-group">
      <div class="tree-controls">
        <div class="checkbox-group">
          <input type="checkbox" id="show-tree" bind:checked={showTree} />
          <label for="show-tree">Show Tree</label>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="show-scale" bind:checked={showScale} />
          <label for="show-scale">Show Scale</label>
        </div>
      </div>
    </div>

    {#if showTree}
      <div class="fubar-tree-container" bind:this={treeContainer}></div>
    {/if}
  </section>
</div>
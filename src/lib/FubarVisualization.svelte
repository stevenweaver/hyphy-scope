<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css"
  />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { phylotree } from 'phylotree';
  import {
    parseFubarJSON,
    getTreeNewick,
    type ParsedFubar,
    type FubarParsedSite,
    type FubarMeta
  } from './utils/fubar-utils.js';
  import {
    plotManhattan,
    plotRates,
    plotHeatmap,
    plotSitePosterior
  } from './utils/fubar-plots.js';

  export let data: any = null;

  // Parsed data
  let parsed: ParsedFubar | null = null;
  let meta: FubarMeta = { sequences: 0, codons: 0, filename: "Unknown", treeLength: 0, settings: {}, isBStill: false };
  let sites: FubarParsedSite[] = [];

  $: if (data) {
    try {
      parsed = parseFubarJSON(data);
      meta = parsed.meta;
      sites = parsed.sites;
    } catch (e) {
      console.error("[FUBAR] Parse error:", e);
      parsed = null;
      sites = [];
    }
  } else {
    parsed = null;
    sites = [];
  }

  // Controls
  let threshold = 0.9;
  let evidenceType: 'probability' | 'bayesFactor' = 'probability';

  // B-STILL metric options
  const metricOptions = [
    { value: 'positive', label: 'Positive Selection', prob: 'probPos', bf: 'bfPos' },
    { value: 'invariant', label: 'Invariant (α=β=0)', prob: 'probInv', bf: 'ebfInv' },
    { value: 'alpha0', label: 'Alpha Zero (α=0)', prob: 'probAlpha0', bf: 'ebfAlpha0' },
    { value: 'beta0', label: 'Beta Zero (β=0)', prob: 'probBeta0', bf: 'ebfBeta0' },
    { value: 'proximal', label: 'Proximal (α,β≈0)', prob: 'probProx', bf: 'ebfProx' }
  ];
  let selectedMetricIdx = 0;
  $: availableMetrics = meta.isBStill ? metricOptions : [metricOptions[0]];
  $: currentMetric = availableMetrics[selectedMetricIdx] || availableMetrics[0];
  $: activeMetricKey = evidenceType === 'probability' ? currentMetric.prob : currentMetric.bf;
  $: effectiveThreshold = evidenceType === 'bayesFactor' ? 10 : threshold;

  // Significant sites
  $: sigSites = sites.filter(d => {
    const val = d[activeMetricKey];
    return val !== undefined && val >= effectiveThreshold;
  });

  // Site table sorting
  let sortColumn = 'site';
  let sortAsc = true;

  $: sortedSigSites = [...sigSites].sort((a, b) => {
    const av = a[sortColumn] as number, bv = b[sortColumn] as number;
    if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
    return 0;
  });

  function toggleSort(col: string) {
    if (sortColumn === col) sortAsc = !sortAsc;
    else { sortColumn = col; sortAsc = true; }
  }

  // Heatmap scale
  let heatmapScale: 'log' | 'linear' | 'sqrt' = 'log';

  // Site deep dive
  let deepDiveSite = 1;
  $: deepDiveSiteIdx = deepDiveSite - 1;
  $: deepDiveSiteData = sites.length > 0 && deepDiveSite >= 1 && deepDiveSite <= sites.length
    ? sites[deepDiveSiteIdx]
    : null;

  // Tree controls
  let showTree = true;
  let treeWidth = 800;
  let treeHeight = 600;
  let showScale = true;

  // Plot containers
  let manhattanContainer: HTMLDivElement;
  let ratesContainer: HTMLDivElement;
  let heatmapContainer: HTMLDivElement;
  let sitePosteriorContainer: HTMLDivElement;
  let globalPriorContainer: HTMLDivElement;
  let treeContainer: HTMLDivElement;

  let mounted = false;
  onMount(() => { mounted = true; });

  // Formatting
  const fmt = d3.format(".4f");
  const fmt3 = d3.format(".3f");

  function renderToContainer(container: HTMLDivElement | undefined, plotFn: () => any) {
    if (!container) return;
    container.innerHTML = '';
    try {
      const el = plotFn();
      if (el) container.appendChild(el);
    } catch (e) {
      console.error("[FUBAR] Plot render error:", e);
    }
  }

  // Manhattan plot
  $: if (mounted && sites.length > 0) {
    renderToContainer(manhattanContainer, () =>
      plotManhattan(sites, { width: 900, threshold: effectiveThreshold, metric: activeMetricKey })
    );
  }

  // Rates plot
  $: if (mounted && sites.length > 0) {
    renderToContainer(ratesContainer, () => plotRates(sites, { width: 900 }));
  }

  // Heatmap
  $: if (mounted && parsed?.grid) {
    renderToContainer(heatmapContainer, () =>
      plotHeatmap(parsed!.grid, { width: 800, scaleType: heatmapScale })
    );
  }

  // Site posterior
  $: if (mounted && parsed?.grid && deepDiveSiteData) {
    renderToContainer(sitePosteriorContainer, () =>
      plotSitePosterior(deepDiveSiteIdx, parsed!.grid, parsed!.posterior, { width: 500 })
    );
    renderToContainer(globalPriorContainer, () =>
      plotHeatmap(parsed!.grid, { width: 500, title: "Global Prior" })
    );
  }

  // Tree rendering
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

  $: if (mounted && showTree && treeContainer && data) {
    renderTree();
  }

  // CSV Export
  function exportToCSV() {
    const baseCols = ['Site', 'α', 'β', 'α-β', 'Prob[α<β]'];
    const bstillCols = meta.isBStill
      ? ['Prob[α=β=0]', 'EBF[α=β=0]', 'Prob[α,β≈0]', 'EBF[α,β≈0]']
      : [];
    const headers = [...baseCols, ...bstillCols];

    const rows = sites.map(s => {
      const base = [s.site, fmt3(s.alpha), fmt3(s.beta), fmt3(s.diff), fmt(s.probPos)];
      const extra = meta.isBStill
        ? [fmt(s.probInv ?? 0), fmt(s.ebfInv ?? 0), fmt(s.probProx ?? 0), fmt(s.ebfProx ?? 0)]
        : [];
      return [...base, ...extra];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fubar-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="fubar-visualization">
  {#if !data}
    <div class="loading">Loading FUBAR data...</div>
  {:else}
    <!-- Section 1: Summary Header -->
    <section class="section">
      <h2>FUBAR {meta.isBStill ? '(B-STILL)' : ''} Analysis Results</h2>
      <p class="description">
        <strong>{meta.isBStill ? 'B-STILL' : 'FUBAR'}</strong> —
        {meta.isBStill
          ? 'Bayesian Significance Test of Invariant Low Likelihoods'
          : 'Fast Unconstrained Bayesian AppRoximation for inferring selection'}
      </p>

      <div class="summary-tiles">
        <div class="tile">
          <div class="tile-number">{meta.sequences}</div>
          <div class="tile-label">seqs</div>
          <div class="tile-separator">&times;</div>
          <div class="tile-number">{meta.codons}</div>
          <div class="tile-label">codons</div>
        </div>
        <div class="tile">
          <div class="tile-number">{meta.treeLength ? meta.treeLength.toFixed(2) : "-"}</div>
          <div class="tile-label">total subs/site</div>
        </div>
        <div class="tile">
          <div class="tile-number" class:sig-color={sigSites.length > 0}>
            {sigSites.length}
            <span class="tile-label">/ {sites.length} total</span>
          </div>
          <div class="tile-label">significant sites</div>
        </div>
      </div>

      {#if meta.settings}
        <div class="settings-info">
          <strong>Method:</strong> {meta.settings.method || 'MCMC'}
          {#if meta.settings.chains} | <strong>Chains:</strong> {meta.settings.chains}{/if}
          {#if meta.settings['chain-length']} | <strong>Length:</strong> {meta.settings['chain-length'].toLocaleString()}{/if}
          {#if meta.settings['grid size']} | <strong>Grid:</strong> {meta.settings['grid size']}×{meta.settings['grid size']}{/if}
        </div>
      {/if}

      <div class="controls">
        {#if meta.isBStill}
          <label>
            Metric:
            <select bind:value={selectedMetricIdx}>
              {#each availableMetrics as m, i}
                <option value={i}>{m.label}</option>
              {/each}
            </select>
          </label>
        {/if}

        <label>
          Evidence:
          <select bind:value={evidenceType}>
            <option value="probability">Posterior Probability</option>
            <option value="bayesFactor">Bayes Factor</option>
          </select>
        </label>

        {#if evidenceType === 'probability'}
          <label>
            Threshold:
            <input type="range" bind:value={threshold} min="0.5" max="0.999" step="0.01" />
            <span class="threshold-value">{threshold.toFixed(2)}</span>
          </label>
        {:else}
          <label>
            BF Threshold:
            <input type="number" bind:value={effectiveThreshold} min="1" step="1" />
          </label>
        {/if}
      </div>
    </section>

    <!-- Section 2: Significant Sites Table -->
    <section class="section">
      <h2>Significant Sites ({sigSites.length})</h2>

      {#if sigSites.length > 0}
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th on:click={() => toggleSort('site')}>Site</th>
                <th on:click={() => toggleSort('alpha')}>α</th>
                <th on:click={() => toggleSort('beta')}>β</th>
                <th on:click={() => toggleSort('probPos')}>Prob[α&lt;β]</th>
                {#if meta.isBStill}
                  <th on:click={() => toggleSort('probInv')}>Prob[Inv]</th>
                  <th on:click={() => toggleSort('ebfInv')}>EBF[Inv]</th>
                  <th on:click={() => toggleSort('probProx')}>Prob[Prox]</th>
                  <th on:click={() => toggleSort('ebfProx')}>EBF[Prox]</th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each sortedSigSites as site}
                <tr>
                  <td>{site.site}</td>
                  <td>{fmt3(site.alpha)}</td>
                  <td>{fmt3(site.beta)}</td>
                  <td class:sig-cell={site.probPos >= threshold}>{fmt(site.probPos)}</td>
                  {#if meta.isBStill}
                    <td class:sig-cell={(site.probInv ?? 0) >= threshold}>{fmt(site.probInv ?? 0)}</td>
                    <td>{fmt(site.ebfInv ?? 0)}</td>
                    <td class:sig-cell={(site.probProx ?? 0) >= threshold}>{fmt(site.probProx ?? 0)}</td>
                    <td>{fmt(site.ebfProx ?? 0)}</td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="empty-state">No sites exceed the current threshold.</div>
      {/if}
    </section>

    <!-- Section 3: Visualizations -->
    <section class="section">
      <h2>Visualizations</h2>

      <div class="card">
        <h3>Manhattan Plot</h3>
        <div class="plot-container" bind:this={manhattanContainer}></div>
      </div>

      <div class="card">
        <h3>Site-level Rates</h3>
        <div class="plot-container" bind:this={ratesContainer}></div>
      </div>

      <div class="card">
        <h3>Rate Distribution Heatmap</h3>
        <div class="controls">
          <label>
            Scale:
            <select bind:value={heatmapScale}>
              <option value="log">Log</option>
              <option value="linear">Linear</option>
              <option value="sqrt">Sqrt</option>
            </select>
          </label>
        </div>
        <div class="plot-container" bind:this={heatmapContainer}></div>
      </div>
    </section>

    <!-- Section 4: Site Deep Dive -->
    <section class="section">
      <h2>Site Deep Dive</h2>

      <div class="controls">
        <label>
          Site:
          <input
            type="number"
            bind:value={deepDiveSite}
            min="1"
            max={sites.length}
            style="width: 80px;"
          />
          <span class="muted">/ {sites.length}</span>
        </label>
      </div>

      {#if deepDiveSiteData}
        <div class="deep-dive-layout">
          <div class="deep-dive-sidebar">
            <div class="card">
              <h3>Site {deepDiveSite} Statistics</h3>
              <table class="stats-table">
                <tbody>
                  <tr><td class="muted">α (synonymous)</td><td class="bold right">{fmt3(deepDiveSiteData.alpha)}</td></tr>
                  <tr><td class="muted">β (non-synonymous)</td><td class="bold right">{fmt3(deepDiveSiteData.beta)}</td></tr>
                  <tr><td class="muted">β - α</td><td class="bold right">{fmt3(deepDiveSiteData.diff)}</td></tr>
                  <tr><td class="muted">Prob[α &lt; β]</td><td class="bold right">{fmt(deepDiveSiteData.probPos)}</td></tr>
                  {#if meta.isBStill}
                    <tr><td class="muted">Prob[Invariant]</td><td class="bold right">{fmt(deepDiveSiteData.probInv ?? 0)}</td></tr>
                    <tr><td class="muted">EBF[Invariant]</td><td class="bold right">{fmt(deepDiveSiteData.ebfInv ?? 0)}</td></tr>
                    <tr><td class="muted">Prob[Proximal]</td><td class="bold right">{fmt(deepDiveSiteData.probProx ?? 0)}</td></tr>
                    <tr><td class="muted">EBF[Proximal]</td><td class="bold right">{fmt(deepDiveSiteData.ebfProx ?? 0)}</td></tr>
                  {/if}
                </tbody>
              </table>
            </div>
          </div>

          <div class="deep-dive-main">
            <div class="card">
              <h3>Site {deepDiveSite} Posterior</h3>
              <div class="centered-plot" bind:this={sitePosteriorContainer}></div>
            </div>
            <div class="card">
              <h3>Global Prior</h3>
              <div class="centered-plot" bind:this={globalPriorContainer}></div>
            </div>
          </div>
        </div>
      {/if}
    </section>

    <!-- Section 5: Phylogenetic Tree -->
    <section class="section">
      <h2>Phylogenetic Tree</h2>

      <div class="controls">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={showTree} />
          Show Tree
        </label>
        <label class="toggle-label">
          <input type="checkbox" bind:checked={showScale} />
          Show Scale
        </label>
      </div>

      {#if showTree}
        <div class="fubar-tree-container tree-container" bind:this={treeContainer}></div>
      {/if}
    </section>

    <!-- Section 6: CSV Export -->
    <section class="section">
      <button class="btn" on:click={exportToCSV}>
        Export to CSV
      </button>
      <p class="description">
        <small>
          See <a href="http://www.hyphy.org/methods/selection-methods/#fubar">here</a> for more information about the FUBAR method.
          <br />
          Please cite <a href="http://www.ncbi.nlm.nih.gov/pubmed/23420840" target="_blank">PMID 23420840</a> if you use this result in a publication, presentation, or other scientific work.
        </small>
      </p>
    </section>
  {/if}
</div>

<style>
  .fubar-visualization {
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

  .description {
    color: #555;
    margin-bottom: 1.5rem;
  }

  .section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #eee;
  }

  h2 { margin: 0 0 1rem 0; color: #333; }
  h3 { margin: 0 0 0.75rem 0; color: #444; font-size: 1rem; }

  /* Summary tiles */
  .summary-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .tile {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    text-align: center;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .tile-number { font-size: 1.5rem; font-weight: bold; color: #333; }
  .tile-label { font-size: 0.75rem; color: #888; }
  .tile-separator { font-size: 1.2rem; color: #aaa; margin: 0 0.25rem; }
  .sig-color { color: #d93025; }

  .settings-info {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }

  /* Controls */
  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .controls label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  .controls input[type="number"] {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .controls input[type="range"] {
    width: 120px;
  }

  .controls select {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .threshold-value {
    font-weight: bold;
    min-width: 40px;
    text-align: center;
  }

  .toggle-label {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  .toggle-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

  /* Tables */
  .table-wrapper { overflow-x: auto; margin-bottom: 1.5rem; }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .data-table th {
    background: #f8f9fa;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
  }

  .data-table th:hover { background: #e9ecef; }

  .data-table td {
    padding: 6px 12px;
    border-bottom: 1px solid #eee;
  }

  .sig-cell { color: #d93025; font-weight: bold; }

  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .stats-table td { padding: 4px 0; }
  .muted { color: #888; }
  .bold { font-weight: bold; }
  .right { text-align: right; }

  /* Plot containers */
  .plot-container {
    min-height: 100px;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  .centered-plot {
    max-width: 500px;
    margin: 0 auto;
  }

  /* Cards */
  .card {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
  }

  /* Deep dive layout */
  .deep-dive-layout {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .deep-dive-sidebar {
    flex: 1;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .deep-dive-main {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .empty-state {
    padding: 1rem;
    text-align: center;
    color: #999;
    font-style: italic;
    font-size: 0.85rem;
  }

  .tree-container {
    min-height: 500px;
    overflow-x: auto;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
    background: white;
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

  .btn:hover { background: #0056b3; }

  @media (max-width: 768px) {
    .deep-dive-layout { flex-direction: column; }
    .deep-dive-sidebar { min-width: auto; }
  }
</style>

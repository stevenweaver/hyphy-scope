<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as Plot from "@observablehq/plot";
  import * as d3 from 'd3';
  import { phylotree } from 'phylotree';
  import {
    parsePrimeJSON,
    calculateBB,
    recoverSiteInfo,
    getConsensusSequence,
    alignSequences,
    plotSiteTree,
    geneticCode,
    type ParsedPrime,
    type PrimeSite,
    type PrimeMeta,
    type SiteInfo,
    type AlignmentResult
  } from './utils/prime-utils.js';
  import {
    plotManhattan,
    plotPropertyManhattan,
    plotLambdaHeatmap,
    plotComposition,
    plotPreferences,
    plotRadar,
    plotSubstitutionComparison
  } from './utils/prime-plots.js';

  // ── Props ──────────────────────────────────────────────────────────────────
  export let data: any = null;
  export let fdrThreshold: number = 0.1;

  // ── Reactive Data ──────────────────────────────────────────────────────────
  let parsed: ParsedPrime | null = null;
  let meta: PrimeMeta = { sequences: 0, codons: 0, filename: "Unknown", models: [], properties: [], residueProperties: {}, treeLength: 0 };
  let sites: PrimeSite[] = [];
  let sigSites: PrimeSite[] = [];
  let fdrIndices: Set<number> = new Set();

  $: if (data) {
    try {
      parsed = parsePrimeJSON(data);
      meta = parsed.meta;
    } catch (e) {
      console.error("[PRIME] Parse error:", e);
      parsed = null;
    }
  } else {
    parsed = null;
  }

  $: {
    const baseSites = parsed ? parsed.sites : [];
    sites = calculateBB(baseSites, fdrThreshold);
    sigSites = sites.filter(d => d.is_sig);
    fdrIndices = new Set(sites.map((d, i) => d.is_sig ? i : null).filter(d => d !== null) as number[]);
  }

  // ── Summary Section State ──────────────────────────────────────────────────
  let sortColumn = 'q_omnibus';
  let sortAsc = true;

  $: sortedSigSites = [...sigSites].sort((a, b) => {
    const av = a[sortColumn], bv = b[sortColumn];
    if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
    return 0;
  });

  function toggleSort(col: string) {
    if (sortColumn === col) sortAsc = !sortAsc;
    else { sortColumn = col; sortAsc = true; }
  }

  // ── Properties Section State ───────────────────────────────────────────────
  let selectedProperty: string = '';
  $: if (meta.properties.length > 0 && !selectedProperty) selectedProperty = meta.properties[0];

  // ── Deep Dive Section State ────────────────────────────────────────────────
  let sigOnlyFilter = false;
  let selectedSiteIdx = 0;
  let selectedTreeProp = "None";
  let selectedPair = "";

  $: variableSites = sites.filter(d => d.subs > 0);
  $: filteredSites = sigOnlyFilter ? variableSites.filter(d => d.is_sig) : variableSites;
  $: if (filteredSites.length > 0 && (selectedSiteIdx >= filteredSites.length || selectedSiteIdx < 0)) selectedSiteIdx = 0;
  $: currentSite = filteredSites.length > 0 ? filteredSites[selectedSiteIdx] : null;

  // Tree instance
  let treeInstance: any = null;
  $: {
    const treeString = data?.input?.trees?.["0"] || data?.MLE?.input?.trees?.["0"];
    if (treeString) {
      try { treeInstance = new phylotree(treeString); } catch (e) { treeInstance = null; }
    } else {
      treeInstance = null;
    }
  }

  // Site details
  let siteDetails: SiteInfo = { composition: [], substitutions: [], aggregatedSubstitutions: [] };
  $: if (currentSite && data && treeInstance) {
    siteDetails = recoverSiteInfo(currentSite.site - 1, data, treeInstance);
  } else {
    siteDetails = { composition: [], substitutions: [], aggregatedSubstitutions: [] };
  }

  $: validPairs = (siteDetails?.aggregatedSubstitutions || []).filter(d => !d.type.includes("-")).map(d => d.type);
  $: if (validPairs.length > 0 && !validPairs.includes(selectedPair)) selectedPair = validPairs[0];

  // ── Structure Section State ────────────────────────────────────────────────
  let pdbId = "2HHB";
  let pdbChains: Record<string, { sequence: string; resIndices: number[] }> = {};
  let selectedChain = "";
  let structureColorProp = "Omnibus";
  let structureSigOnly = false;
  let pdbStatus = "Ready.";
  let currentAlignment: AlignmentResult | null = null;
  let nglStage: any = null;
  let nglContainer: HTMLDivElement;
  let currentPdbText: string = "";
  let pdbLoading = false;

  // ── Plot Containers ────────────────────────────────────────────────────────
  let manhattanContainer: HTMLDivElement;
  let propManhattanContainer: HTMLDivElement;
  let heatmapContainer: HTMLDivElement;
  let compositionContainer: HTMLDivElement;
  let preferencesContainer: HTMLDivElement;
  let radarContainer: HTMLDivElement;
  let comparisonContainer: HTMLDivElement;
  let treeContainer: HTMLDivElement;

  let mounted = false;

  onMount(() => { mounted = true; });

  onDestroy(() => {
    if (nglStage) { nglStage.dispose(); nglStage = null; }
  });

  // ── Plot Rendering ─────────────────────────────────────────────────────────

  function renderToContainer(container: HTMLDivElement | undefined, plotFn: () => any) {
    if (!container) return;
    container.innerHTML = '';
    try {
      const el = plotFn();
      if (el) container.appendChild(el);
    } catch (e) {
      console.error("[PRIME] Plot render error:", e);
    }
  }

  // Summary manhattan
  $: if (mounted && sites.length > 0) {
    renderToContainer(manhattanContainer, () => plotManhattan(sites, { width: 900, fdrIndices }));
  }

  // Properties plots
  $: if (mounted && sites.length > 0 && selectedProperty) {
    renderToContainer(propManhattanContainer, () => plotPropertyManhattan(sites, selectedProperty, { width: 900 }));
  }
  $: if (mounted && sites.length > 0) {
    renderToContainer(heatmapContainer, () => plotLambdaHeatmap(sites, { width: 900 }));
  }

  // Deep dive plots
  $: if (mounted && currentSite) {
    renderToContainer(radarContainer, () => plotRadar(currentSite!, { width: 500, height: 400 }));
    renderToContainer(preferencesContainer, () => plotPreferences(currentSite!, meta, { width: 500 }));
  }
  $: if (mounted && siteDetails.composition.length > 0) {
    renderToContainer(compositionContainer, () => plotComposition(siteDetails.composition, { width: 300 }));
  }
  $: if (mounted && selectedPair && meta.residueProperties) {
    renderToContainer(comparisonContainer, () => plotSubstitutionComparison(selectedPair, meta, { width: 500, height: 400 }));
  }

  // Tree rendering
  $: if (mounted && currentSite && treeInstance && data) {
    renderToContainer(treeContainer, () =>
      plotSiteTree(currentSite!.site - 1, data, treeInstance, {
        width: 800,
        height: 600,
        colorProp: selectedTreeProp,
        residueProperties: meta.residueProperties
      })
    );
  }

  // ── Structure Methods ──────────────────────────────────────────────────────

  async function fetchPdb() {
    const id = pdbId.trim().toUpperCase();
    if (id.length < 4) return;

    pdbLoading = true;
    pdbStatus = `Fetching ${id}...`;

    try {
      const response = await fetch(`https://files.rcsb.org/download/${id}.pdb`);
      if (!response.ok) throw new Error(`PDB ${id} not found.`);
      const text = await response.text();

      const atomLines = text.split("\n").filter(l => l.startsWith("ATOM") && l.substring(12, 16).trim() === "CA");
      const resMap: Record<string, string> = {
        'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E', 'PHE': 'F',
        'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LYS': 'K', 'LEU': 'L',
        'MET': 'M', 'ASN': 'N', 'PRO': 'P', 'GLN': 'Q', 'ARG': 'R',
        'SER': 'S', 'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y'
      };

      const chains: Record<string, { sequence: string[]; resIndices: number[]; lastId: number }> = {};
      atomLines.forEach(l => {
        const cId = l.substring(21, 22).trim() || "A";
        const rId = parseInt(l.substring(22, 26));
        const rName = l.substring(17, 20).trim();
        if (!chains[cId]) chains[cId] = { sequence: [], resIndices: [], lastId: -1 };
        if (rId !== chains[cId].lastId) {
          chains[cId].sequence.push(resMap[rName] || "X");
          chains[cId].resIndices.push(rId);
          chains[cId].lastId = rId;
        }
      });

      pdbChains = {};
      Object.keys(chains).forEach(c => {
        pdbChains[c] = { sequence: chains[c].sequence.join(""), resIndices: chains[c].resIndices };
      });

      const chainKeys = Object.keys(pdbChains);
      if (chainKeys.length > 0) selectedChain = chainKeys[0];

      currentPdbText = text;
      updateStructureAlignment();
      renderStructure();
    } catch (e: any) {
      pdbStatus = `Error: ${e.message}`;
    } finally {
      pdbLoading = false;
    }
  }

  function updateStructureAlignment() {
    if (!pdbChains[selectedChain]) return;
    const consensus = getConsensusSequence(sites, data, treeInstance);
    currentAlignment = alignSequences(consensus, pdbChains[selectedChain].sequence);

    const sigMapped = Array.from(currentAlignment.mapping.keys()).filter(i => sites[i]?.is_sig).length;
    pdbStatus = `Aligned: ${currentAlignment.mapping.size} / ${sites.length} | Sig Mapped: ${sigMapped}`;
  }

  let _nglCache: any = null;
  async function loadNGL(): Promise<any> {
    if (_nglCache) return _nglCache;
    // Load NGL from CDN to avoid bundling the large (~5MB) WebGL library
    return new Promise((resolve, reject) => {
      if ((window as any).NGL) { _nglCache = (window as any).NGL; return resolve(_nglCache); }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/ngl@2.3.1/dist/ngl.js';
      script.onload = () => { _nglCache = (window as any).NGL; resolve(_nglCache); };
      script.onerror = () => reject(new Error('Failed to load NGL viewer from CDN'));
      document.head.appendChild(script);
    });
  }

  async function renderStructure() {
    if (!currentAlignment || !nglContainer || !currentPdbText) return;

    try {
      const NGL = await loadNGL();

      if (nglStage) { nglStage.dispose(); }
      nglContainer.innerHTML = '';

      const stage = new NGL.Stage(nglContainer, { backgroundColor: "white" });
      nglStage = stage;

      const blob = new Blob([currentPdbText], { type: 'text/plain' });
      const component = await stage.loadFile(blob, { ext: "pdb" });

      component.addRepresentation("cartoon", { color: "#f0f0f0", opacity: 0.2 });

      const cId = selectedChain;
      const prop = structureColorProp;
      const sigOnly = structureSigOnly;
      const alignment = currentAlignment;
      const chainData = pdbChains[cId];

      const schemeName = NGL.ColormakerRegistry.addScheme(function(this: any) {
        this.atomColor = function(atom: any) {
          if (atom.chainname !== cId) return 0xCCCCCC;
          const resIdx = chainData.resIndices.indexOf(atom.resno);
          if (resIdx === -1) return 0xCCCCCC;

          let sIdx = -1;
          for (const [s, r] of alignment.mapping.entries()) {
            if (r === resIdx) { sIdx = s; break; }
          }
          if (sIdx === -1) return 0xCCCCCC;

          const site = sites[sIdx];
          const internalName = prop !== "Omnibus" ? prop.replace(/ /g, "_") : null;
          const isSig = internalName ? site[internalName]?.sig : site.is_sig;

          if (sigOnly && !isSig) return 0xFFFFFF;

          if (prop === "Omnibus") return site.is_sig ? 0xd93025 : 0xCCCCCC;

          const val = site[internalName!]?.value || 0;
          const col = d3.rgb(
            d3.scaleLinear<string>().domain([-15, 0, 15]).range(["#d93025", "white", "#0072b2"])(val)
          );
          return (col.r << 16) | (col.g << 8) | col.b;
        };
      });

      component.addRepresentation("cartoon", { sele: `:${cId}`, color: schemeName });
      component.autoView(`:${cId}`);
      stage.handleResize();

      new ResizeObserver(() => stage.handleResize()).observe(nglContainer);
    } catch (e: any) {
      pdbStatus = `WebGL Error: ${e.message}`;
    }
  }

  // ── Helper for property icon ───────────────────────────────────────────────
  function propIcon(l: any): string {
    if (!l.sig) return '';
    return l.value > 0 ? 'Conserved' : 'Changing';
  }
</script>

<div class="prime-visualization">
  {#if !data}
    <div class="loading">Loading PRIME data...</div>
  {:else}
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 1: SUMMARY                                                  -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section">
      <h2>PRIME Analysis Results</h2>
      <p class="description"><strong>PRoperty Informed Models of Evolution</strong> — tests whether amino acid exchangeability depends on physicochemical properties.</p>

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

      <div class="controls">
        <label>
          FDR Threshold (q):
          <input type="number" bind:value={fdrThreshold} min="0" max="1" step="0.01" />
        </label>
      </div>

      {#if sigSites.length > 0}
        <div class="correction-info">
          <strong>Two-stage Selection Correction (BB + Holm-Bonferroni)</strong>
          <div>Stage 2 p-value threshold: <strong>{(fdrThreshold * (sigSites.length / Math.max(1, sites.length))).toFixed(6)}</strong></div>
          <div class="prop-legend">
            {#each meta.properties as p, i}
              <span><strong>P{i + 1}</strong>: {p}</span>
            {/each}
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th on:click={() => toggleSort('site')}>Site</th>
                <th on:click={() => toggleSort('q_omnibus')}>q</th>
                <th on:click={() => toggleSort('subs')}>Subs</th>
                <th on:click={() => toggleSort('aa')}>AA</th>
                <th on:click={() => toggleSort('r_ratio')}>R</th>
                {#each meta.properties as p, i}
                  <th title={p}>P{i + 1}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each sortedSigSites as site}
                <tr>
                  <td>{site.site}</td>
                  <td>{site.q_omnibus.toFixed(4)}</td>
                  <td>{site.subs}</td>
                  <td>{site.aa}</td>
                  <td>{site.r_ratio.toFixed(2)}</td>
                  {#each site.lambdas as l}
                    <td class:sig-cell={l.sig} title="raw p = {l.p.toExponential(2)}">
                      {l.value.toFixed(2)}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <div class="plot-container" bind:this={manhattanContainer}></div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 2: PROPERTIES                                               -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section">
      <h2>Property-Level Analysis</h2>

      <div class="threshold-bar">
        Omnibus FDR <strong>q = {fdrThreshold.toFixed(2)}</strong> |
        Stage 2 BB threshold = <strong>{(fdrThreshold * (sigSites.length / Math.max(1, sites.length))).toFixed(6)}</strong>
      </div>

      <div class="controls">
        <label>
          Focus Property:
          <select bind:value={selectedProperty}>
            {#each meta.properties as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="plot-container" bind:this={propManhattanContainer}></div>
      <div class="plot-container" bind:this={heatmapContainer}></div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 3: DEEP DIVE                                                -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section">
      <h2>Site Deep-Dive</h2>

      <div class="deep-dive-layout">
        <!-- Left sidebar -->
        <div class="deep-dive-sidebar">
          <div class="card">
            <div class="controls">
              <label>
                Select Site:
                <select bind:value={selectedSiteIdx}>
                  {#each filteredSites as s, i}
                    <option value={i}>{s.site}{s.is_sig ? " \u2022" : ""}</option>
                  {/each}
                </select>
              </label>
              <label class="toggle-label">
                <input type="checkbox" bind:checked={sigOnlyFilter} />
                Significant Only
              </label>
            </div>

            {#if currentSite}
              <table class="stats-table">
                <tbody>
                  <tr><td class="muted">Omnibus q</td><td class="bold right">{currentSite.q_omnibus.toFixed(4)}</td></tr>
                  <tr><td class="muted">Substitutions</td><td class="bold right">{siteDetails.substitutions.length}</td></tr>
                  <tr><td class="muted">Unique Amino Acids</td><td class="bold right">{currentSite.aa}</td></tr>
                  <tr><td class="muted">Redundancy (R)</td><td class="bold right">{currentSite.r_ratio.toFixed(2)}</td></tr>
                </tbody>
              </table>
            {/if}
          </div>

          {#if currentSite}
            <div class="card">
              <h3>Property Breakdown</h3>
              <table class="data-table compact">
                <thead>
                  <tr><th>ID</th><th>Lambda</th><th>q</th><th></th></tr>
                </thead>
                <tbody>
                  {#each currentSite.lambdas as l, i}
                    <tr>
                      <td>P{i + 1}</td>
                      <td>{l.value.toFixed(2)}</td>
                      <td class:sig-cell={l.adj_p != null && l.adj_p <= 0.10}>{l.adj_p?.toFixed(4) ?? "-"}</td>
                      <td>{propIcon(l)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}

          <div class="card">
            <h3>Evolutionary History</h3>
            <h4>Observed Composition</h4>
            <div class="inner-plot" bind:this={compositionContainer}></div>

            <h4>Substitution Counts</h4>
            <div class="sub-list">
              {#each siteDetails.aggregatedSubstitutions as d}
                <div class="sub-item">
                  <span class="mono">{d.type}</span>
                  <span class="bold">{d.count}</span>
                </div>
              {/each}
              {#if siteDetails.aggregatedSubstitutions.length === 0}
                <div class="empty-state">No substitutions detected.</div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Right panel -->
        <div class="deep-dive-main">
          <div class="card">
            <h3>Property Constraint Profile (Radar)</h3>
            <div class="centered-plot" bind:this={radarContainer}></div>
          </div>

          <div class="card">
            <h3>Predicted Amino Acid Preferences</h3>
            <div class="centered-plot" bind:this={preferencesContainer}></div>
          </div>

          <div class="card">
            <h3>Biophysical Property Comparison</h3>
            <div class="controls">
              <label>
                Compare Pair:
                <select bind:value={selectedPair}>
                  {#each validPairs as p}
                    <option value={p}>{p}</option>
                  {/each}
                </select>
              </label>
            </div>
            <div class="centered-plot" bind:this={comparisonContainer}></div>
          </div>
        </div>
      </div>

      <!-- Tree (full width) -->
      <div class="card">
        <h3>Site-Specific Phylogeny</h3>
        <div class="controls">
          <label>
            Color Branches By:
            <select bind:value={selectedTreeProp}>
              <option value="None">None</option>
              {#each meta.properties as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </label>
        </div>
        <div class="tree-container" bind:this={treeContainer}></div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 4: 3D STRUCTURE                                             -->
    <!-- ════════════════════════════════════════════════════════════════════ -->
    <section class="section">
      <h2>3D Structure Visualization</h2>

      <div class="structure-controls">
        <div class="control-group">
          <strong>PDB</strong>
          <input type="text" bind:value={pdbId} class="pdb-input" placeholder="e.g. 2HHB" />
          <button on:click={fetchPdb} disabled={pdbLoading}>
            {pdbLoading ? "Loading..." : "Fetch"}
          </button>
          <span class="separator"></span>
          <label>
            Chain:
            <select bind:value={selectedChain} disabled={Object.keys(pdbChains).length === 0}
              on:change={() => { updateStructureAlignment(); renderStructure(); }}>
              {#each Object.keys(pdbChains) as c}
                <option value={c}>Chain {c} ({pdbChains[c].sequence.length} AA)</option>
              {/each}
              {#if Object.keys(pdbChains).length === 0}
                <option>No data</option>
              {/if}
            </select>
          </label>
        </div>

        <div class="control-group">
          <strong>Style</strong>
          <label>
            Color:
            <select bind:value={structureColorProp} on:change={() => renderStructure()}>
              <option value="Omnibus">Omnibus</option>
              {#each meta.properties as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </label>
          <label class="toggle-label">
            <input type="checkbox" bind:checked={structureSigOnly} on:change={() => renderStructure()} />
            Sig Only
          </label>
        </div>

        <div class="control-group">
          <span class="status-text">{pdbStatus}</span>
        </div>
      </div>

      <div class="ngl-viewport">
        <div bind:this={nglContainer} class="ngl-canvas"></div>
        {#if currentAlignment && structureColorProp !== "Omnibus"}
          <div class="ngl-legend">
            <div class="legend-title">{structureColorProp} (lambda)</div>
            <div class="legend-gradient"></div>
            <div class="legend-labels"><span>-15</span><span>0</span><span>+15</span></div>
          </div>
        {:else if currentAlignment}
          <div class="ngl-legend">
            <div class="legend-title">Omnibus Test</div>
            <div class="legend-item"><span class="swatch sig"></span> Significant</div>
            <div class="legend-item"><span class="swatch neutral"></span> Neutral</div>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .prime-visualization {
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
  h4 { margin: 0.75rem 0 0.5rem 0; color: #666; font-size: 0.85rem; }

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

  /* Controls */
  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .controls label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #555; }
  .controls input[type="number"] { width: 80px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; }
  .controls select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; }

  .toggle-label { cursor: pointer; }
  .toggle-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

  /* Correction info */
  .correction-info {
    font-size: 0.85rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }

  .prop-legend {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 4px;
    margin-top: 0.5rem;
  }

  .threshold-bar {
    font-size: 0.85rem;
    color: #666;
    text-align: right;
    margin-bottom: 1rem;
  }

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

  .data-table.compact td, .data-table.compact th {
    padding: 4px 8px;
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
  .mono { font-family: monospace; font-weight: bold; font-size: 1.1rem; }

  /* Plot containers */
  .plot-container {
    min-height: 100px;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  .inner-plot {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 0.5rem;
    background: #fafafa;
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

  /* Deep Dive Layout */
  .deep-dive-layout {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .deep-dive-sidebar {
    flex: 1;
    min-width: 320px;
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

  .sub-list { max-height: 300px; overflow-y: auto; border-top: 1px solid #eee; }

  .sub-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 4px;
    border-bottom: 1px solid #f0f0f0;
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
    position: relative;
  }

  /* Structure section */
  .structure-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    font-size: 0.85rem;
  }

  .pdb-input {
    width: 80px;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: monospace;
  }

  .control-group button {
    padding: 6px 12px;
    cursor: pointer;
    font-weight: bold;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f8f9fa;
  }

  .control-group button:hover { background: #e9ecef; }
  .control-group button:disabled { opacity: 0.6; cursor: not-allowed; }

  .separator {
    border-left: 1px solid #ddd;
    height: 24px;
    margin: 0 4px;
  }

  .status-text { color: #666; }

  .ngl-viewport {
    width: 100%;
    height: 750px;
    background: white;
    position: relative;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .ngl-canvas { width: 100%; height: 100%; }

  .ngl-legend {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(255,255,255,0.9);
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #ddd;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-size: 0.75rem;
  }

  .legend-title { font-weight: bold; margin-bottom: 8px; color: #333; }

  .legend-gradient {
    height: 12px;
    width: 100px;
    background: linear-gradient(to right, #d93025, white, #0072b2);
    border: 1px solid #ccc;
    border-radius: 2px;
  }

  .legend-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 0.65rem;
    color: #666;
    font-family: monospace;
  }

  .legend-item { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
  .swatch { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
  .swatch.sig { background: #d93025; }
  .swatch.neutral { background: #ccc; }

  /* Responsive */
  @media (max-width: 768px) {
    .deep-dive-layout { flex-direction: column; }
    .deep-dive-sidebar { min-width: auto; }
    .structure-controls { flex-direction: column; }
  }
</style>

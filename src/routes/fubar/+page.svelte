<script lang="ts">
  import { onMount } from 'svelte';
  import { FubarVisualization, loadDataFromUrl, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let fubarData: any = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'fubar';

  const availableTestData = [
    { value: 'fel', label: 'FEL' },
    { value: 'meme', label: 'MEME' },
    { value: 'absrel', label: 'aBSREL' },
    { value: 'busted', label: 'BUSTED' },
    { value: 'relax', label: 'RELAX' },
    { value: 'slac', label: 'SLAC' },
    { value: 'fubar', label: 'FUBAR' }
  ];

  onMount(async () => {
    await loadTestData();
  });

  async function loadTestData() {
    try {
      loading = true;
      error = '';
      fubarData = await getTestData(selectedTestData);
    } catch (e: any) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      fubarData = null;
    } finally {
      loading = false;
    }
  }

  async function loadFromUrl() {
    if (!dataUrl.trim()) {
      error = 'Please enter a valid URL';
      return;
    }

    try {
      loading = true;
      error = '';
      fubarData = await loadDataFromUrl(dataUrl);
    } catch (e: any) {
      error = `Failed to load data from URL: ${e.message}`;
      fubarData = null;
    } finally {
      loading = false;
    }
  }

  async function loadFromFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      loading = true;
      error = '';
      const text = await file.text();
      fubarData = JSON.parse(text);
    } catch (e: any) {
      error = `Failed to load file: ${e.message}`;
      fubarData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>FUBAR Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of FUBAR (Fast Unconstrained Bayesian AppRoximation) analysis results" />
</svelte:head>

<div class="fubar-demo">
  <div class="header">
    <h1>FUBAR Analysis</h1>
    <p>
      Interactive visualization of Fast Unconstrained Bayesian AppRoximation for detecting
      pervasive diversifying and purifying selection at individual sites.
    </p>
  </div>

  <!-- Data Loading Section -->
  <div class="data-loading">
    <h2>Load Data</h2>

    <div class="loading-options">
      <!-- Test Data -->
      <div class="option">
        <h3>Test Data</h3>
        <div class="test-data-controls">
          <select bind:value={selectedTestData}>
            {#each availableTestData as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <button on:click={loadTestData} disabled={loading}>
            {loading ? 'Loading...' : 'Load Test Data'}
          </button>
        </div>
        <p class="help">Load example data to explore the visualization features.</p>
      </div>

      <!-- URL Loading -->
      <div class="option">
        <h3>Load from URL</h3>
        <div class="url-input">
          <input
            type="url"
            bind:value={dataUrl}
            placeholder="Enter JSON file URL..."
            disabled={loading}
          />
          <button on:click={loadFromUrl} disabled={loading || !dataUrl.trim()}>
            Load
          </button>
        </div>
        <p class="help">Load FUBAR results from a remote JSON file.</p>
      </div>

      <!-- File Upload -->
      <div class="option">
        <h3>Upload File</h3>
        <input
          type="file"
          accept=".json,.gz"
          on:change={loadFromFile}
          disabled={loading}
        />
        <p class="help">Upload a local FUBAR JSON file from your computer.</p>
      </div>
    </div>

    <!-- Status Messages -->
    {#if loading}
      <div class="status loading">
        <p>Loading data...</p>
      </div>
    {/if}

    {#if error}
      <div class="status error">
        <p>{error}</p>
        <button on:click={clearError}>Dismiss</button>
      </div>
    {/if}
  </div>

  <!-- Visualization -->
  {#if fubarData}
    <div class="visualization-section">
      <FubarVisualization data={fubarData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load FUBAR analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About FUBAR</h2>

    <h3>What is FUBAR?</h3>
    <p>
      <strong>FUBAR (Fast Unconstrained Bayesian AppRoximation)</strong>
      uses a Bayesian approach to infer the rate of non-synonymous (β) and synonymous (α)
      substitutions at each codon site. Sites where β > α are inferred to be under positive
      selection, while sites where β &lt; α are under purifying selection.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Site-specific analysis:</strong> Identifies individual sites under selection</li>
      <li><strong>Bayesian approach:</strong> Provides posterior probabilities for selection</li>
      <li><strong>Fast computation:</strong> Uses variational Bayes approximation for speed</li>
      <li><strong>Pervasive selection:</strong> Detects selection acting across all lineages</li>
      <li><strong>Visual exploration:</strong> Interactive posterior distribution plots</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>Posterior probability &gt; 0.9:</strong> Strong evidence for selection at a site</li>
      <li><strong>Prob[α&lt;β] &gt; 0.9:</strong> Evidence of positive/diversifying selection</li>
      <li><strong>Prob[α&gt;β] &gt; 0.9:</strong> Evidence of negative/purifying selection</li>
      <li><strong>Grid plot colors:</strong> Blue indicates purifying selection (ω &lt; 1), white indicates neutral evolution (ω ≈ 1), red indicates positive selection (ω &gt; 1)</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; FubarVisualization &#125; from 'hyphy-scope';

&lt;FubarVisualization data=&#123;fubarResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects FUBAR analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>MLE.content</code> - Site-level α, β, and posterior probabilities</li>
      <li><code>grid</code> - 2D grid of α and β values for visualization</li>
      <li><code>posterior</code> - Site-specific posterior distributions</li>
      <li><code>data partitions</code> - Partition information for multi-gene alignments</li>
      <li><code>input.trees</code> - Phylogenetic tree in Newick format</li>
    </ul>

    <h3>Method Comparison</h3>
    <p>FUBAR differs from other HyPhy methods:</p>
    <ul>
      <li><strong>vs. FEL:</strong> Uses Bayesian approach instead of maximum likelihood</li>
      <li><strong>vs. MEME:</strong> Detects pervasive selection, not episodic selection</li>
      <li><strong>vs. BUSTED:</strong> Provides site-by-site results, not gene-wide test</li>
      <li><strong>vs. SLAC:</strong> More powerful but computationally intensive</li>
    </ul>
  </div>
</div>

<style>
  .fubar-demo {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .header p {
    color: #666;
    font-size: 1.1rem;
  }

  .data-loading {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .loading-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 1rem;
  }

  .option {
    background: #fff;
    padding: 1.5rem;
    border-radius: 6px;
    border: 1px solid #dee2e6;
  }

  .option h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .option .help {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .url-input {
    display: flex;
    gap: 0.5rem;
  }

  .url-input input {
    flex: 1;
  }

  .test-data-controls {
    display: flex;
    gap: 0.5rem;
  }

  .test-data-controls select {
    flex: 1;
  }

  .status {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 4px;
  }

  .status.loading {
    background: #e3f2fd;
    color: #1976d2;
  }

  .status.error {
    background: #ffebee;
    color: #c62828;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .no-data {
    text-align: center;
    padding: 3rem;
    color: #666;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .visualization-section {
    margin-bottom: 3rem;
  }

  .usage-info {
    border-top: 1px solid #dee2e6;
    padding-top: 2rem;
  }

  .usage-info h2 {
    color: #333;
    margin-bottom: 1.5rem;
  }

  .usage-info h3 {
    color: #555;
    margin: 1.5rem 0 0.5rem 0;
  }

  .usage-info pre {
    background: #f4f4f4;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9rem;
  }

  .usage-info ul {
    margin-left: 1.5rem;
  }

  .usage-info li {
    margin: 0.5rem 0;
  }

  .usage-info code {
    background: #f4f4f4;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9rem;
  }

  input, button, select {
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  button {
    background: #007bff;
    color: #fff;
    cursor: pointer;
    border-color: #007bff;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
    border-color: #0056b3;
  }

  button:disabled {
    background: #6c757d;
    border-color: #6c757d;
    cursor: not-allowed;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { RelaxVisualization, loadDataFromUrl, loadDataFromStorage, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let relaxData = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'relax';

  const availableTestData = [
    { value: 'fel', label: 'FEL' },
    { value: 'meme', label: 'MEME' },
    { value: 'absrel', label: 'aBSREL' },
    { value: 'busted', label: 'BUSTED' },
    { value: 'relax', label: 'RELAX' },
    { value: 'slac', label: 'SLAC' }
  ];

  onMount(async () => {
    await loadTestData();
  });

  async function loadTestData() {
    try {
      loading = true;
      error = '';
      relaxData = await getTestData(selectedTestData);
    } catch (e) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      relaxData = null;
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
      relaxData = await loadDataFromUrl(dataUrl);
    } catch (e) {
      error = `Failed to load data from URL: ${e.message}`;
      relaxData = null;
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
      relaxData = await loadDataFromStorage(file);
    } catch (e) {
      error = `Failed to load file: ${e.message}`;
      relaxData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>RELAX Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of RELAX analysis results for detecting relaxed or intensified selection" />
</svelte:head>

<div class="relax-demo">
  <div class="header">
    <h1>RELAX Analysis</h1>
    <p>
      Interactive visualization of RELAX analysis for detecting relaxed or intensified selection.
      RELAX tests whether selection pressure has changed between test and reference branches.
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
        <p class="help">Load RELAX results from a remote JSON file.</p>
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
        <p class="help">Upload a local RELAX JSON file from your computer.</p>
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
  {#if relaxData}
    <div class="visualization-section">
      <RelaxVisualization data={relaxData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load RELAX analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About RELAX</h2>
    
    <h3>What is RELAX?</h3>
    <p>
      <strong>RELAX</strong> is a hypothesis test that asks whether the strength of natural 
      selection has been relaxed or intensified along a specified set of test branches relative 
      to a set of reference branches. It uses a covarion-style model to compare selection 
      pressure between branch sets.
    </p>

    <h3>Key Concepts</h3>
    <ul>
      <li><strong>K Parameter:</strong> Selection intensity parameter comparing test vs reference branches</li>
      <li><strong>K &gt; 1:</strong> Selection has been intensified on test branches</li>
      <li><strong>K &lt; 1:</strong> Selection has been relaxed on test branches</li>
      <li><strong>K = 1:</strong> No difference in selection pressure</li>
      <li><strong>Test branches:</strong> Branches where selection change is tested</li>
      <li><strong>Reference branches:</strong> Branches used as baseline for comparison</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>Significant p-value & K &gt; 1:</strong> Selection intensified on test branches</li>
      <li><strong>Significant p-value & K &lt; 1:</strong> Selection relaxed on test branches</li>
      <li><strong>Non-significant p-value:</strong> No detectable change in selection pressure</li>
      <li><strong>Rate distributions:</strong> Show ω categories and their proportions</li>
    </ul>

    <h3>Common Applications</h3>
    <ul>
      <li><strong>Gene duplication:</strong> Test if selection relaxed after duplication</li>
      <li><strong>Functional changes:</strong> Test if selection changed with function</li>
      <li><strong>Environmental shifts:</strong> Test if selection changed with environment</li>
      <li><strong>Lineage-specific evolution:</strong> Compare selection between lineages</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; RelaxVisualization &#125; from 'hyphy-scope';

&lt;RelaxVisualization data=&#123;relaxResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects RELAX analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>test results</code> - K parameter, p-value, and likelihood ratio test</li>
      <li><code>tested</code> - Definition of test and reference branch sets</li>
      <li><code>branch attributes</code> - Rate distributions for each branch set</li>
      <li><code>fits</code> - Model comparison statistics</li>
    </ul>

    <h3>Method Comparison</h3>
    <p>RELAX differs from other HyPhy methods:</p>
    <ul>
      <li><strong>vs. BUSTED:</strong> Tests selection change rather than presence</li>
      <li><strong>vs. aBSREL:</strong> Compares branch sets rather than testing individual branches</li>
      <li><strong>vs. FEL/MEME:</strong> Tests selection pressure changes rather than site-level selection</li>
    </ul>
  </div>
</div>

<style>
  .relax-demo {
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
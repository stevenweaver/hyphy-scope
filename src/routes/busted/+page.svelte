<script lang="ts">
  import { onMount } from 'svelte';
  import { BustedVisualization, loadDataFromUrl, loadDataFromStorage, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let bustedData = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'busted';

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
      bustedData = await getTestData(selectedTestData);
    } catch (e) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      bustedData = null;
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
      bustedData = await loadDataFromUrl(dataUrl);
    } catch (e) {
      error = `Failed to load data from URL: ${e.message}`;
      bustedData = null;
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
      bustedData = JSON.parse(text);
    } catch (e) {
      error = `Failed to load file: ${e.message}`;
      bustedData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>BUSTED Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of BUSTED (Branch-site Unrestricted Statistical Test for Episodic Diversification) analysis results" />
</svelte:head>

<div class="busted-demo">
  <div class="header">
    <h1>BUSTED Analysis</h1>
    <p>
      Interactive visualization of Branch-site Unrestricted Statistical Test for Episodic Diversification.
      BUSTED tests whether a gene has experienced positive selection at some sites along some branches.
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
        <p class="help">Load BUSTED results from a remote JSON file.</p>
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
        <p class="help">Upload a local BUSTED JSON file from your computer.</p>
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
  {#if bustedData}
    <div class="visualization-section">
      <BustedVisualization data={bustedData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load BUSTED analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About BUSTED</h2>
    
    <h3>What is BUSTED?</h3>
    <p>
      <strong>BUSTED (Branch-site Unrestricted Statistical Test for Episodic Diversification)</strong> 
      is a likelihood ratio test that provides evidence for positive selection occurring at 
      some sites along some branches in a phylogeny. Unlike site-specific methods, BUSTED 
      tests for selection at the gene level.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Gene-wide test:</strong> Tests whether ANY sites have experienced positive selection</li>
      <li><strong>No multiple testing:</strong> Single test per gene, avoiding multiple comparison issues</li>
      <li><strong>Flexible framework:</strong> Can test specific branches or all branches</li>
      <li><strong>Evidence ratios:</strong> Provides site-level evidence for positive selection</li>
      <li><strong>Robust method:</strong> Uses likelihood ratio test with known statistical properties</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>p-value &lt; 0.05:</strong> Evidence of positive selection somewhere in the gene</li>
      <li><strong>Evidence Ratios:</strong> Site-level support for positive selection</li>
      <li><strong>≥100:</strong> Strong evidence for positive selection at site</li>
      <li><strong>≥10:</strong> Moderate evidence for positive selection</li>
      <li><strong>≥3:</strong> Weak evidence for positive selection</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; BustedVisualization &#125; from 'hyphy-scope';

&lt;BustedVisualization data=&#123;bustedResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects BUSTED analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>test results</code> - Overall test statistics and p-value</li>
      <li><code>Evidence Ratios</code> - Site-level evidence for positive selection</li>
      <li><code>Synonymous site-posteriors</code> - Synonymous substitution rates</li>
      <li><code>fits</code> - Model comparison statistics</li>
    </ul>

    <h3>Method Comparison</h3>
    <p>BUSTED differs from other HyPhy methods:</p>
    <ul>
      <li><strong>vs. FEL/MEME:</strong> Tests gene-wide rather than site-by-site</li>
      <li><strong>vs. aBSREL:</strong> Tests all branches rather than individual branches</li>
      <li><strong>vs. RELAX:</strong> Tests for selection rather than relaxation of selection</li>
    </ul>
  </div>
</div>

<style>
  .busted-demo {
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
<script lang="ts">
  import { onMount } from 'svelte';
  import { SlacVisualization, loadDataFromUrl, loadDataFromStorage, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let slacData = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'slac';

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
      slacData = await getTestData(selectedTestData);
    } catch (e) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      slacData = null;
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
      slacData = await loadDataFromUrl(dataUrl);
    } catch (e) {
      error = `Failed to load data from URL: ${e.message}`;
      slacData = null;
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
      slacData = await loadDataFromStorage(file);
    } catch (e) {
      error = `Failed to load file: ${e.message}`;
      slacData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>SLAC Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of SLAC (Single Likelihood Ancestor Counting) analysis results" />
</svelte:head>

<div class="slac-demo">
  <div class="header">
    <h1>SLAC Analysis</h1>
    <p>
      Interactive visualization of Single Likelihood Ancestor Counting analysis.
      SLAC uses maximum likelihood to infer synonymous and non-synonymous substitutions at each site.
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
        <p class="help">Load SLAC results from a remote JSON file.</p>
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
        <p class="help">Upload a local SLAC JSON file from your computer.</p>
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
  {#if slacData}
    <div class="visualization-section">
      <SlacVisualization data={slacData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load SLAC analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About SLAC</h2>
    
    <h3>What is SLAC?</h3>
    <p>
      <strong>SLAC (Single Likelihood Ancestor Counting)</strong> is a maximum likelihood method 
      for detecting sites under positive selection. It counts the number of synonymous (dS) and 
      non-synonymous (dN) substitutions at each site by reconstructing ancestral sequences.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Maximum likelihood:</strong> Uses ML to reconstruct ancestral sequences</li>
      <li><strong>Site-by-site analysis:</strong> Tests each codon site individually</li>
      <li><strong>dN/dS ratios:</strong> Calculates selection pressure at each site</li>
      <li><strong>Statistical testing:</strong> Provides p-values for significance</li>
      <li><strong>Fast computation:</strong> Efficient algorithm for large datasets</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>dN/dS &gt; 1:</strong> May indicate positive selection</li>
      <li><strong>dN/dS &lt; 1:</strong> Indicates purifying/negative selection</li>
      <li><strong>dN/dS ≈ 1:</strong> Indicates neutral evolution</li>
      <li><strong>p-value &lt; 0.1:</strong> Significant evidence for non-neutral evolution</li>
      <li><strong>Normalized dN-dS:</strong> Difference measure accounting for variance</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; SlacVisualization &#125; from 'hyphy-scope';

&lt;SlacVisualization data=&#123;slacResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects SLAC analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>MLE</code> - Maximum likelihood estimates for each site</li>
      <li><code>MLE.content</code> - Site-by-site results [dN, dS, dN-dS, dN/dS, p-value]</li>
      <li><code>data partitions</code> - Partition information for sites</li>
    </ul>

    <h3>Method Comparison</h3>
    <p>SLAC differs from other HyPhy methods:</p>
    <ul>
      <li><strong>vs. FEL:</strong> Uses counting approach rather than likelihood ratios</li>
      <li><strong>vs. MEME:</strong> Tests for consistent rather than episodic selection</li>
      <li><strong>vs. BUSTED:</strong> Site-level rather than gene-level testing</li>
      <li><strong>Speed:</strong> Faster than FEL but may be less powerful</li>
    </ul>
  </div>
</div>

<style>
  .slac-demo {
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
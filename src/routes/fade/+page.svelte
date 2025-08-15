<script lang="ts">
  import { onMount } from 'svelte';
  import { FadeVisualization, loadDataFromUrl, loadDataFromStorage, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let fadeData = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'fade';

  const availableTestData = [
    { value: 'fel', label: 'FEL' },
    { value: 'meme', label: 'MEME' },
    { value: 'absrel', label: 'aBSREL' },
    { value: 'busted', label: 'BUSTED' },
    { value: 'relax', label: 'RELAX' },
    { value: 'slac', label: 'SLAC' },
    { value: 'bgm', label: 'BGM' },
    { value: 'fade', label: 'FADE' }
  ];

  onMount(async () => {
    await loadTestData();
  });

  async function loadTestData() {
    try {
      loading = true;
      error = '';
      fadeData = await getTestData(selectedTestData);
    } catch (e) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      fadeData = null;
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
      fadeData = await loadDataFromUrl(dataUrl);
    } catch (e) {
      error = `Failed to load data from URL: ${e.message}`;
      fadeData = null;
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
      fadeData = await loadDataFromStorage(file);
    } catch (e) {
      error = `Failed to load file: ${e.message}`;
      fadeData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>FADE Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of FADE (FUBAR Approach to Directional Evolution) analysis results" />
</svelte:head>

<div class="fade-demo">
  <div class="header">
    <h1>FADE Analysis</h1>
    <p>
      Interactive visualization of FUBAR Approach to Directional Evolution analysis.
      FADE tests for directional selection toward specific amino acids.
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
        <p class="help">Load FADE results from a remote JSON file.</p>
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
        <p class="help">Upload a local FADE JSON file from your computer.</p>
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
  {#if fadeData}
    <div class="visualization-section">
      <FadeVisualization data={fadeData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load FADE analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About FADE</h2>
    
    <h3>What is FADE?</h3>
    <p>
      <strong>FADE (FUBAR Approach to Directional Evolution)</strong> is a maximum likelihood 
      method for testing directional selection toward specific amino acids. It extends FUBAR 
      to detect directional evolutionary bias in protein sequences.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Directional bias:</strong> Tests for selection toward specific amino acids</li>
      <li><strong>Maximum likelihood:</strong> Uses ML framework for parameter estimation</li>
      <li><strong>FUBAR extension:</strong> Built on the FUBAR methodology</li>
      <li><strong>Branch-level analysis:</strong> Detects directional bias on specific branches</li>
      <li><strong>Statistical testing:</strong> Provides likelihood ratio tests for significance</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>Positive bias:</strong> Selection favors specific amino acid changes</li>
      <li><strong>Negative bias:</strong> Selection disfavors certain amino acid changes</li>
      <li><strong>Magnitude:</strong> Strength of directional selection pressure</li>
      <li><strong>p-value &lt; 0.05:</strong> Significant evidence for directional bias</li>
      <li><strong>Branch patterns:</strong> Reveals lineage-specific directional evolution</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; FadeVisualization &#125; from 'hyphy-scope';

&lt;FadeVisualization data=&#123;fadeResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects FADE analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>test results</code> - Statistical test results (p-value, LRT)</li>
      <li><code>branch attributes</code> - Branch-specific bias measurements</li>
      <li><code>input</code> - Input parameters (sequences, sites)</li>
      <li><code>data partitions</code> - Partition information</li>
    </ul>

    <h3>Applications</h3>
    <ul>
      <li><strong>Protein evolution:</strong> Identify directional changes in protein function</li>
      <li><strong>Host adaptation:</strong> Detect adaptation to new host environments</li>
      <li><strong>Drug resistance:</strong> Understand directional changes in drug targets</li>
      <li><strong>Immune escape:</strong> Identify directional evolution in immune-targeted regions</li>
      <li><strong>Functional shifts:</strong> Detect systematic changes in protein function</li>
    </ul>

    <h3>Method Comparison</h3>
    <p>FADE differs from other HyPhy methods:</p>
    <ul>
      <li><strong>vs. FEL/MEME:</strong> Tests directional bias rather than positive selection</li>
      <li><strong>vs. RELAX:</strong> Detects bias toward specific changes, not intensity changes</li>
      <li><strong>vs. BUSTED:</strong> Branch-specific rather than gene-wide testing</li>
      <li><strong>Specialization:</strong> Designed specifically for directional evolution detection</li>
    </ul>
  </div>
</div>

<style>
  .fade-demo {
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
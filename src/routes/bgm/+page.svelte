<script lang="ts">
  import { onMount } from 'svelte';
  import { BgmVisualization, loadDataFromUrl, loadDataFromStorage, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let bgmData = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'bgm';

  const availableTestData = [
    { value: 'fel', label: 'FEL' },
    { value: 'meme', label: 'MEME' },
    { value: 'absrel', label: 'aBSREL' },
    { value: 'busted', label: 'BUSTED' },
    { value: 'relax', label: 'RELAX' },
    { value: 'slac', label: 'SLAC' },
    { value: 'bgm', label: 'BGM' }
  ];

  onMount(async () => {
    await loadTestData();
  });

  async function loadTestData() {
    try {
      loading = true;
      error = '';
      bgmData = await getTestData(selectedTestData);
    } catch (e) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      bgmData = null;
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
      bgmData = await loadDataFromUrl(dataUrl);
    } catch (e) {
      error = `Failed to load data from URL: ${e.message}`;
      bgmData = null;
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
      bgmData = JSON.parse(text);
      
      // Validate BGM data structure
      if (!bgmData.MLE && !bgmData['test results']) {
        throw new Error('Invalid BGM data format');
      }
    } catch (e) {
      error = `Failed to load file: ${e.message}`;
      bgmData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>BGM Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of BGM (Bayesian Graphical Model) analysis results" />
</svelte:head>

<div class="bgm-demo">
  <div class="header">
    <h1>BGM Analysis</h1>
    <p>
      Interactive visualization of Bayesian Graphical Model analysis.
      BGM detects correlated evolution between sites using graphical models.
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
        <p class="help">Load BGM results from a remote JSON file.</p>
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
        <p class="help">Upload a local BGM JSON file from your computer.</p>
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
  {#if bgmData}
    <div class="visualization-section">
      <BgmVisualization data={bgmData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load BGM analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About BGM</h2>
    
    <h3>What is BGM?</h3>
    <p>
      <strong>BGM (Bayesian Graphical Model)</strong> is a method for detecting correlated 
      evolution between sites in protein-coding sequences. It uses probabilistic graphical 
      models to identify pairs of sites that evolve in a coordinated manner.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Bayesian framework:</strong> Uses Bayesian inference for model selection</li>
      <li><strong>Graphical models:</strong> Models dependencies between sites</li>
      <li><strong>Correlation detection:</strong> Identifies correlated evolutionary patterns</li>
      <li><strong>Network analysis:</strong> Reveals evolutionary networks between sites</li>
      <li><strong>Statistical rigor:</strong> Provides posterior probabilities for correlations</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>High correlation:</strong> Sites evolve together (functional/structural constraints)</li>
      <li><strong>Positive correlation:</strong> Similar evolutionary pressures</li>
      <li><strong>Negative correlation:</strong> Compensatory changes</li>
      <li><strong>p-value &lt; 0.05:</strong> Significant evidence for correlation</li>
      <li><strong>Network structure:</strong> Reveals functional domains or interactions</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; BgmVisualization &#125; from 'hyphy-scope';

&lt;BgmVisualization data=&#123;bgmResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects BGM analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>test results</code> - Correlation results for site pairs</li>
      <li><code>data partitions</code> - Partition information for sites</li>
      <li><code>input</code> - Input parameters (sequences, sites)</li>
    </ul>

    <h3>Applications</h3>
    <ul>
      <li><strong>Protein structure:</strong> Identify structurally interacting residues</li>
      <li><strong>Functional domains:</strong> Discover co-evolving functional regions</li>
      <li><strong>Compensatory mutations:</strong> Find sites with coordinated changes</li>
      <li><strong>Drug resistance:</strong> Understand resistance mutation networks</li>
    </ul>
  </div>
</div>

<style>
  .bgm-demo {
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
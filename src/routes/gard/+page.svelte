<script lang="ts">
  import { onMount } from 'svelte';
  import { GardVisualization, loadDataFromUrl, loadDataFromStorage, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let gardData = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'gard';

  const availableTestData = [
    { value: 'fel', label: 'FEL' },
    { value: 'meme', label: 'MEME' },
    { value: 'absrel', label: 'aBSREL' },
    { value: 'busted', label: 'BUSTED' },
    { value: 'relax', label: 'RELAX' },
    { value: 'slac', label: 'SLAC' },
    { value: 'bgm', label: 'BGM' },
    { value: 'fade', label: 'FADE' },
    { value: 'gard', label: 'GARD' }
  ];

  onMount(async () => {
    await loadTestData();
  });

  async function loadTestData() {
    try {
      loading = true;
      error = '';
      gardData = await getTestData(selectedTestData);
    } catch (e) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      gardData = null;
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
      gardData = await loadDataFromUrl(dataUrl);
    } catch (e) {
      error = `Failed to load data from URL: ${e.message}`;
      gardData = null;
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
      gardData = await loadDataFromStorage(file);
    } catch (e) {
      error = `Failed to load file: ${e.message}`;
      gardData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>GARD Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of GARD (Genetic Algorithm for Recombination Detection) analysis results" />
</svelte:head>

<div class="gard-demo">
  <div class="header">
    <h1>GARD Analysis</h1>
    <p>
      Interactive visualization of Genetic Algorithm for Recombination Detection analysis.
      GARD identifies recombination breakpoints in sequence alignments.
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
        <p class="help">Load GARD results from a remote JSON file.</p>
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
        <p class="help">Upload a local GARD JSON file from your computer.</p>
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
  {#if gardData}
    <div class="visualization-section">
      <GardVisualization data={gardData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load GARD analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About GARD</h2>
    
    <h3>What is GARD?</h3>
    <p>
      <strong>GARD (Genetic Algorithm for Recombination Detection)</strong> is a method for 
      detecting recombination breakpoints in nucleotide sequence alignments. It uses genetic 
      algorithms to search for the optimal placement of breakpoints that best explain 
      phylogenetic incongruence in the data.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Genetic algorithm:</strong> Uses GA optimization for breakpoint detection</li>
      <li><strong>Model selection:</strong> Compares models with and without recombination</li>
      <li><strong>Breakpoint mapping:</strong> Identifies precise locations of recombination events</li>
      <li><strong>Statistical testing:</strong> Provides significance tests for recombination</li>
      <li><strong>Multiple breakpoints:</strong> Can detect multiple recombination events</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>Breakpoint position:</strong> Location where recombination occurred</li>
      <li><strong>Support values:</strong> Statistical support for each breakpoint</li>
      <li><strong>Confidence intervals:</strong> Uncertainty in breakpoint positions</li>
      <li><strong>p-value &lt; 0.05:</strong> Significant evidence for recombination</li>
      <li><strong>Model improvement:</strong> Better fit with recombination model</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; GardVisualization &#125; from 'hyphy-scope';

&lt;GardVisualization data=&#123;gardResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects GARD analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>breakpoints</code> - Array of detected breakpoint locations</li>
      <li><code>p-value</code> - Overall significance of recombination detection</li>
      <li><code>recombinants</code> - Information about recombinant sequences</li>
      <li><code>input</code> - Input parameters (sequences, sites)</li>
    </ul>

    <h3>Applications</h3>
    <ul>
      <li><strong>Viral evolution:</strong> Detect recombination in viral genomes</li>
      <li><strong>Population genetics:</strong> Identify recombination hotspots</li>
      <li><strong>Phylogenetic analysis:</strong> Account for recombination in tree construction</li>
      <li><strong>HIV research:</strong> Study recombination in HIV sequences</li>
      <li><strong>Bacterial genomics:</strong> Detect horizontal gene transfer events</li>
    </ul>

    <h3>Method Comparison</h3>
    <p>GARD differs from other recombination detection methods:</p>
    <ul>
      <li><strong>Model-based:</strong> Uses maximum likelihood framework</li>
      <li><strong>GA optimization:</strong> Efficient search through breakpoint space</li>
      <li><strong>Multiple breakpoints:</strong> Can handle complex recombination patterns</li>
      <li><strong>Statistical rigor:</strong> Provides formal hypothesis testing</li>
      <li><strong>HyPhy integration:</strong> Seamlessly works with other HyPhy analyses</li>
    </ul>

    <h3>Workflow Integration</h3>
    <p>GARD is often used as a preliminary step:</p>
    <ul>
      <li><strong>Before selection analysis:</strong> Detect recombination first</li>
      <li><strong>Data partitioning:</strong> Analyze non-recombinant segments separately</li>
      <li><strong>Model selection:</strong> Choose appropriate evolutionary models</li>
      <li><strong>Quality control:</strong> Identify problematic sequences or regions</li>
    </ul>
  </div>
</div>

<style>
  .gard-demo {
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
<script lang="ts">
  import { onMount } from 'svelte';
  import { MultiHitVisualization, loadDataFromUrl, type AnalysisType } from '$lib';
  import { getTestData } from '$lib/data/data-loader.js';

  let multihitData: any = null;
  let loading = false;
  let error = '';
  let dataUrl = '';
  let selectedTestData: AnalysisType = 'multihit';

  const availableTestData = [
    { value: 'fel', label: 'FEL' },
    { value: 'meme', label: 'MEME' },
    { value: 'absrel', label: 'aBSREL' },
    { value: 'busted', label: 'BUSTED' },
    { value: 'relax', label: 'RELAX' },
    { value: 'slac', label: 'SLAC' },
    { value: 'fubar', label: 'FUBAR' },
    { value: 'multihit', label: 'Multi-Hit' }
  ];

  onMount(async () => {
    await loadTestData();
  });

  async function loadTestData() {
    try {
      loading = true;
      error = '';
      multihitData = await getTestData(selectedTestData);
    } catch (e: any) {
      error = `Failed to load ${selectedTestData.toUpperCase()} test data: ${e.message}`;
      multihitData = null;
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
      multihitData = await loadDataFromUrl(dataUrl);
    } catch (e: any) {
      error = `Failed to load data from URL: ${e.message}`;
      multihitData = null;
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
      multihitData = JSON.parse(text);
    } catch (e: any) {
      error = `Failed to load file: ${e.message}`;
      multihitData = null;
    } finally {
      loading = false;
    }
  }

  function clearError() {
    error = '';
  }
</script>

<svelte:head>
  <title>Multi-Hit Analysis - HyPhy Scope</title>
  <meta name="description" content="Interactive visualization of Multi-Hit analysis results for detecting instantaneous multiple-nucleotide changes" />
</svelte:head>

<div class="multihit-demo">
  <div class="header">
    <h1>Multi-Hit Analysis</h1>
    <p>
      Interactive visualization for detecting instantaneous multiple-nucleotide substitutions
      in molecular evolution. Multi-Hit tests for evidence of double-hit and triple-hit mutations.
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
        <p class="help">Load Multi-Hit results from a remote JSON file.</p>
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
        <p class="help">Upload a local Multi-Hit JSON file from your computer.</p>
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
  {#if multihitData}
    <div class="visualization-section">
      <MultiHitVisualization data={multihitData} />
    </div>
  {:else if !loading}
    <div class="no-data">
      <h3>No Data Loaded</h3>
      <p>Please load Multi-Hit analysis data using one of the options above to see the visualization.</p>
    </div>
  {/if}

  <!-- Usage Information -->
  <div class="usage-info">
    <h2>About Multi-Hit</h2>

    <h3>What is Multi-Hit?</h3>
    <p>
      <strong>Multi-Hit</strong> is a method for detecting evidence of instantaneous multiple-nucleotide
      substitutions in molecular sequences. Traditional phylogenetic models assume that only single
      nucleotide changes occur at a time, but Multi-Hit tests whether allowing double-hit (two nucleotides)
      or triple-hit (three nucleotides) mutations provides a better fit to the data.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Multiple model comparisons:</strong> Tests 1H vs 2H, 2H vs 3H, and 3H vs 3HSI (synonymous islands)</li>
      <li><strong>Evidence ratios:</strong> Quantifies support for multi-hit substitutions at each site</li>
      <li><strong>Site-level resolution:</strong> Identifies specific sites with evidence of multi-nucleotide changes</li>
      <li><strong>Codon substitution analysis:</strong> Visualizes the flow of codon changes</li>
      <li><strong>Likelihood ratio tests:</strong> Statistical framework for model comparison</li>
    </ul>

    <h3>Model Types</h3>
    <ul>
      <li><strong>1H (Single-hit):</strong> Standard MG94 model with single nucleotide changes only</li>
      <li><strong>2H (Double-hit):</strong> MG94 with instantaneous double nucleotide substitutions</li>
      <li><strong>3H (Triple-hit):</strong> MG94 with double and triple nucleotide substitutions</li>
      <li><strong>3HSI (Triple-hit synonymous islands):</strong> Restricts triple-hits to synonymous changes</li>
    </ul>

    <h3>Interpretation</h3>
    <ul>
      <li><strong>Significant p-value:</strong> Evidence that the more complex model fits better</li>
      <li><strong>Evidence Ratios (ER):</strong> Site-specific support; higher values = stronger evidence</li>
      <li><strong>ER &gt; 10:</strong> Strong evidence for multi-hit at that site</li>
      <li><strong>ER &gt; 100:</strong> Very strong evidence for multi-hit at that site</li>
    </ul>

    <h3>Using This Component</h3>
    <pre><code>import &#123; MultiHitVisualization &#125; from 'hyphy-scope';

&lt;MultiHitVisualization data=&#123;multihitResults&#125; /&gt;</code></pre>

    <h3>Data Format</h3>
    <p>The component expects Multi-Hit analysis results in JSON format with the following structure:</p>
    <ul>
      <li><code>test results</code> - LRT and p-values for each model comparison</li>
      <li><code>Evidence Ratios</code> - Site-level evidence ratios for each comparison</li>
      <li><code>Site Log Likelihood</code> - Site-level log-likelihoods for each model</li>
      <li><code>Site substitutions</code> - Codon substitution patterns across sites</li>
    </ul>

    <h3>Citation</h3>
    <p>If you use Multi-Hit in your research, please cite:</p>
    <blockquote>
      Wisotsky SR, Kosakovsky Pond SL, Shank SD, Muse SV. Extra base hits: Widespread empirical support for instantaneous multiple-nucleotide changes.
      PLoS One. 2021;16(3):e0248337. <a href="https://www.ncbi.nlm.nih.gov/pubmed/33711070" target="_blank">PMID: 33711070</a>
    </blockquote>
  </div>
</div>

<style>
  .multihit-demo {
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

  .usage-info blockquote {
    border-left: 4px solid #007bff;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #666;
    font-style: italic;
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

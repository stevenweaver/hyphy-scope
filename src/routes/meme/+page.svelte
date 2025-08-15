<script lang="ts">
  import { onMount } from 'svelte';
  import { MemeVisualization, loadDataFromUrl, loadDataFromStorage } from '$lib';
  import { getTestData } from '$lib/data/data-loader';

  let data: any = null;
  let loading = false;
  let error: string | null = null;
  let fileInput: HTMLInputElement;
  let selectedTestData = 'meme';

  // URL parameters for data loading
  let urlParams: URLSearchParams;
  let jsonUrl = '';
  let dataId = '';

  onMount(() => {
    urlParams = new URLSearchParams(window.location.search);
    jsonUrl = urlParams.get('json') || '';
    dataId = urlParams.get('id') || '';

    // Load default demo data or from URL params
    loadData();

    // Listen for postMessage data (for iframe usage)
    window.addEventListener('message', handleMessage, false);
    
    return () => {
      window.removeEventListener('message', handleMessage, false);
    };
  });

  async function loadData() {
    loading = true;
    error = null;

    try {
      // Try URL parameter first
      if (jsonUrl) {
        data = await loadDataFromUrl(jsonUrl);
        if (!data) {
          error = 'Failed to load data from URL';
        }
      }
      // Try localStorage
      else if (dataId) {
        data = loadDataFromStorage(dataId);
        if (!data) {
          error = 'No data found in storage for the provided ID';
        }
      }
      // Load demo data
      else {
        data = await loadDemoData();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  }

  async function loadDemoData() {
    // Load the selected test data
    return await getTestData(selectedTestData as any) || await getTestData('meme');
  }

  async function loadTestData() {
    try {
      const selectedData = await getTestData(selectedTestData as any);
      if (selectedData) {
        data = selectedData;
        error = null;
      } else {
        error = 'Selected test data not found';
      }
    } catch (err) {
      error = 'Failed to load test data';
    }
  }

  function handleMessage(event: MessageEvent) {
    if (event.data && typeof event.data === 'object') {
      if (event.data.data?.MLE) {
        data = event.data.data;
      } else if (event.data.type === 'data-response' && event.data.data?.MLE) {
        data = event.data.data;
      }
    }
  }

  async function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    loading = true;
    error = null;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData?.MLE) {
        data = jsonData;
      } else {
        error = 'Invalid MEME results file. Must contain MLE data.';
      }
    } catch (err) {
      error = 'Failed to parse JSON file';
    } finally {
      loading = false;
    }
  }

  function handleUrlLoad() {
    if (jsonUrl.trim()) {
      loadDataFromUrl(jsonUrl.trim()).then((result: any) => {
        if (result) {
          data = result;
          error = null;
        } else {
          error = 'Failed to load data from URL';
        }
      });
    }
  }
</script>

<svelte:head>
  <title>MEME Visualization - HyPhy Scope</title>
  <meta name="description" content="Interactive MEME (Mixed Effects Model of Evolution) analysis visualization" />
</svelte:head>

<div class="meme-demo">
  <div class="header">
    <h1>MEME Analysis Visualization</h1>
    <p>Interactive visualization for Mixed Effects Model of Evolution (MEME) analysis results from HyPhy.</p>
  </div>

  <!-- Data loading section -->
  <div class="data-loading">
    <h2>Load Data</h2>
    
    <div class="loading-options">
      <div class="option">
        <h3>Upload File</h3>
        <input 
          type="file" 
          accept=".json"
          on:change={handleFileUpload}
          bind:this={fileInput}
        />
        <p class="help">Select a HyPhy MEME results JSON file</p>
      </div>

      <div class="option">
        <h3>Load from URL</h3>
        <div class="url-input">
          <input 
            type="url" 
            placeholder="https://example.com/results.json"
            bind:value={jsonUrl}
          />
          <button on:click={handleUrlLoad} disabled={!jsonUrl.trim()}>
            Load
          </button>
        </div>
        <p class="help">Enter a URL to a publicly accessible JSON file</p>
      </div>

      <div class="option">
        <h3>Test Data</h3>
        <div class="test-data-controls">
          <select bind:value={selectedTestData}>
            <option value="meme">MEME</option>
            <option value="fel">FEL</option>
            <option value="slac">SLAC</option>
            <option value="busted">BUSTED</option>
            <option value="absrel">aBSREL</option>
            <option value="relax">RELAX</option>
            <option value="bgm">BGM</option>
            <option value="fade">FADE</option>
            <option value="gard">GARD</option>
          </select>
          <button on:click={loadTestData}>
            Load Test Data
          </button>
        </div>
        <p class="help">Select from available test datasets</p>
      </div>
    </div>

    {#if loading}
      <div class="status loading">
        <p>Loading data...</p>
      </div>
    {/if}

    {#if error}
      <div class="status error">
        <p>Error: {error}</p>
        <button on:click={() => error = null}>Dismiss</button>
      </div>
    {/if}
  </div>

  <!-- Visualization -->
  {#if data}
    <div class="visualization-section">
      <h2>Analysis Results</h2>
      <MemeVisualization {data} />
    </div>
  {:else if !loading && !error}
    <div class="no-data">
      <p>Please load MEME analysis data to begin visualization.</p>
    </div>
  {/if}

  <!-- Usage information -->
  <div class="usage-info">
    <h2>Usage</h2>
    
    <h3>As a Component</h3>
    <pre><code>{@html `&lt;script&gt;
  import { MemeVisualization } from 'hyphy-scope';
  
  let data = null;
  
  // Load your data
  onMount(async () => {
    data = await loadDataFromUrl(params.json) ||
           loadDataFromStorage(params.id) ||
           defaultData;
  });
&lt;/script&gt;

&lt;MemeVisualization {data} /&gt;`}</code></pre>

    <h3>Features</h3>
    <ul>
      <li>Multiple plot types: p-values, site rates, density plots, Bayes factors</li>
      <li>Interactive controls for p-value thresholds</li>
      <li>Site classification filtering</li>
      <li>Detailed results table with episodic selection analysis</li>
      <li>Summary statistics and tile visualization</li>
      <li>Support for parametric bootstrap and asymptotic tests</li>
    </ul>

    <h3>MEME Method</h3>
    <p>
      MEME (Mixed Effects Model of Evolution) identifies sites that have experienced 
      <strong>episodic diversifying selection</strong>. Unlike methods that assume selection 
      affects all branches uniformly, MEME allows for different selective pressures on 
      different branches at the same site.
    </p>

    <h3>Key Features</h3>
    <ul>
      <li><strong>Episodic Selection:</strong> Detects selection that affects only some lineages</li>
      <li><strong>Two Rate Classes:</strong> β- (constrained) and β+ (unconstrained) rates</li>
      <li><strong>Branch-Site Model:</strong> Different branches can have different selection pressures</li>
      <li><strong>Statistical Testing:</strong> LRT with parametric bootstrap or asymptotic approximation</li>
    </ul>
  </div>
</div>

<style>
  .meme-demo {
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
    background: white;
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

  input, button {
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  button {
    background: #007bff;
    color: white;
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
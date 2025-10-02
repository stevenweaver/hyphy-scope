<script lang="ts">
  import { onMount } from 'svelte';
  import { BgmVisualization } from '$lib';
  
  let bgmData = null;
  let rawDataString = '';
  let manualResults = null;
  let componentResults = null;
  let debugInfo = {};

  // Sample data that should work (simulated with P > 0.5)
  const sampleData = {
    "MLE": {
      "headers": [
        ["Site 1", "Index of site 1"],
        ["Site 2", "Index of site 2"],
        ["P [Site 1 -> Site 2]", "Probability that site 2 is conditionally dependent on site 1"],
        ["P [Site 2 -> Site 1]", "Probability that site 1 is conditionally dependent on site 2"],
        ["P [Site 1 <-> Site 2]", "Probability that sites 1 and 2 are not conditionally independent"],
        ["Site 1 subs", "Substitution counts inferred for Site 1"],
        ["Site 2 subs", "Substitution counts inferred for Site 2"],
        ["Shared subs", "Substitutions shared by both sites"]
      ],
      "content": [
        [1, 4, 0.3, 0.4, 0.7, 2, 3, 1],
        [2, 5, 0.2, 0.3, 0.6, 1, 2, 0],
        [3, 6, 0.4, 0.5, 0.8, 3, 4, 2],
        [7, 8, 0.1, 0.2, 0.3, 1, 1, 0],
        [9, 10, 0.05, 0.1, 0.15, 0, 1, 0]
      ]
    },
    "input": {
      "number of sequences": 10,
      "number of sites": 17
    },
    "data partitions": {
      "0": {
        "name": "test.partition",
        "coverage": [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]]
      }
    }
  };

  // Load real test data
  onMount(async () => {
    try {
      const response = await fetch('/src/data/bgm_test_data.json');
      const testData = await response.json();
      
      // Test with sample data first
      testWithData(sampleData, 'Sample Data');
      
      // Then test with real data
      setTimeout(() => testWithData(testData, 'Real Test Data'), 100);
    } catch (error) {
      console.error('Failed to load test data:', error);
    }
  });

  function testWithData(data, label) {
    console.log(`\n=== TESTING WITH ${label} ===`);
    
    // Manual calculation (what should work)
    const mleContent = data.MLE?.content;
    const sequences = data.input?.['number of sequences'] || 0;
    const sites = data.input?.['number of sites'] || 0;
    const correlations = mleContent?.length || 0;
    const significantThreshold = 0.5;
    
    const significantCorrelations = mleContent ? mleContent.filter(
      (row) => Array.isArray(row) && row.length > 4 && (row[4] || 0) > significantThreshold
    ).length : 0;

    manualResults = {
      sequences,
      sites,
      correlations,
      significantCorrelations,
      maxP: mleContent ? Math.max(...mleContent.map(row => row[4] || 0)) : 0
    };

    console.log('Manual calculation results:', manualResults);
    
    // Set data for component (this should trigger reactivity)
    bgmData = data;
    rawDataString = JSON.stringify(data, null, 2);
    
    debugInfo = {
      dataReceived: !!bgmData,
      mleExists: !!bgmData?.MLE,
      contentExists: !!bgmData?.MLE?.content,
      contentLength: bgmData?.MLE?.content?.length || 0,
      inputExists: !!bgmData?.input,
      timestamp: new Date().toISOString()
    };

    console.log('Debug info:', debugInfo);
    console.log('Component data set to:', bgmData);
  }

  function loadSampleData() {
    testWithData(sampleData, 'Sample Data (Manual)');
  }

  async function loadRealData() {
    try {
      const response = await fetch('/src/data/bgm_test_data.json');
      const testData = await response.json();
      testWithData(testData, 'Real Test Data (Manual)');
    } catch (error) {
      console.error('Failed to load test data:', error);
    }
  }

  function loadFromTextarea() {
    try {
      const data = JSON.parse(rawDataString);
      testWithData(data, 'Textarea Data');
    } catch (error) {
      console.error('Invalid JSON:', error);
      alert('Invalid JSON format');
    }
  }

  // Watch for component changes
  $: if (bgmData) {
    console.log('Reactive statement triggered with bgmData:', bgmData);
  }
</script>

<svelte:head>
  <title>BGM Debug - HyPhy Scope</title>
</svelte:head>

<div class="debug-page">
  <div class="header">
    <h1>BGM Component Debug Page</h1>
    <p>This page tests BGM component reactivity and data processing in isolation.</p>
  </div>

  <!-- Control Panel -->
  <div class="controls">
    <h2>Test Data Sources</h2>
    <div class="button-group">
      <button on:click={loadSampleData}>Load Sample Data (P > 0.5)</button>
      <button on:click={loadRealData}>Load Real Test Data</button>
    </div>
    
    <div class="textarea-section">
      <h3>Custom JSON Data</h3>
      <textarea 
        bind:value={rawDataString} 
        placeholder="Paste BGM JSON data here..."
        rows="10"
      ></textarea>
      <button on:click={loadFromTextarea}>Load from JSON</button>
    </div>
  </div>

  <!-- Debug Information -->
  <div class="debug-info">
    <h2>Debug Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <strong>Data Status:</strong>
        <span class:success={debugInfo.dataReceived} class:error={!debugInfo.dataReceived}>
          {debugInfo.dataReceived ? 'Data Received' : 'No Data'}
        </span>
      </div>
      <div class="info-item">
        <strong>MLE Structure:</strong>
        <span class:success={debugInfo.mleExists} class:error={!debugInfo.mleExists}>
          {debugInfo.mleExists ? 'Present' : 'Missing'}
        </span>
      </div>
      <div class="info-item">
        <strong>Content Array:</strong>
        <span class:success={debugInfo.contentExists} class:error={!debugInfo.contentExists}>
          {debugInfo.contentExists ? `${debugInfo.contentLength} rows` : 'Missing'}
        </span>
      </div>
      <div class="info-item">
        <strong>Input Data:</strong>
        <span class:success={debugInfo.inputExists} class:error={!debugInfo.inputExists}>
          {debugInfo.inputExists ? 'Present' : 'Missing'}
        </span>
      </div>
    </div>
  </div>

  <!-- Manual Calculation Results -->
  {#if manualResults}
    <div class="manual-results">
      <h2>Manual Calculation Results</h2>
      <div class="results-grid">
        <div class="result-item">
          <div class="result-number">{manualResults.sequences}</div>
          <div class="result-label">Sequences</div>
        </div>
        <div class="result-item">
          <div class="result-number">{manualResults.sites}</div>
          <div class="result-label">Sites</div>
        </div>
        <div class="result-item">
          <div class="result-number">{manualResults.correlations}</div>
          <div class="result-label">Correlations</div>
        </div>
        <div class="result-item">
          <div class="result-number" style="color: #e3243b">
            {manualResults.significantCorrelations}
          </div>
          <div class="result-label">Significant (P > 0.5)</div>
        </div>
        <div class="result-item">
          <div class="result-number">{manualResults.maxP.toFixed(4)}</div>
          <div class="result-label">Max P-value</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Component Test -->
  <div class="component-test">
    <h2>BGM Component Render Test</h2>
    {#if bgmData}
      <div class="component-wrapper">
        <BgmVisualization data={bgmData} />
      </div>
    {:else}
      <div class="no-data">
        <p>No data loaded. Use controls above to load test data.</p>
      </div>
    {/if}
  </div>

  <!-- Raw Data Display -->
  {#if bgmData}
    <div class="raw-data">
      <h2>Raw Data Structure</h2>
      <details>
        <summary>View Raw JSON (click to expand)</summary>
        <pre>{JSON.stringify(bgmData, null, 2)}</pre>
      </details>
    </div>
  {/if}
</div>

<style>
  .debug-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

  .controls {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .textarea-section textarea {
    width: 100%;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .debug-info {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #dee2e6;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .success {
    color: #28a745;
    font-weight: bold;
  }

  .error {
    color: #dc3545;
    font-weight: bold;
  }

  .manual-results {
    background: #e7f3ff;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 2px solid #007bff;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .result-item {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .result-number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .result-label {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .component-test {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 2px solid #28a745;
  }

  .component-wrapper {
    border: 1px dashed #ccc;
    padding: 1rem;
    border-radius: 4px;
  }

  .no-data {
    text-align: center;
    padding: 3rem;
    color: #666;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .raw-data {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .raw-data pre {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.8rem;
    max-height: 400px;
    overflow-y: auto;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: 1px solid #007bff;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
  }

  button:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  h2, h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }
</style>
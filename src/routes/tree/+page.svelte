<script lang="ts">
  import { PhylogeneticTreeViewer } from '$lib/index.js';
  import { onMount } from 'svelte';

  let treeData: any = null;
  let loading = true;
  let error: string = '';

  // Sample tree data with HyPhy format
  const sampleTreeData = {
    input: {
      trees: [
        "((A:0.1,B:0.2):0.05,(C:0.15,D:0.1):0.05);"
      ]
    },
    "branch attributes": [
      {
        "A": {
          "branch length": 0.1,
          "dN/dS": 0.5
        },
        "B": {
          "branch length": 0.2,
          "dN/dS": 1.5
        },
        "C": {
          "branch length": 0.15,
          "dN/dS": 0.8
        },
        "D": {
          "branch length": 0.1,
          "dN/dS": 1.2
        }
      }
    ]
  };

  // Try to load actual data, fall back to sample
  onMount(async () => {
    try {
      // Try to load FEL data which should have tree information
      const response = await fetch('/src/data/fel_test_data.json');
      if (response.ok) {
        const data = await response.json();
        if (data.input?.trees) {
          treeData = data;
        } else {
          // Use sample data if no tree in the actual data
          treeData = sampleTreeData;
        }
      } else {
        treeData = sampleTreeData;
      }
    } catch (e) {
      console.warn('Could not load tree data, using sample:', e);
      treeData = sampleTreeData;
    } finally {
      loading = false;
    }
  });
</script>

<div class="page-container">
  <h1>Phylogenetic Tree Viewer Demo</h1>
  
  <p class="description">
    This is a simple phylogenetic tree viewer component for visualizing trees from HyPhy analysis results.
    It supports basic tree rendering with branch coloring and node labels.
  </p>

  {#if loading}
    <div class="loading">Loading tree data...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <PhylogeneticTreeViewer 
      data={treeData}
      width={800}
      height={500}
      showLabels={true}
      colorBranches="branch length"
    />
  {/if}

  <div class="info-section">
    <h2>Features</h2>
    <ul>
      <li><strong>Tree Rendering</strong>: Uses the phylotree.js library for robust tree visualization</li>
      <li><strong>Branch Coloring</strong>: Color branches by branch length or other attributes</li>
      <li><strong>Node Labels</strong>: Display sequence names and other node information</li>
      <li><strong>Interactive Controls</strong>: Toggle labels and coloring options</li>
      <li><strong>Multiple Trees</strong>: Support for datasets with multiple trees</li>
      <li><strong>HyPhy Integration</strong>: Designed to work with HyPhy analysis results</li>
    </ul>

    <h2>Supported Data Format</h2>
    <p>The component expects HyPhy analysis results with:</p>
    <ul>
      <li><code>input.trees</code>: Newick format tree string(s)</li>
      <li><code>branch attributes</code>: Branch-specific data for coloring and tooltips</li>
    </ul>
  </div>
</div>

<style>
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    color: #333;
    margin-bottom: 1rem;
  }

  .description {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }

  .error {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 2rem;
  }

  .info-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;
  }

  .info-section h2 {
    color: #333;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  .info-section ul {
    color: #666;
    line-height: 1.6;
  }

  .info-section li {
    margin-bottom: 0.5rem;
  }

  .info-section code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
  }
</style>
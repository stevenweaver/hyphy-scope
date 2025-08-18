<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  
  export let data: any = null;
  export let width: number = 800;
  export let height: number = 600;
  export let branchLengthProperty: string = 'branch length';
  export let colorBranches: string = 'none';
  export let showLabels: boolean = true;
  export let treeIndex: number = 0;

  let containerElement: HTMLDivElement;
  let phylotreeInstance: any = null;
  let loadingPhylotree = true;

  async function loadPhylotreeLibrary() {
    try {
      // Load phylotree CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css';
      document.head.appendChild(link);

      // Import phylotree dynamically
      const phylotree = await import('phylotree');
      loadingPhylotree = false;
      return phylotree;
    } catch (error) {
      console.error('Failed to load phylotree library:', error);
      loadingPhylotree = false;
      return null;
    }
  }

  function getTreeNewick(data: any, treeIndex: number = 0): string | null {
    if (!data?.input?.trees) return null;
    
    // Handle different tree storage formats from hyphy-eye
    const trees = data.input.trees;
    
    if (Array.isArray(trees)) {
      return trees[treeIndex] || trees[0] || null;
    } else if (typeof trees === 'object') {
      const treeKeys = Object.keys(trees);
      const treeKey = treeKeys[treeIndex] || treeKeys[0];
      return trees[treeKey] || null;
    } else if (typeof trees === 'string') {
      return trees;
    }
    
    return null;
  }

  function getBranchAttributes(data: any, treeIndex: number = 0): any {
    if (!data?.["branch attributes"]) return {};
    
    const branchAttrs = data["branch attributes"];
    if (Array.isArray(branchAttrs)) {
      return branchAttrs[treeIndex] || branchAttrs[0] || {};
    } else if (typeof branchAttrs === 'object') {
      const attrKeys = Object.keys(branchAttrs);
      const attrKey = attrKeys[treeIndex] || attrKeys[0];
      return branchAttrs[attrKey] || {};
    }
    
    return branchAttrs || {};
  }

  function setupBranchStyling(tree: any, data: any, treeIndex: number) {
    if (!tree || colorBranches === 'none') return;

    const branchAttributes = getBranchAttributes(data, treeIndex);
    
    if (colorBranches === 'branch length' && branchLengthProperty) {
      // Color by branch lengths
      const values = [];
      tree.get_nodes().forEach((node: any) => {
        const attrs = branchAttributes[node.data.name];
        if (attrs && attrs[branchLengthProperty] !== undefined) {
          values.push(attrs[branchLengthProperty]);
        }
      });
      
      if (values.length > 0) {
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
          .domain(d3.extent(values));
        
        tree.style_edges((element: any, data: any) => {
          const attrs = branchAttributes[data.target.data.name];
          const value = attrs?.[branchLengthProperty];
          if (value !== undefined) {
            d3.select(element).style('stroke', colorScale(value));
          }
        });
      }
    }
  }

  async function renderTree() {
    if (!containerElement || !data || loadingPhylotree) return;
    
    const phylotreeLib = await loadPhylotreeLibrary();
    if (!phylotreeLib) return;

    const newick = getTreeNewick(data, treeIndex);
    if (!newick) {
      containerElement.innerHTML = '<p>No tree data found</p>';
      return;
    }

    // Clear container
    containerElement.innerHTML = '';
    
    try {
      // Create SVG
      const svg = d3.select(containerElement)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // Create phylotree instance
      phylotreeInstance = phylotreeLib.phylotree(newick);
      
      // Basic configuration
      phylotreeInstance
        .size([height - 40, width - 40])
        .separation((a: any, b: any) => 1);

      if (showLabels) {
        phylotreeInstance.node_circle_size(0);
      }

      // Render tree
      phylotreeInstance(svg.append('g').attr('transform', 'translate(20,20)'));
      
      // Apply branch styling
      setupBranchStyling(phylotreeInstance, data, treeIndex);
      
      // Add node labels if requested
      if (showLabels) {
        phylotreeInstance.style_nodes((element: any, data: any) => {
          if (data.data.name && !data.children) {
            d3.select(element.parentNode)
              .append('text')
              .attr('dx', 5)
              .attr('dy', '0.35em')
              .style('font-size', '12px')
              .text(data.data.name);
          }
        });
      }

      phylotreeInstance.layout();

    } catch (error) {
      console.error('Error rendering tree:', error);
      containerElement.innerHTML = '<p class="error">Error rendering phylogenetic tree</p>';
    }
  }

  onMount(() => {
    if (data) {
      renderTree();
    }
  });

  onDestroy(() => {
    if (phylotreeInstance) {
      phylotreeInstance = null;
    }
  });

  $: if (data && containerElement && !loadingPhylotree) {
    renderTree();
  }
</script>

<div class="phylogenetic-tree-viewer">
  {#if !data}
    <div class="loading">No tree data provided</div>
  {:else if loadingPhylotree}
    <div class="loading">Loading phylogenetic tree library...</div>
  {:else}
    <div class="controls">
      <div class="control-group">
        <label for="tree-index">Tree:</label>
        <input 
          id="tree-index" 
          type="number" 
          bind:value={treeIndex} 
          min="0" 
          max="10"
        />
      </div>
      
      <div class="control-group">
        <label for="color-branches">Color branches:</label>
        <select id="color-branches" bind:value={colorBranches}>
          <option value="none">None</option>
          <option value="branch length">Branch length</option>
        </select>
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" bind:checked={showLabels} />
          Show labels
        </label>
      </div>
    </div>
    
    <div class="tree-container" bind:this={containerElement}></div>
  {/if}
</div>

<style>
  .phylogenetic-tree-viewer {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }

  .controls {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-group label {
    font-weight: 500;
    color: #333;
  }

  .control-group input,
  .control-group select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 3px;
  }

  .tree-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    overflow: auto;
    min-height: 400px;
  }

  .error {
    color: #e74c3c;
    text-align: center;
    padding: 2rem;
  }

  :global(.phylotree-node) {
    fill: #333;
  }

  :global(.phylotree-branch) {
    fill: none;
    stroke: #333;
    stroke-width: 1px;
  }

  :global(.phylotree-node-text) {
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
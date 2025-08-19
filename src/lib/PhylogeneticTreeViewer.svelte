<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import * as phylotree from 'phylotree';
  
  export let data: any = null;
  export let width: number = 800;
  export let height: number = 600;
  export let branchLengthProperty: string = 'branch length';
  export let colorBranches: string = 'none';
  export let showLabels: boolean = true;
  export let showScale: boolean = true;
  export let isRadial: boolean = false;
  export let treeIndex: number = 0;

  let containerElement: HTMLDivElement;
  let phylotreeInstance: any = null;
  let treeContainerId = `tree-container-${Math.random().toString(36).substr(2, 9)}`;

  function loadPhylotreeCSS() {
    // Load phylotree CSS - use the correct version
    const existingLink = document.querySelector('link[href*="phylotree.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css';
      document.head.appendChild(link);
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


  function renderTree() {
    if (!containerElement || !data) return;

    const newick = getTreeNewick(data, treeIndex);
    if (!newick) {
      containerElement.innerHTML = '<p>No tree data found</p>';
      return;
    }

    // Load CSS if needed
    loadPhylotreeCSS();

    // Clear container and add div with ID for phylotree
    containerElement.innerHTML = '';
    const treeDiv = document.createElement('div');
    treeDiv.id = treeContainerId;
    containerElement.appendChild(treeDiv);
    
    try {
      // Create phylotree instance directly from newick string
      phylotreeInstance = new phylotree.phylotree(newick);
      
      // Set branch length accessor if we have branch attributes
      const branchAttrs = getBranchAttributes(data, treeIndex);
      if (branchAttrs && Object.keys(branchAttrs).length > 0) {
        phylotreeInstance.branch_length(function(node: any) {
          if (node.data.name && branchAttrs[node.data.name]) {
            return branchAttrs[node.data.name][branchLengthProperty] || node.data.attribute;
          }
          return node.data.attribute || 0;
        });
      }

      // Render tree with options matching phylotree.js examples
      const rendered = phylotreeInstance.render({
        container: `#${treeContainerId}`,
        'height': height - 40,
        'width': width - 40,
        'show-scale': showScale,
        'is-radial': isRadial,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'draw-size-bubbles': false,
        zoom: false
      });

      // Apply branch styling
      if (colorBranches === 'branch length' && branchAttrs) {
        const values = [];
        Object.keys(branchAttrs).forEach(nodeName => {
          const value = branchAttrs[nodeName][branchLengthProperty];
          if (value !== undefined) values.push(value);
        });

        if (values.length > 0) {
          const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain(d3.extent(values));

          phylotreeInstance.display.style_edges((element: any, data: any) => {
            const targetName = data.target.data.name;
            if (targetName && branchAttrs[targetName]) {
              const value = branchAttrs[targetName][branchLengthProperty];
              if (value !== undefined) {
                d3.select(element).style('stroke', colorScale(value))
                  .style('stroke-width', '2px');
              }
            }
          });
        }
      }

      // Style nodes and add labels
      if (showLabels) {
        phylotreeInstance.display.style_nodes((element: any, data: any) => {
          // Hide internal node circles when showing labels
          if (data.children) {
            d3.select(element).style('display', 'none');
          }
        });
      }

      // Follow the phylotree.js example pattern
      d3.select(`#${treeContainerId}`).html(phylotreeInstance.display.show());

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

  $: if (data && containerElement) {
    renderTree();
  }
</script>

<div class="phylogenetic-tree-viewer">
  {#if !data}
    <div class="loading">No tree data provided</div>
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

      <div class="control-group">
        <label>
          <input type="checkbox" bind:checked={showScale} />
          Show scale
        </label>
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" bind:checked={isRadial} />
          Radial layout
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

  /* Phylotree specific styles */
  :global(.node) {
    fill: #333;
    stroke: #333;
  }

  :global(.branch) {
    fill: none;
    stroke: #333;
    stroke-width: 1px;
  }

  :global(.internal-node) {
    fill: #666;
    stroke: #666;
  }

  :global(.tree-scale-bar) {
    stroke: #666;
    stroke-width: 1px;
  }

  :global(.tree-scale-label) {
    font-size: 10px;
    fill: #666;
  }
</style>
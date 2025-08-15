# HyPhy-Eye to HyPhy-Scope Porting Guide

This guide documents the process of porting visualizations from the Observable Framework-based HyPhy-Eye to the clean Svelte component library HyPhy-Scope.

## Overview

The porting process involves converting Observable notebooks (`.md` files with embedded JavaScript) into standalone Svelte components that can be imported and used in any SvelteKit application.

## Key Differences

### Original (HyPhy-Eye)
- Built with Observable Framework
- Uses Observable reactive cells and runtime
- Requires iframe embedding for integration
- Uses Vega-Lite for visualizations
- Data loading through FileAttachment and Observable views

### Ported (HyPhy-Scope)
- Pure Svelte components
- Standard JavaScript imports/exports
- Direct component integration
- Uses Observable Plot for visualizations
- Clean data loading utilities

## Porting Steps

### 1. Analyze the Original Component

Example: FEL visualization (`src/pages/fel.md`)

Key elements to identify:
- Data structure and processing logic
- Visualization types and configurations
- User controls and interactions
- Utility functions and calculations

### 2. Extract Utility Functions

Convert Observable modules to TypeScript utilities:

**Original (fel-utils.js):**
```javascript
export function getFelAttributes(resultsJson) {
  // Logic here
}
```

**Ported (fel-utils.ts):**
```typescript
interface FelResults {
  MLE: { /* ... */ };
  // ... other properties
}

export function getFelAttributes(resultsJson: FelResults): FelAttributes {
  // Same logic with TypeScript types
}
```

### 3. Replace Vega-Lite with Observable Plot

**Original (Vega-Lite):**
```javascript
const plotSpec = {
  "width": 800,
  "height": 200,
  "data": {"values": data},
  "mark": "point",
  "encoding": {
    "x": {"field": "codon", "type": "nominal"},
    "y": {"field": "dN/dS MLE", "type": "quantitative"}
  }
};
vl.render({"spec": plotSpec});
```

**Ported (Observable Plot):**
```typescript
import * as Plot from "@observablehq/plot";

export function createDnDsPlot(data: SiteData[]): any {
  return Plot.plot({
    width: 800,
    height: 400,
    marks: [
      Plot.dot(data, {
        x: "codon",
        y: "dN/dS MLE",
        fill: "class",
        tip: true
      })
    ]
  });
}
```

### 4. Convert Observable Reactive Cells to Svelte Reactive Statements

**Original (Observable):**
```javascript
const filteredData = {
  const inSet = new Set(_.map(table1, d => d.codon));
  return _.filter(siteTableData, x => inSet.has(x.codon));
}
```

**Ported (Svelte):**
```typescript
$: filteredSiteData = sitesTable[0].filter(x => 
  showColumns.includes(x.class) && 
  (!filteredSiteData.length || inSet.has(x.codon))
);
```

### 5. Replace Observable Views with Svelte Bindings

**Original:**
```javascript
const pvalueThreshold = view(Inputs.text({
  label: html`<b>p-value threshold</b>`,
  value: "0.1"
}));
```

**Ported:**
```svelte
<input 
  type="number" 
  step="0.01" 
  bind:value={pvalueThreshold}
/>
```

### 6. Handle Data Loading

**Original:**
```javascript
const resultsJson = await FileAttachment("../data/fel_test_data.json").json();
```

**Ported:**
```typescript
// Option 1: Import directly
import felTestData from '../../data/fel_test_data.json';

// Option 2: Dynamic loading
export async function loadDataFromUrl(url: string): Promise<FelResults | null> {
  const response = await fetch(url);
  return await response.json();
}
```

### 7. Create the Svelte Component Structure

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from '@observablehq/plot';
  
  export let data: any = null;
  
  // Reactive processing
  $: if (data) {
    processData();
  }
  
  function processData() {
    // Convert Observable logic
  }
</script>

<div class="visualization">
  <!-- Component HTML -->
</div>

<style>
  /* Component styles */
</style>
```

### 8. Handle Plot Rendering

Observable Plot returns DOM elements, not declarative specs:

```typescript
function updatePlot() {
  if (!plotContainer) return;
  
  plotContainer.innerHTML = '';
  const plot = createFelPlot(plotType, data, threshold);
  if (plot) {
    plotContainer.appendChild(plot);
  }
}
```

### 9. Export from Library

```typescript
// src/lib/index.ts
export { default as FelVisualization } from './FelVisualization.svelte';
export * from './utils/fel-utils.js';
```

## Common Patterns

### 1. Tile/Summary Statistics
Convert Observable's custom components to Svelte:
```svelte
<div class="summary-tiles">
  {#each tileSpecs as tile}
    <div class="tile">
      <div class="tile-number">{tile.number}</div>
      <div class="tile-description">{tile.description}</div>
    </div>
  {/each}
</div>
```

### 2. Interactive Controls
Use Svelte's two-way binding:
```svelte
<select bind:value={plotType}>
  {#each availablePlotTypes as type}
    <option value={type}>{type}</option>
  {/each}
</select>
```

### 3. Conditional Rendering
```svelte
{#if data}
  <FelVisualization {data} />
{:else}
  <p>Loading...</p>
{/if}
```

## Best Practices

1. **Type Safety**: Add TypeScript interfaces for all data structures
2. **Error Handling**: Wrap plot creation in try-catch blocks
3. **Performance**: Use Svelte's reactive statements efficiently
4. **Modularity**: Separate utilities, components, and types
5. **Documentation**: Include JSDoc comments for exported functions

## Testing Your Port

1. **Unit Tests**: Test utility functions independently
2. **Visual Comparison**: Compare output with original HyPhy-Eye
3. **Data Validation**: Ensure all data formats are handled
4. **Interactivity**: Verify all controls work as expected
5. **Edge Cases**: Test with minimal and maximal datasets

## Checklist for Each Method

- [ ] Extract and type utility functions
- [ ] Convert plots to Observable Plot
- [ ] Create Svelte component structure
- [ ] Implement reactive data processing
- [ ] Add interactive controls
- [ ] Style to match original
- [ ] Test with all example data
- [ ] Document component usage
- [ ] Export from library index

## Component Usage

After porting, components can be used like:

```svelte
<script>
  import { FelVisualization } from 'hyphy-scope';
  import { onMount } from 'svelte';
  
  let data = null;
  
  onMount(async () => {
    data = await loadData();
  });
</script>

<FelVisualization {data} pvalueThreshold={0.1} />
```

No Observable runtime, no iframes, just clean Svelte components!
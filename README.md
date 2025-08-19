# HyPhy Scope

[![CI](https://github.com/stevenweaver/hyphy-scope/actions/workflows/ci.yml/badge.svg)](https://github.com/stevenweaver/hyphy-scope/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/hyphy-scope.svg)](https://www.npmjs.com/package/hyphy-scope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Reusable Svelte components for HyPhy analysis visualization

## Overview

HyPhy Scope provides a collection of Svelte 5 components for visualizing results from [HyPhy (Hypothesis Testing using Phylogenies)](http://hyphy.org) analyses. These components help researchers create interactive, publication-ready visualizations for various selection analysis methods.

## Features

- 📊 **Interactive Visualizations**: Built with Observable Plot and D3.js
- 🧬 **Comprehensive Analysis Support**: FEL, MEME, aBSREL, BUSTED, RELAX, SLAC, BGM, FADE, GARD
- 🌳 **Phylogenetic Tree Viewer**: Interactive tree visualization with phylotree.js
- 🎨 **Customizable**: Control thresholds, colors, and display options
- 📱 **Responsive**: Components adapt to different screen sizes
- 🧪 **Well-tested**: Comprehensive test suite with Vitest
- 📚 **TypeScript Support**: Full type definitions included
- 📖 **Storybook Documentation**: Interactive component playground

## Installation

```bash
npm install hyphy-scope
```

## Quick Start

```javascript
import { FelVisualization } from 'hyphy-scope';

// Use with your HyPhy results
<FelVisualization 
  data={felResults} 
  pvalueThreshold={0.1}
/>
```

## Available Components

### Selection Analysis Components

- **FelVisualization**: Fixed Effects Likelihood site-level selection analysis
- **MemeVisualization**: Mixed Effects Model of Evolution episodic selection analysis
- **AbsrelVisualization**: adaptive Branch-Site REL branch-level selection analysis
- **BustedVisualization**: Gene-wide selection test visualization
- **RelaxVisualization**: Selection intensity changes visualization
- **SlacVisualization**: Single Likelihood Ancestor Counting analysis
- **BgmVisualization**: Bayesian Graphical Model for coevolution
- **FadeVisualization**: FUBAR Approach to Directional Evolution
- **GardVisualization**: Genetic Algorithm for Recombination Detection

### Tree Visualization

- **PhylogeneticTreeViewer**: Interactive phylogenetic tree visualization with zoom, pan, and node selection

## Data Format

All components expect data in HyPhy's standard JSON output format. You can load data using the provided utilities:

```javascript
import { loadDataFromUrl, loadDataFromStorage } from 'hyphy-scope';

// Load from URL
const data = await loadDataFromUrl('https://example.com/hyphy-results.json');

// Load from local storage
const data = loadDataFromStorage('analysis-key');
```

## Component Props

Most visualization components share common props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `object` | required | HyPhy analysis results in JSON format |
| `pvalueThreshold` | `number` | `0.1` | P-value threshold for significance |
| `width` | `number` | `800` | Chart width in pixels |
| `height` | `number` | `600` | Chart height in pixels |

## Development

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/stevenweaver/hyphy-scope.git
cd hyphy-scope

# Install dependencies
npm install

# Generate SvelteKit files
npx svelte-kit sync

# Start development server
npm run dev

# Run tests
npm test

# Run Storybook
npm run storybook
```

### Building

```bash
# Build the library
npm run build

# Build and package for distribution
npm run package
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Storybook

View the interactive component documentation:

```bash
npm run storybook
```

Then open [http://localhost:6006](http://localhost:6006) to see all components with live examples.

## Examples

### FEL Visualization

```javascript
import { FelVisualization } from 'hyphy-scope';

<FelVisualization 
  data={felData}
  pvalueThreshold={0.05}
  width={900}
  height={700}
/>
```

### Phylogenetic Tree Viewer

```javascript
import { PhylogeneticTreeViewer } from 'hyphy-scope';

<PhylogeneticTreeViewer 
  data={treeData}
  width={800}
  height={600}
  showBranchLengths={true}
  enableZoom={true}
/>
```

### Loading Data from URL

```javascript
import { FelVisualization, loadDataFromUrl } from 'hyphy-scope';

let data;

onMount(async () => {
  data = await loadDataFromUrl('https://example.com/fel-results.json');
});

{#if data}
  <FelVisualization {data} />
{/if}
```

## Browser Support

HyPhy Scope supports all modern browsers (Chrome, Firefox, Safari, Edge). Internet Explorer is not supported.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [HyPhy](http://hyphy.org) - Hypothesis Testing using Phylogenies
- [Observable Plot](https://observablehq.com/@observablehq/plot) - Data visualization library
- [phylotree.js](https://github.com/veg/phylotree.js) - Phylogenetic tree visualization
- [Svelte](https://svelte.dev) - The web framework used
- [SvelteKit](https://kit.svelte.dev) - Application framework

## Support

- **Issues**: [GitHub Issues](https://github.com/stevenweaver/hyphy-scope/issues)
- **Discussions**: [GitHub Discussions](https://github.com/stevenweaver/hyphy-scope/discussions)
- **HyPhy**: [hyphy.org](http://hyphy.org)

## Citation

If you use HyPhy Scope in your research, please cite:

```bibtex
@software{hyphy-scope,
  author = {Steven Weaver},
  title = {HyPhy Scope: Reusable Svelte components for HyPhy analysis visualization},
  url = {https://github.com/stevenweaver/hyphy-scope},
  year = {2024}
}
```
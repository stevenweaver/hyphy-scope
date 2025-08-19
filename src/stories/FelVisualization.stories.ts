import type { Meta, StoryObj } from '@storybook/svelte';
import FelVisualization from '$lib/FelVisualization.svelte';

// Import test data from TypeScript file
import { felTestData } from './data/fel-test-data';

const meta = {
  title: 'Visualizations/FEL Visualization',
  component: FelVisualization,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'FEL analysis results data in HyPhy JSON format'
    },
    pvalueThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'P-value threshold for significance'
    },
    showColumns: {
      control: 'check',
      options: ['Diversifying', 'Purifying', 'Neutral', 'Invariable'],
      description: 'Which site classes to show in the table'
    },
    plotType: {
      control: 'select',
      options: [
        'alpha/beta site-level estimates',
        'dN/dS per-site estimates',
        'Parametric bootstrap'
      ],
      description: 'Type of plot to display'
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'FEL (Fixed Effects Likelihood) visualization component for displaying site-level selection analysis results from HyPhy. Includes interactive phylogenetic tree viewer with adjustable dimensions.'
      }
    }
  }
} satisfies Meta<FelVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with test data
export const Default: Story = {
  args: {
    data: felTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Purifying', 'Neutral', 'Invariable'],
    plotType: 'alpha/beta site-level estimates'
  }
};

// Story showing only significant sites
export const SignificantSitesOnly: Story = {
  args: {
    data: felTestData,
    pvalueThreshold: 0.05,
    showColumns: ['Diversifying', 'Purifying'],
    plotType: 'alpha/beta site-level estimates'
  }
};

// Story with dN/dS plot
export const DNDSPlot: Story = {
  args: {
    data: felTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Purifying', 'Neutral', 'Invariable'],
    plotType: 'dN/dS per-site estimates'
  }
};

// Story without data (loading state)
export const Loading: Story = {
  args: {
    data: null,
    pvalueThreshold: 0.1
  }
};

// Story with custom p-value threshold
export const StrictThreshold: Story = {
  args: {
    data: felTestData,
    pvalueThreshold: 0.01,
    showColumns: ['Diversifying', 'Purifying', 'Neutral', 'Invariable'],
    plotType: 'alpha/beta site-level estimates'
  },
  parameters: {
    docs: {
      description: {
        story: 'FEL visualization with a very strict p-value threshold (0.01)'
      }
    }
  }
};

// Story highlighting the phylogenetic tree features
export const TreeVisualizationFocus: Story = {
  args: {
    data: felTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Purifying'],
    plotType: 'alpha/beta site-level estimates'
  },
  parameters: {
    docs: {
      description: {
        story: 'FEL analysis with focus on the phylogenetic tree visualization. Use the width (400-2400px) and height (300-1600px) sliders above the tree to adjust dimensions for better viewing of different tree sizes.'
      }
    }
  }
};
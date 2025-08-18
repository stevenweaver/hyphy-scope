import type { Meta, StoryObj } from '@storybook/svelte';
import AbsrelVisualization from '$lib/AbsrelVisualization.svelte';
import { absrelTestData } from './data/absrel-test-data';

const meta = {
  title: 'Visualizations/ABSREL Visualization',
  component: AbsrelVisualization,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'aBSREL (adaptive Branch-Site REL) analysis results data in HyPhy JSON format'
    },
    pvalueThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'P-value threshold for significance'
    },
    showColumns: {
      control: 'check',
      options: ['Selected', 'Tested', 'Not tested'],
      description: 'Which branch classes to show'
    },
    plotType: {
      control: 'select',
      options: [
        'branch ω distribution',
        'branch LRT',
        'uncorrected p-values'
      ],
      description: 'Type of plot to display'
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'aBSREL (adaptive Branch-Site Random Effects Likelihood) visualization component for displaying branch-level selection analysis results from HyPhy.'
      }
    }
  }
} satisfies Meta<AbsrelVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with test data
export const Default: Story = {
  args: {
    data: absrelTestData,
    pvalueThreshold: 0.05,
    showColumns: ['Selected', 'Tested', 'Not tested'],
    plotType: 'branch ω distribution'
  }
};

// Branch LRT plot
export const BranchLRTPlot: Story = {
  args: {
    data: absrelTestData,
    pvalueThreshold: 0.05,
    showColumns: ['Selected', 'Tested'],
    plotType: 'branch LRT'
  }
};

// P-values plot
export const PValuesPlot: Story = {
  args: {
    data: absrelTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Selected', 'Tested', 'Not tested'],
    plotType: 'uncorrected p-values'
  }
};

// Strict threshold
export const StrictThreshold: Story = {
  args: {
    data: absrelTestData,
    pvalueThreshold: 0.01,
    showColumns: ['Selected'],
    plotType: 'branch ω distribution'
  }
};

// Loading state
export const Loading: Story = {
  args: {
    data: null,
    pvalueThreshold: 0.05
  }
};
import type { Meta, StoryObj } from '@storybook/svelte';
import SlacVisualization from '../lib/SlacVisualization.svelte';
import { slacTestData } from './data/slac-test-data.js';

const meta = {
  title: 'Analysis/SlacVisualization',
  component: SlacVisualization,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
        # SLAC Visualization Component
        
        Interactive visualization for SLAC (Single Likelihood Ancestor Counting) analysis results.
        
        ## Features
        - Site-by-site dN/dS ratio visualization
        - Statistical significance testing and filtering
        - Normalized dN-dS difference plots
        - Interactive data table with sorting and pagination
        - Summary statistics tiles
        
        ## Data Requirements
        
        The component expects SLAC analysis results with:
        - \`MLE.content\` - Site-level results with dN, dS, dN/dS, and p-values
        - \`input\` - Analysis metadata including sequence and site counts
        - \`data partitions\` - Optional partition information
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'SLAC analysis results data',
      control: false
    }
  }
} satisfies Meta<SlacVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTestData: Story = {
  args: {
    data: slacTestData
  },
  parameters: {
    docs: {
      description: {
        story: 'SLAC visualization using simulated test data from the hyphy-vision repository.'
      }
    }
  }
};

export const NoData: Story = {
  args: {
    data: null
  },
  parameters: {
    docs: {
      description: {
        story: 'SLAC component loading state when no data is provided.'
      }
    }
  }
};

export const EmptyData: Story = {
  args: {
    data: {}
  },
  parameters: {
    docs: {
      description: {
        story: 'SLAC component behavior with empty data object.'
      }
    }
  }
};
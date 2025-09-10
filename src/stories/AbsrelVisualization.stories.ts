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
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'aBSREL (adaptive Branch-Site Random Effects Likelihood) visualization component for displaying branch-level selection analysis results from HyPhy. Features interactive rate tables, statistical plots, and model comparison visualizations.'
      }
    }
  }
} satisfies Meta<AbsrelVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to generate random site data
function generateSiteData(numSites: number) {
  return {
    "Site Log Likelihood": {
      "tested": {
        "Node1": Array.from({ length: numSites }, () => [Math.random() * -10 - 5])
      },
      "unconstrained": {
        "0": Array.from({ length: numSites }, () => Math.random() * -8 - 2)
      }
    },
    "data partitions": {
      "0": {
        "coverage": [Array.from({ length: numSites }, (_, i) => i)]
      }
    }
  };
}

// Basic story with test data
export const Default: Story = {
  args: {
    data: absrelTestData
  }
};

// With significant branches highlighted
export const WithSignificantBranches: Story = {
  args: {
    data: {
      ...absrelTestData,
      "test results": {
        ...absrelTestData["test results"],
        "Branch2": {
          ...absrelTestData["test results"]["Branch2"],
          "corrected p": 0.001,
          "Corrected P-value": 0.001
        }
      }
    }
  }
};

// Loading state
export const Loading: Story = {
  args: {
    data: null
  }
};

// With minimal data
export const MinimalData: Story = {
  args: {
    data: {
      "sequences": 5,
      "sites": 100,
      "branches tested": 2,
      "branches with selection": 1,
      "p-value threshold": 0.05,
      "test results": {
        "Node1": {
          "Rate classes": 2,
          "uncorrected p": 0.01,
          "corrected p": 0.04,
          "Bayes Factor": 15.2
        }
      },
      "branch attributes": {
        "0": {
          "Node1": {
            "Rate classes": 2,
            "Corrected P-value": 0.04,
            "Rate Distributions": {
              "0": [0.2, 0.8],
              "1": [2.1, 0.2]
            }
          }
        }
      },
      "tested": {
        "0": {
          "Node1": "test"
        }
      },
      "fits": {
        "Baseline model": {
          "log-likelihood": -500.1,
          "AIC": 1010.2,
          "parameters": 5
        },
        "Full adaptive model": {
          "log-likelihood": -495.3,
          "AIC": 1004.6,
          "parameters": 7
        }
      }
    }
  }
};
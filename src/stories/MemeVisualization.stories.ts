import type { Meta, StoryObj } from '@storybook/svelte';
import MemeVisualization from '$lib/MemeVisualization.svelte';
import { memeTestData, memeTestDataNoTestedBranches } from './data/meme-test-data';

const meta = {
  title: 'Visualizations/MEME Visualization',
  component: MemeVisualization,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'MEME analysis results data in HyPhy JSON format'
    },
    pvalueThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'P-value threshold for significance'
    },
    showColumns: {
      control: 'check',
      options: ['Diversifying', 'Neutral', 'Invariable'],
      description: 'Which site classes to show in the table'
    },
    plotType: {
      control: 'select',
      options: [
        'p-values for selection',
        'number of branches under selection',
        'distribution of positively selected sites'
      ],
      description: 'Type of plot to display'
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'MEME (Mixed Effects Model of Evolution) visualization component for displaying episodic selection analysis results from HyPhy. Includes interactive phylogenetic tree viewer with adjustable dimensions.'
      }
    }
  }
} satisfies Meta<MemeVisualization>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story with test data
export const Default: Story = {
  args: {
    data: memeTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Neutral', 'Invariable'],
    plotType: 'p-values for selection'
  }
};

// Story showing branch selection plot
export const BranchSelectionPlot: Story = {
  args: {
    data: memeTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Neutral', 'Invariable'],
    plotType: 'number of branches under selection'
  }
};

// Story with strict threshold
export const StrictThreshold: Story = {
  args: {
    data: memeTestData,
    pvalueThreshold: 0.01,
    showColumns: ['Diversifying'],
    plotType: 'p-values for selection'
  }
};

// Story showing distribution plot
export const DistributionPlot: Story = {
  args: {
    data: memeTestData,
    pvalueThreshold: 0.05,
    showColumns: ['Diversifying', 'Neutral', 'Invariable'],
    plotType: 'distribution of positively selected sites'
  }
};

// Loading state
export const Loading: Story = {
  args: {
    data: null,
    pvalueThreshold: 0.1
  }
};

// Story highlighting the phylogenetic tree features
export const TreeVisualizationFocus: Story = {
  args: {
    data: memeTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Neutral'],
    plotType: 'p-values for selection'
  },
  parameters: {
    docs: {
      description: {
        story: 'MEME analysis with focus on the phylogenetic tree visualization. Use the width (400-2400px) and height (300-1600px) sliders above the tree to adjust dimensions for better viewing of different tree sizes.'
      }
    }
  }
};

// Story showing tested branches colored on the tree (new feature)
export const TestedBranchesHighlighted: Story = {
  args: {
    data: memeTestData,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Neutral', 'Invariable'],
    plotType: 'p-values for selection'
  },
  parameters: {
    docs: {
      description: {
        story: 'MEME analysis with tested branches highlighted on the phylogenetic tree. Tested branches are shown in red, background branches in gray. This is the default view when tested branch data is available.'
      }
    }
  }
};

// Story without tested branches data (for comparison)
export const WithoutTestedBranches: Story = {
  args: {
    data: memeTestDataNoTestedBranches,
    pvalueThreshold: 0.1,
    showColumns: ['Diversifying', 'Neutral', 'Invariable'],
    plotType: 'p-values for selection'
  },
  parameters: {
    docs: {
      description: {
        story: 'MEME analysis without tested branch information. The tree uses default coloring options (none, branch length, or bootstrap).'
      }
    }
  }
};
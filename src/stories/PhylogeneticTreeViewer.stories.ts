import type { Meta, StoryObj } from '@storybook/svelte';
import PhylogeneticTreeViewer from '$lib/PhylogeneticTreeViewer.svelte';

const sampleTreeData = {
  input: {
    trees: [
      "((Human:0.1,Chimp:0.2):0.05,(Gorilla:0.15,Orangutan:0.1):0.05);",
      "((A:0.25,B:0.3):0.1,(C:0.2,D:0.15):0.1);"
    ]
  },
  "branch attributes": [
    {
      "Human": {
        "branch length": 0.1,
        "dN/dS": 0.5
      },
      "Chimp": {
        "branch length": 0.2,
        "dN/dS": 1.5
      },
      "Gorilla": {
        "branch length": 0.15,
        "dN/dS": 0.8
      },
      "Orangutan": {
        "branch length": 0.1,
        "dN/dS": 1.2
      }
    },
    {
      "A": { "branch length": 0.25 },
      "B": { "branch length": 0.3 },
      "C": { "branch length": 0.2 },
      "D": { "branch length": 0.15 }
    }
  ]
};

const meta = {
  title: 'Visualizations/Phylogenetic Tree Viewer',
  component: PhylogeneticTreeViewer,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Tree data in HyPhy JSON format with Newick tree strings'
    },
    width: {
      control: { type: 'range', min: 400, max: 1200, step: 50 },
      description: 'Width of the tree visualization'
    },
    height: {
      control: { type: 'range', min: 300, max: 800, step: 50 },
      description: 'Height of the tree visualization'
    },
    branchLengthProperty: {
      control: 'text',
      description: 'Property name to use for branch lengths'
    },
    colorBranches: {
      control: 'select',
      options: ['none', 'branch length'],
      description: 'How to color tree branches'
    },
    showLabels: {
      control: 'boolean',
      description: 'Whether to show node labels'
    },
    treeIndex: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Which tree to display (for datasets with multiple trees)'
    }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Phylogenetic tree viewer component using phylotree.js for visualizing evolutionary trees from HyPhy analyses.'
      }
    }
  }
} satisfies Meta<PhylogeneticTreeViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default primate tree
export const Default: Story = {
  args: {
    data: sampleTreeData,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'none',
    showLabels: true,
    treeIndex: 0
  }
};

// Tree with branch coloring
export const ColoredBranches: Story = {
  args: {
    data: sampleTreeData,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'branch length',
    showLabels: true,
    treeIndex: 0
  }
};

// Second tree in dataset
export const SecondTree: Story = {
  args: {
    data: sampleTreeData,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'none',
    showLabels: true,
    treeIndex: 1
  }
};

// Compact view without labels
export const CompactView: Story = {
  args: {
    data: sampleTreeData,
    width: 600,
    height: 400,
    branchLengthProperty: 'branch length',
    colorBranches: 'branch length',
    showLabels: false,
    treeIndex: 0
  }
};

// Large tree view
export const LargeView: Story = {
  args: {
    data: sampleTreeData,
    width: 1000,
    height: 700,
    branchLengthProperty: 'branch length',
    colorBranches: 'branch length',
    showLabels: true,
    treeIndex: 0
  }
};

// No data state
export const NoData: Story = {
  args: {
    data: null,
    width: 800,
    height: 600
  }
};
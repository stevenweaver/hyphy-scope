import type { Meta, StoryObj } from '@storybook/svelte';
import PhylogeneticTreeViewer from '$lib/PhylogeneticTreeViewer.svelte';
import { phylotreeTestData, largePhylotreeTestData, phylotreeTestDataNoTested } from './data/phylotree-test-data';

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
      options: ['none', 'tested', 'branch length', 'bootstrap'],
      description: 'How to color tree branches'
    },
    testedBranches: {
      control: 'object',
      description: 'Object mapping branch names to "test" or "background" status'
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

// Default mammal tree
export const Default: Story = {
  args: {
    data: phylotreeTestData,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'none',
    showLabels: true,
    treeIndex: 0
  }
};

// Tree with branch coloring by dN/dS
export const ColoredBranches: Story = {
  args: {
    data: phylotreeTestData,
    width: 800,
    height: 600,
    branchLengthProperty: 'dN/dS',
    colorBranches: 'branch length',
    showLabels: true,
    treeIndex: 0
  }
};

// Primate tree (second tree in dataset)
export const PrimateTree: Story = {
  args: {
    data: phylotreeTestData,
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
    data: phylotreeTestData,
    width: 600,
    height: 400,
    branchLengthProperty: 'branch length',
    colorBranches: 'branch length',
    showLabels: false,
    treeIndex: 0
  }
};

// Large tree view
export const LargeTreeView: Story = {
  args: {
    data: largePhylotreeTestData,
    width: 1000,
    height: 700,
    branchLengthProperty: 'branch length',
    colorBranches: 'none',
    showLabels: true,
    treeIndex: 0
  }
};

// Large tree with colored branches
export const LargeTreeColoredBranches: Story = {
  args: {
    data: largePhylotreeTestData,
    width: 1000,
    height: 700,
    branchLengthProperty: 'dN/dS',
    colorBranches: 'branch length',
    showLabels: true,
    treeIndex: 0
  }
};

// Tree with bootstrap value coloring
export const BootstrapColoring: Story = {
  args: {
    data: phylotreeTestData,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'bootstrap',
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

// Tree with tested branches coloring (new feature)
export const TestedBranchesColoring: Story = {
  args: {
    data: phylotreeTestData,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'tested',
    testedBranches: phylotreeTestData.tested?.["0"],
    showLabels: true,
    treeIndex: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Tree with tested branches highlighted. Tested branches are shown in red, background branches in gray. This coloring mode is automatically selected when tested branch data is available in HyPhy analysis results.'
      }
    }
  }
};

// Tree without tested branch data
export const WithoutTestedBranches: Story = {
  args: {
    data: phylotreeTestDataNoTested,
    width: 800,
    height: 600,
    branchLengthProperty: 'branch length',
    colorBranches: 'none',
    showLabels: true,
    treeIndex: 0
  },
  parameters: {
    docs: {
      description: {
        story: 'Tree without tested branch information. The "Tested branches" coloring option will not appear in the dropdown when no tested data is provided.'
      }
    }
  }
};
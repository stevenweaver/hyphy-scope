import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

// Mock phylotree before importing component
vi.mock('phylotree', () => {
  const mockRender = vi.fn(() => ({
    style_nodes: vi.fn().mockReturnThis(),
    style_edges: vi.fn().mockReturnThis(),
    placenodes: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis()
  }));

  const mockPhylotreeConstructor = vi.fn(() => ({
    branch_length: vi.fn().mockReturnThis(),
    render: mockRender
  }));

  return {
    default: {
      phylotree: mockPhylotreeConstructor,
      newickParser: vi.fn((newick) => ({ newick: newick }))
    },
    phylotree: mockPhylotreeConstructor,
    newickParser: vi.fn((newick) => ({ newick: newick }))
  };
});

import PhylogeneticTreeViewer from './PhylogeneticTreeViewer.svelte';

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn(() => ({
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis()
    })),
    style: vi.fn().mockReturnThis()
  })),
  scaleSequential: vi.fn(() => ({
    domain: vi.fn().mockReturnThis()
  })),
  interpolateViridis: vi.fn(),
  extent: vi.fn(() => [0, 1])
}));

beforeEach(() => {
  // Reset DOM
  document.head.innerHTML = '';
});

const sampleTreeData = {
  input: {
    trees: [
      "((A:0.1,B:0.2):0.05,(C:0.15,D:0.1):0.05);"
    ]
  },
  "branch attributes": [
    {
      "A": {
        "branch length": 0.1,
        "dN/dS": 0.5
      },
      "B": {
        "branch length": 0.2,
        "dN/dS": 1.5
      }
    }
  ]
};

describe('PhylogeneticTreeViewer', () => {
  it('renders without data', () => {
    render(PhylogeneticTreeViewer, { data: null });
    expect(screen.getByText('No tree data provided')).toBeInTheDocument();
  });

  it('renders controls when data is provided', () => {
    render(PhylogeneticTreeViewer, { data: sampleTreeData });
    expect(screen.getByLabelText('Tree:')).toBeInTheDocument();
  });

  it('accepts tree configuration props', () => {
    const { container } = render(PhylogeneticTreeViewer, { 
      data: sampleTreeData,
      width: 600,
      height: 400,
      branchLengthProperty: 'dN/dS',
      colorBranches: 'branch length',
      showLabels: false,
      treeIndex: 0
    });
    
    expect(container).toBeInTheDocument();
  });

  it('renders tree container with data', () => {
    render(PhylogeneticTreeViewer, { 
      data: sampleTreeData
    });
    
    // Should show controls when data is provided
    expect(screen.getByText('Color branches:')).toBeInTheDocument();
  });
});

describe('PhylogeneticTreeViewer Data Parsing', () => {
  it('handles array format trees', () => {
    const arrayTreeData = {
      input: {
        trees: [
          "((A:0.1,B:0.2):0.05);",
          "((C:0.15,D:0.1):0.05);"
        ]
      }
    };
    
    render(PhylogeneticTreeViewer, { data: arrayTreeData });
    expect(screen.getByLabelText('Tree:')).toBeInTheDocument();
  });

  it('handles object format trees', () => {
    const objectTreeData = {
      input: {
        trees: {
          "tree1": "((A:0.1,B:0.2):0.05);",
          "tree2": "((C:0.15,D:0.1):0.05);"
        }
      }
    };
    
    render(PhylogeneticTreeViewer, { data: objectTreeData });
    expect(screen.getByLabelText('Tree:')).toBeInTheDocument();
  });

  it('handles string format tree', () => {
    const stringTreeData = {
      input: {
        trees: "((A:0.1,B:0.2):0.05,(C:0.15,D:0.1):0.05);"
      }
    };
    
    render(PhylogeneticTreeViewer, { data: stringTreeData });
    expect(screen.getByLabelText('Tree:')).toBeInTheDocument();
  });

  it('handles missing tree data gracefully', () => {
    const noTreeData = {
      input: {}
    };
    
    render(PhylogeneticTreeViewer, { data: noTreeData });
    expect(screen.getByLabelText('Tree:')).toBeInTheDocument();
  });
});
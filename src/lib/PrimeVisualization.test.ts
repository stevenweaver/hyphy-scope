import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PrimeVisualization from './PrimeVisualization.svelte';
import { mockPrimeData } from '../test/fixtures/prime-test-data';

// Mock Observable Plot
vi.mock('@observablehq/plot', () => ({
  plot: vi.fn(() => {
    const div = document.createElement('div');
    div.innerHTML = '<svg><text>Mock PRIME Plot</text></svg>';
    return div;
  }),
  dot: vi.fn(),
  ruleY: vi.fn(),
  rect: vi.fn(),
  barY: vi.fn(),
  line: vi.fn(),
  text: vi.fn(),
  tip: vi.fn(),
  pointer: vi.fn()
}));

// Mock phylotree
vi.mock('phylotree', () => ({
  phylotree: vi.fn().mockImplementation(() => ({
    root: { children: [], data: { name: 'root' } },
    render: vi.fn().mockReturnValue({ show: vi.fn() })
  }))
}));

describe('PrimeVisualization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when no data is provided', () => {
    render(PrimeVisualization, { props: { data: null } });
    expect(screen.getByText('Loading PRIME data...')).toBeInTheDocument();
  });

  it('renders summary tiles when data is provided', async () => {
    render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.1 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for sequence count
    expect(screen.getByText('10')).toBeInTheDocument();
    // Check for codon count (may appear in multiple places)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('renders all sections', async () => {
    render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.1 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText('PRIME Analysis Results')).toBeInTheDocument();
    expect(screen.getByText('Property-Level Analysis')).toBeInTheDocument();
    expect(screen.getByText('Site Deep-Dive')).toBeInTheDocument();
    expect(screen.getByText('3D Structure Visualization')).toBeInTheDocument();
  });

  it('renders FDR threshold control', async () => {
    render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.1 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByDisplayValue('0.1')).toBeInTheDocument();
  });

  it('handles different FDR thresholds', async () => {
    const { rerender } = render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.05 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await rerender({ data: mockPrimeData, fdrThreshold: 0.25 });
    expect(screen.getByDisplayValue('0.25')).toBeInTheDocument();
  });

  it('renders property selector', async () => {
    render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.1 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that property selector contains a property name
    expect(screen.getByText('Focus Property:')).toBeInTheDocument();
  });

  it('renders deep dive controls', async () => {
    render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.1 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText('Select Site:')).toBeInTheDocument();
    expect(screen.getByText('Significant Only')).toBeInTheDocument();
  });

  it('renders structure controls', async () => {
    render(PrimeVisualization, {
      props: { data: mockPrimeData, fdrThreshold: 0.1 }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText('Fetch')).toBeInTheDocument();
    expect(screen.getByText('Ready.')).toBeInTheDocument();
  });
});

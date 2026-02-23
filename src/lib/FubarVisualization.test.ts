import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FubarVisualization from './FubarVisualization.svelte';
import { parseFubarJSON } from './utils/fubar-utils';
import { mockFubarData, mockRegularFubarData } from '../test/fixtures/fubar-test-data';

// Mock Observable Plot
vi.mock('@observablehq/plot', () => ({
  plot: vi.fn(() => {
    const div = document.createElement('div');
    div.innerHTML = '<svg><text>Mock FUBAR Plot</text></svg>';
    return div;
  }),
  dot: vi.fn(),
  ruleY: vi.fn(),
  ruleX: vi.fn(),
  line: vi.fn(),
  areaY: vi.fn(),
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

describe('parseFubarJSON', () => {
  it('extracts correct site count', () => {
    const result = parseFubarJSON(mockFubarData);
    expect(result.sites).toHaveLength(3);
  });

  it('detects B-STILL', () => {
    const result = parseFubarJSON(mockFubarData);
    expect(result.meta.isBStill).toBe(true);
  });

  it('detects regular FUBAR (not B-STILL)', () => {
    const result = parseFubarJSON(mockRegularFubarData);
    expect(result.meta.isBStill).toBe(false);
  });

  it('parses B-STILL specific columns', () => {
    const result = parseFubarJSON(mockFubarData);
    expect(result.sites[0].probInv).toBeDefined();
    expect(result.sites[0].ebfInv).toBeDefined();
    expect(result.sites[0].probProx).toBeDefined();
  });

  it('parses regular FUBAR columns', () => {
    const result = parseFubarJSON(mockRegularFubarData);
    expect(result.sites[0].alpha).toBe(1.5);
    expect(result.sites[0].beta).toBe(0.5);
    expect(result.sites[0].probPos).toBe(0.10);
    expect(result.sites[0].bfPos).toBe(1.5);
  });

  it('extracts meta information', () => {
    const result = parseFubarJSON(mockFubarData);
    expect(result.meta.sequences).toBe(10);
    expect(result.meta.codons).toBe(3);
    expect(result.meta.filename).toBe("test_data.fna");
  });

  it('calculates tree length', () => {
    const result = parseFubarJSON(mockFubarData);
    expect(result.meta.treeLength).toBeCloseTo(1.0, 1);
  });

  it('throws on invalid input', () => {
    expect(() => parseFubarJSON(null)).toThrow();
    expect(() => parseFubarJSON({})).toThrow();
  });
});

describe('FubarVisualization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when no data is provided', () => {
    render(FubarVisualization, { props: { data: null } });
    expect(screen.getByText('Loading FUBAR data...')).toBeInTheDocument();
  });

  it('renders summary tiles with B-STILL data', async () => {
    render(FubarVisualization, { props: { data: mockFubarData } });
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('shows B-STILL label for B-STILL data', async () => {
    render(FubarVisualization, { props: { data: mockFubarData } });
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getAllByText(/B-STILL/).length).toBeGreaterThan(0);
  });

  it('renders all sections', async () => {
    render(FubarVisualization, { props: { data: mockFubarData } });
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText(/Analysis Results/)).toBeInTheDocument();
    expect(screen.getByText('Visualizations')).toBeInTheDocument();
    expect(screen.getByText('Site Deep Dive')).toBeInTheDocument();
    expect(screen.getByText('Phylogenetic Tree')).toBeInTheDocument();
  });

  it('renders evidence type controls', async () => {
    render(FubarVisualization, { props: { data: mockFubarData } });
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText('Evidence:')).toBeInTheDocument();
  });

  it('renders CSV export button', async () => {
    render(FubarVisualization, { props: { data: mockFubarData } });
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
  });
});

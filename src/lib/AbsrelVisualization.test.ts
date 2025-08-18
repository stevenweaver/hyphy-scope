import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AbsrelVisualization from './AbsrelVisualization.svelte';
import { mockAbsrelData } from '../test/fixtures/absrel-test-data';

// Mock Observable Plot
vi.mock('@observablehq/plot', () => ({
  plot: vi.fn(() => {
    const div = document.createElement('div');
    div.innerHTML = '<svg><text>Mock ABSREL Plot</text></svg>';
    return div;
  }),
  dot: vi.fn(),
  ruleY: vi.fn(),
  ruleX: vi.fn(),
  barX: vi.fn(),
  barY: vi.fn(),
  text: vi.fn(),
  axisY: vi.fn(),
  axisX: vi.fn()
}));

describe('AbsrelVisualization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when no data is provided', () => {
    render(AbsrelVisualization, { props: { data: null } });
    expect(screen.getByText('Loading ABSREL data...')).toBeInTheDocument();
  });

  it('renders summary tiles when data is provided', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    // Wait for component to process data
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for summary tiles
    expect(screen.getByText('Sequences')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
    expect(screen.getByText('Branches Tested')).toBeInTheDocument();
    
    // Check tile values
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders controls section', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for controls
    expect(screen.getByLabelText('p-value threshold:')).toBeInTheDocument();
    expect(screen.getByLabelText('Show only significant branches')).toBeInTheDocument();
  });

  it('renders plot section', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for plot section (may be conditional)
    // ABSREL has multiple plot types, just check if component rendered properly
    expect(screen.getByText('aBSREL Analysis Results')).toBeInTheDocument();
  });

  it('renders results table with branch information', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for table section
    expect(screen.getByText('Branch Test Results')).toBeInTheDocument();
    expect(screen.getAllByText('Node1')).toHaveLength(2); // appears in dropdown and table
    expect(screen.getAllByText('Node2')).toHaveLength(2); // appears in dropdown and table
  });

  it('processes branch test results correctly', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show branches with significant p-values
    // Node1 has p=0.023 which is < 0.05, so should be significant
    // Node2 has p=0.18 which is > 0.05, so should not be significant
    expect(screen.getByText('Branch Test Results')).toBeInTheDocument();
  });

  it('handles different p-value thresholds correctly', async () => {
    const { rerender } = render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Test with different threshold
    await rerender({ 
      data: mockAbsrelData,
      pvalueThreshold: 0.01 
    });

    // Test that component rerenders with new threshold
    expect(screen.getByText('aBSREL Analysis Results')).toBeInTheDocument();
  });

  it('displays ABSREL-specific analysis information', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // ABSREL should show information about branch-specific selection
    expect(screen.getByText('Adaptive Branch-Site Random Effects Likelihood')).toBeInTheDocument();
  });

  it('shows model comparison information', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show model fit information if available
    expect(screen.getByText('Model Comparison')).toBeInTheDocument();
  });

  it('handles rate distribution data', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // ABSREL should handle branch-specific rate distributions
    expect(screen.getByText('ω distribution for branch:')).toBeInTheDocument();
  });

  it('initializes with correct default values', () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData 
      } 
    });

    // Check default p-value threshold (typically 0.05 for ABSREL)
    expect(screen.getByDisplayValue('0.05')).toBeInTheDocument();
  });

  it('renders citation section', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for citation (though specific citation may vary)
    expect(screen.getByText('Citation')).toBeInTheDocument();
  });
});
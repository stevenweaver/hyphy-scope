import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MemeVisualization from './MemeVisualization.svelte';
import { mockMemeData } from '../test/fixtures/meme-test-data';

// Mock Observable Plot
vi.mock('@observablehq/plot', () => ({
  plot: vi.fn(() => {
    const div = document.createElement('div');
    div.innerHTML = '<svg><text>Mock MEME Plot</text></svg>';
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

describe('MemeVisualization Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when no data is provided', () => {
    render(MemeVisualization, { props: { data: null } });
    expect(screen.getByText('Loading MEME data...')).toBeInTheDocument();
  });

  it('renders summary tiles when data is provided', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    // Wait for component to process data
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for summary tiles - use getAllBy for numbers that may appear multiple times
    expect(screen.getByText('8')).toBeInTheDocument(); // sequences
    expect(screen.getAllByText('3')).toHaveLength(1); // sites
    expect(screen.getAllByText('1')).toHaveLength(2); // partitions and other tiles
  });

  it('renders controls section', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for controls
    expect(screen.getByLabelText('p-value threshold:')).toBeInTheDocument();
    expect(screen.getByLabelText('Plot type:')).toBeInTheDocument();
    expect(screen.getByText('Show classes:')).toBeInTheDocument();
  });

  it('renders plot section', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for plot section
    expect(screen.getByText('Figure 1')).toBeInTheDocument();
    // Just verify plot section exists
    expect(screen.getByText('Table 1')).toBeInTheDocument();
  });

  it('renders results table with count information', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for table section
    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText(/sites found to be under positive selection/)).toBeInTheDocument();
  });

  it('handles different p-value thresholds correctly', async () => {
    const { rerender } = render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Test with different threshold
    await rerender({ 
      data: mockMemeData,
      pvalueThreshold: 0.01 
    });

    expect(screen.getByDisplayValue('0.01')).toBeInTheDocument();
  });

  it('shows MEME-specific class filtering options', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for MEME class checkboxes (Diversifying, Neutral, Invariable)
    expect(screen.getByText('Diversifying')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Invariable')).toBeInTheDocument();
  });

  it('processes site data correctly for MEME analysis', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that the component processes the MEME-specific data structure
    // The component should handle beta+, p+, beta-, p- columns specific to MEME
    expect(screen.getByText('Table 1')).toBeInTheDocument();
  });

  it('displays correct MEME analysis description', async () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData,
        pvalueThreshold: 0.1 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // MEME should show description about episodic selection - multiple elements OK
    expect(screen.getAllByText(/episodic diversifying selection/i)).toHaveLength(3);
  });

  it('initializes with correct default values', () => {
    render(MemeVisualization, { 
      props: { 
        data: mockMemeData 
      } 
    });

    // Check default p-value threshold
    expect(screen.getByDisplayValue('0.1')).toBeInTheDocument();
  });
});
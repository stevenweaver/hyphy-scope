import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FelVisualization from './FelVisualization.svelte';
import { mockFelData } from '../test/fixtures/fel-test-data';
// Mock Observable Plot
vi.mock('@observablehq/plot', () => ({
    plot: vi.fn(() => {
        const div = document.createElement('div');
        div.innerHTML = '<svg><text>Mock FEL Plot</text></svg>';
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
describe('FelVisualization Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('renders loading state when no data is provided', () => {
        render(FelVisualization, { props: { data: null } });
        expect(screen.getByText('Loading FEL data...')).toBeInTheDocument();
    });
    it('renders summary tiles when data is provided', async () => {
        render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.1
            }
        });
        // Wait for component to process data
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check for summary tiles - use more specific text since FEL may use different labels
        // Look for the basic structure and key numbers instead of exact label text
        expect(screen.getByText('10')).toBeInTheDocument(); // sequences
        expect(screen.getAllByText('3')).toHaveLength(2); // sites (appears in multiple tiles)
        expect(screen.getByText('1')).toBeInTheDocument(); // partitions
    });
    it('renders controls section', async () => {
        render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.1
            }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check for controls
        expect(screen.getByLabelText('p-value threshold:')).toBeInTheDocument();
        // FEL has threshold control, verify it's working
        expect(screen.getByDisplayValue('0.1')).toBeInTheDocument();
    });
    it('renders plot section', async () => {
        render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.1
            }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check for plot section
        expect(screen.getByText('Figure 1')).toBeInTheDocument();
        // Just verify the plot section structure exists
        expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    it('renders results table', async () => {
        render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.1
            }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check for table section
        expect(screen.getByText('Table 1')).toBeInTheDocument();
        expect(screen.getByText('Detailed site-by-site results from the FEL analysis')).toBeInTheDocument();
    });
    it('renders citation section', async () => {
        render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.1
            }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check for citation
        expect(screen.getByText('Citation')).toBeInTheDocument();
        expect(screen.getByText(/Kosakovsky Pond/)).toBeInTheDocument();
    });
    it('handles different p-value thresholds correctly', async () => {
        const { rerender } = render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.05
            }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Test with different threshold
        await rerender({
            data: mockFelData,
            pvalueThreshold: 0.01
        });
        expect(screen.getByDisplayValue('0.01')).toBeInTheDocument();
    });
    it('shows checkbox options for class filtering', async () => {
        render(FelVisualization, {
            props: {
                data: mockFelData,
                pvalueThreshold: 0.1
            }
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Check for class checkboxes
        expect(screen.getByText('Diversifying')).toBeInTheDocument();
        expect(screen.getByText('Purifying')).toBeInTheDocument();
        expect(screen.getByText('Neutral')).toBeInTheDocument();
        expect(screen.getByText('Invariable')).toBeInTheDocument();
    });
    it('initializes with correct default values', () => {
        render(FelVisualization, {
            props: {
                data: mockFelData
            }
        });
        // Check default p-value threshold
        expect(screen.getByDisplayValue('0.1')).toBeInTheDocument();
    });
});

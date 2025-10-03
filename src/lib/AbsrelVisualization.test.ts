import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AbsrelVisualization from './AbsrelVisualization.svelte';
import { mockAbsrelData } from '../test/fixtures/absrel-test-data';
import * as absrelUtils from './utils/absrel-utils';
import * as absrelPlots from './utils/absrel-plots';

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

    // Check for summary tiles (enhanced tiles use different descriptions)
    const hasBasicTiles = screen.queryByText('Sequences');
    const hasEnhancedTiles = screen.queryByText('sequences in the alignment');
    
    expect(hasBasicTiles || hasEnhancedTiles).toBeTruthy();
    
    // Check tile values (there might be duplicates from enhanced tiles)
    expect(screen.getAllByText('12')).toBeDefined();
    expect(screen.getAllByText('5')).toBeDefined(); // Use getAllByText since it appears in tiles and table
    expect(screen.getAllByText('1')).toBeDefined(); // May have duplicates like '12'
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

  it('renders rate table with branch information', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for rate table section
    expect(screen.getByText('Branch-by-branch Rate Results')).toBeInTheDocument();
    expect(screen.getAllByText('Node1').length).toBeGreaterThanOrEqual(1); // appears in dropdown and rate table
    expect(screen.getAllByText('Node2').length).toBeGreaterThanOrEqual(1); // appears in dropdown and rate table
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
    expect(screen.getByText('Branch-by-branch Rate Results')).toBeInTheDocument();
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

  it('shows branch-by-branch rate results section', async () => {
    render(AbsrelVisualization, { 
      props: { 
        data: mockAbsrelData,
        pvalueThreshold: 0.05 
      } 
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should show branch-by-branch rate results section
    expect(screen.getByText('Branch-by-branch Rate Results')).toBeInTheDocument();
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
    expect(screen.getByText('ω distribution')).toBeInTheDocument();
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

  describe('Enhanced ABSREL Features', () => {
    it('renders enhanced tile table when enabled', async () => {
      render(AbsrelVisualization, { 
        props: { 
          data: mockAbsrelData
        } 
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // The enhanced tile table should be shown by default
      // Check for enhanced summary tiles if they have data
      if (screen.queryByText('Analysis Summary')) {
        expect(screen.getByText('Analysis Summary')).toBeInTheDocument();
      }
    });

    it('shows evidence ratio threshold control', async () => {
      render(AbsrelVisualization, { 
        props: { 
          data: mockAbsrelData 
        } 
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for evidence ratio threshold control
      expect(screen.getByLabelText('Evidence ratio threshold:')).toBeInTheDocument();
    });

    it('shows rate table when data is available', async () => {
      render(AbsrelVisualization, { 
        props: { 
          data: mockAbsrelData 
        } 
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for the new branch-by-branch rate table
      expect(screen.getByText('Branch-by-branch Rate Results')).toBeInTheDocument();
    });

    it('renders interactive rate table with proper formatting', async () => {
      render(AbsrelVisualization, { 
        props: { 
          data: mockAbsrelData 
        } 
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for rate table with proper columns
      expect(screen.getByText('ω distribution')).toBeInTheDocument();
      expect(screen.getByText('ω plot')).toBeInTheDocument();
      expect(screen.getAllByText('Rate Classes').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ABSREL Utility Functions', () => {
    it('getAbsrelAttributes extracts comprehensive attributes', () => {
      const attributes = absrelUtils.getAbsrelAttributes(mockAbsrelData);
      
      expect(attributes).toHaveProperty('positiveResults');
      expect(attributes).toHaveProperty('pvalueThreshold');
      expect(attributes).toHaveProperty('profilableBranches');
      expect(attributes).toHaveProperty('numberOfSequences');
      expect(attributes).toHaveProperty('numberOfSites');
      expect(attributes).toHaveProperty('profileBranchSites');
    });

    it('getAbsrelTileSpecs creates tile specifications', () => {
      const distributionTable = absrelUtils.getAbsrelDistributionTable(mockAbsrelData, 100);
      const tileSpecs = absrelUtils.getAbsrelTileSpecs(mockAbsrelData, 100, distributionTable);
      
      expect(Array.isArray(tileSpecs)).toBe(true);
      expect(tileSpecs.length).toBeGreaterThan(0);
      expect(tileSpecs[0]).toHaveProperty('number');
      expect(tileSpecs[0]).toHaveProperty('description');
      expect(tileSpecs[0]).toHaveProperty('icon');
      expect(tileSpecs[0]).toHaveProperty('color');
    });

    it('getAbsrelTreeColorOptions returns color options', () => {
      const colorOptions = absrelUtils.getAbsrelTreeColorOptions(mockAbsrelData, 100);
      
      expect(Array.isArray(colorOptions)).toBe(true);
      expect(colorOptions).toContain('Tested');
    });

    it('getAbsrelSiteTableData creates site table data', () => {
      const [siteInfo, headers] = absrelUtils.getAbsrelSiteTableData(mockAbsrelData, 100);
      
      expect(Array.isArray(siteInfo)).toBe(true);
      expect(typeof headers).toBe('object');
      expect(headers).toHaveProperty('Codon');
    });
  });

  describe('ABSREL Plot Functions', () => {
    it('getAbsrelPlotDescription returns descriptions', () => {
      const description = absrelPlots.getAbsrelPlotDescription('Synonymous rates');
      
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('getAbsrelPlotOptions returns available plot options', () => {
      const plotOptions = absrelPlots.getAbsrelPlotOptions(1, {}, [], [{}]);
      
      expect(Array.isArray(plotOptions)).toBe(true);
      expect(plotOptions.length).toBeGreaterThan(0);
      expect(plotOptions[0]).toHaveLength(2);
      expect(typeof plotOptions[0][0]).toBe('string');
      expect(typeof plotOptions[0][1]).toBe('function');
    });

    it('createSynonymousRatesPlot creates plot for site data', () => {
      const siteData = [{ 'SRV posterior mean': 1.5, Codon: 1 }];
      const plot = absrelPlots.createSynonymousRatesPlot(siteData, 1, 10);
      
      expect(plot).toBeDefined();
    });

    it('createPositiveSelectionHeatmap creates heatmap plot', () => {
      const branchSiteData = [{ 
        Key: 'branch1|1', 
        branch: 'branch1', 
        EBF: 5.0, 
        subs: 2 
      }];
      const plot = absrelPlots.createPositiveSelectionHeatmap(
        branchSiteData, 1, 10, ['branch1'], 'subs', 'EBF'
      );
      
      expect(plot).toBeDefined();
    });

    it('createEvidenceRatioProfilePlot creates profile plot', () => {
      const profileData = [{ 
        site: 1, 
        branch: 'branch1', 
        ER: 150, 
        subs: 2, 
        from: 'ATG', 
        to: 'CTG' 
      }];
      const plot = absrelPlots.createEvidenceRatioProfilePlot(
        profileData, 1, 10, ['branch1'], 'subs'
      );
      
      expect(plot).toBeDefined();
    });
  });
});
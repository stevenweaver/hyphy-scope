<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css"
  />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { AbsrelResults, AbsrelBranchData, AbsrelSiteData } from './utils/absrel-utils.js';
  import { 
    getAbsrelSummary, 
    getTestedBranches, 
    getAbsrelSiteData,
    getSignificantBranches,
    getAbsrelTableHeaders,
    formatAbsrelValue,
    getPValueColor,
    getAbsrelDistributionTable,
    getAbsrelProfileBranchSites,
    getAbsrelSiteTableData,
    getAbsrelTestOmega
  } from './utils/absrel-utils.js';
  import { 
    createPValuePlot,
    createBayesFactorPlot,
    createOmegaDistributionPlot,
    createSiteLogLikelihoodPlot,
    createModelComparisonPlot,
    createSynonymousRatesPlot,
    createPositiveSelectionHeatmap,
    createEvidenceRatioProfilePlot,
    getAbsrelPlotDescription,
    getAbsrelPlotOptions,
    getAbsrelPlotSpec
  } from './utils/absrel-plots.js';
  import { phylotree } from 'phylotree';

  export let data: AbsrelResults;

  // Reactive data processing
  $: baseSummary = data ? getAbsrelSummary(data) : null;
  $: summary = baseSummary ? {
    ...baseSummary,
    branchesWithSelection: significantBranches.length,
    pValueThreshold
  } : null;
  $: testedBranches = data ? getTestedBranches(data) : [];
  $: significantBranches = testedBranches ? getSignificantBranches(testedBranches, pValueThreshold) : [];
  $: siteData = data ? getAbsrelSiteData(data) : [];
  
  // Distribution table for rate table
  $: distributionTable = data ? getAbsrelDistributionTable(data, evidenceThreshold) : [];
  
  // Site-by-site results table data
  $: siteTableData = data ? getAbsrelSiteTableData(data, evidenceThreshold) : [[], {}];
  
  // Branch-specific site results
  $: branchSiteTableData = data && selectedBranchForOmega ? 
    getAbsrelProfileBranchSites(data).filter(site => site.branch === selectedBranchForOmega && site.ER >= evidenceThreshold) :
    [];

  // Controls and filters
  let pValueThreshold: number;
  $: pValueThreshold = data?.['p-value threshold'] ?? 0.05;
  let selectedBranches: string[] = [];
  let showOnlySignificant = false;
  let selectedBranchForOmega: string = '';
  let evidenceThreshold = 1;
  
  // Heatmap controls
  let selectedPlotType = 'evidence-ratio';
  let selectedSizeField = 'subs';
  let startSite = 1;
  let sitesToShow = 70;
  
  // Tree controls
  let showTree = true;
  let colorBranches = 'Support for selection';
  let branchLength = 'Baseline MG94xREV';
  let treeWidth = 800;
  let treeHeight = 600;
  let showScale = true;
  let alignTips = false;
  let showInternal = false;
  
  // Formatting functions
  const floatFormat = d3.format(".4g");
  const proportionFormat = d3.format(".5p");
  
  // Distribution summary functions
  function distMean(distribution: Array<{value: number; weight: number}>): number {
    return distribution.reduce((sum, d) => sum + (d.value * d.weight), 0);
  }
  
  function distVar(distribution: Array<{value: number; weight: number}>): number {
    const mean = distMean(distribution);
    return distribution.reduce((sum, d) => sum + (Math.pow(d.value - mean, 2) * d.weight), 0);
  }

  // Create mini omega distribution plot matching the original Observable design
  function createMiniOmegaPlot(distribution: Array<{value: number; weight: number}>): HTMLDivElement {
    if (!distribution.length) {
      const div = document.createElement('div');
      div.textContent = 'N/A';
      return div;
    }

    const width = 200;
    const height = 50;
    const margin = { top: 5, right: 15, bottom: 15, left: 15 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.style.display = 'block';
    svg.style.fontSize = '8px';
    svg.style.fontFamily = 'Arial, sans-serif';

    // Create scales - ensure values are numbers and use log scale for better visualization
    const values = distribution.map(d => Number(d.value || 0));
    const weights = distribution.map(d => Number(d.weight || 0));
    
    const maxOmega = Math.max(...values);
    const minOmega = Math.max(0.001, Math.min(...values)); // Avoid log(0)
    
    // Use log scale for better visualization of wide ranges
    const useLogScale = maxOmega / minOmega > 10;
    
    let xScale: (omega: number) => number;
    let tickValues: number[] = [];
    
    if (useLogScale) {
      const logMin = Math.log10(minOmega);
      const logMax = Math.log10(maxOmega);
      xScale = (omega: number) => {
        const logOmega = Math.log10(Math.max(0.001, omega));
        return margin.left + ((logOmega - logMin) / (logMax - logMin)) * plotWidth;
      };
      
      // Generate nice tick values for log scale
      const logRange = logMax - logMin;
      if (logRange > 4) {
        tickValues = [minOmega, 1, 10, 100, maxOmega].filter(v => v >= minOmega && v <= maxOmega);
      } else if (logRange > 2) {
        tickValues = [minOmega, 1, 10, maxOmega].filter(v => v >= minOmega && v <= maxOmega);
      } else {
        tickValues = [minOmega, 1, maxOmega].filter(v => v >= minOmega && v <= maxOmega);
      }
    } else {
      // Linear scale for smaller ranges
      xScale = (omega: number) => {
        return margin.left + ((omega - minOmega) / (maxOmega - minOmega)) * plotWidth;
      };
      tickValues = [minOmega, maxOmega];
      if (minOmega <= 1 && maxOmega >= 1) {
        tickValues = [minOmega, 1, maxOmega].filter((v, i, arr) => arr.indexOf(v) === i);
      }
    }

    // Add horizontal axis line
    const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisLine.setAttribute('x1', margin.left.toString());
    axisLine.setAttribute('y1', (height - margin.bottom).toString());
    axisLine.setAttribute('x2', (width - margin.right).toString());
    axisLine.setAttribute('y2', (height - margin.bottom).toString());
    axisLine.setAttribute('stroke', '#333');
    axisLine.setAttribute('stroke-width', '1');
    svg.appendChild(axisLine);

    // Add tick marks and labels
    tickValues.forEach(tickValue => {
      const x = xScale(tickValue);
      
      // Tick mark
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', x.toString());
      tick.setAttribute('y1', (height - margin.bottom).toString());
      tick.setAttribute('x2', x.toString());
      tick.setAttribute('y2', (height - margin.bottom + 3).toString());
      tick.setAttribute('stroke', '#333');
      tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);
      
      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x.toString());
      label.setAttribute('y', (height - 2).toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '8');
      label.setAttribute('fill', '#333');
      
      // Format label based on value
      let labelText: string;
      if (tickValue >= 1000) {
        labelText = (tickValue / 1000).toFixed(0) + 'k';
      } else if (tickValue >= 1) {
        labelText = tickValue.toFixed(0);
      } else {
        labelText = tickValue.toFixed(3);
      }
      
      label.textContent = labelText;
      svg.appendChild(label);
    });

    // Calculate and add mean line
    const mean = distMean(distribution);
    if (mean >= minOmega && mean <= maxOmega) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const x = xScale(mean);
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', margin.top.toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', (height - margin.bottom).toString());
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '3,2');
      svg.appendChild(line);
    }

    // Add dots for each rate class
    const maxWeight = Math.max(...weights) || 1;
    const centerY = margin.top + plotHeight / 2;
    
    distribution.forEach((d, i) => {
      const value = Number(d.value || 0);
      const weight = Number(d.weight || 0);
      
      const x = xScale(value);
      const radius = 2 + (weight / maxWeight) * 6; // Scale radius by weight
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', radius.toString());
      
      // Color based on omega value
      const color = value > 1 ? '#e74c3c' : value === 1 ? '#2ecc71' : '#3498db';
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('opacity', '0.9');
      
      // Add hover title
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `ω=${value.toFixed(3)}, weight=${(weight * 100).toFixed(1)}%`;
      circle.appendChild(title);
      
      svg.appendChild(circle);
    });

    const div = document.createElement('div');
    div.appendChild(svg);
    return div;
  }

  // Sorting for rate distribution table
  let rateTableSortColumn = 'p-value';
  let rateTableSortDirection: 'asc' | 'desc' = 'asc';

  // Reactive filtering and sorting for distribution table
  $: filteredDistributionTable = showOnlySignificant 
    ? distributionTable.filter(row => row.tested === 'Yes' && row['p-value'] !== null && row['p-value'] <= pValueThreshold)
    : distributionTable;
    
  $: sortedDistributionTable = [...filteredDistributionTable].sort((a, b) => {
    let aVal = a[rateTableSortColumn as keyof typeof a];
    let bVal = b[rateTableSortColumn as keyof typeof b];
    
    // Handle null values
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    
    const comparison = typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal));
    
    return rateTableSortDirection === 'asc' ? comparison : -comparison;
  });

  // Plot containers
  let bayesFactorPlotContainer: HTMLDivElement;
  let siteLogLikePlotContainer: HTMLDivElement;
  let heatmapContainer: HTMLDivElement;
  let treeContainer: HTMLDivElement;

  // Initialize plots when data is available and component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  $: if (mounted && testedBranches.length > 0) {
    renderPlots();
  }

  // Reactive heatmap rendering
  $: if (mounted && data && heatmapContainer) {
    renderAdvancedHeatmap();
  }
  
  // Re-render heatmap when plot type or other parameters change
  $: if (mounted && data && heatmapContainer && (selectedPlotType || startSite || sitesToShow || selectedSizeField || evidenceThreshold)) {
    renderAdvancedHeatmap();
  }
  
  // Re-render tree when parameters change
  $: if (mounted && data && showTree && (colorBranches || branchLength || treeWidth || treeHeight || showScale || alignTips || showInternal)) {
    renderAbsrelTree();
  }

  function renderPlots() {
    // Bayes Factor plot
    if (bayesFactorPlotContainer) {
      const bayesFactorPlot = createBayesFactorPlot(testedBranches);
      if (bayesFactorPlot) {
        bayesFactorPlotContainer.innerHTML = '';
        bayesFactorPlotContainer.appendChild(bayesFactorPlot);
      }
    }

    // Site log likelihood plot
    if (siteLogLikePlotContainer && siteData.length > 0) {
      const sitePlot = createSiteLogLikelihoodPlot(siteData, selectedBranches);
      if (sitePlot) {
        siteLogLikePlotContainer.innerHTML = '';
        siteLogLikePlotContainer.appendChild(sitePlot);
      }
    }
    
    // Tree rendering
    if (treeContainer && showTree) {
      renderAbsrelTree();
    }
  }
  
  function renderAbsrelTree() {
    if (!data?.input?.trees || !treeContainer) return;
    
    try {
      // Clear previous tree
      treeContainer.innerHTML = '';
      
      // Get the Newick string
      const newick = data.input.trees;
      if (!newick) return;
      
      // Create phylotree instance
      const tree = new phylotree(newick);
      
      // Validate tree was created successfully
      if (!tree) {
        treeContainer.innerHTML = '<p>Failed to create tree from data</p>';
        return;
      }
      
      // Skip branch length accessor - causes phylotree.js internal errors
      // Branch lengths will be handled by the tree's native parsing
      
      // Render the tree
      const renderedTree = tree.render({
        height: treeHeight,
        width: treeWidth,
        'align-tips': alignTips,
        'selectable': false,
        'show-scale': showScale,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': () => 0,
        'internal-names': showInternal
      });

      // Validate tree was rendered successfully
      if (!renderedTree) {
        treeContainer.innerHTML = '<p>Failed to render tree</p>';
        return;
      }

      // Add SVG definitions for gradients (with safety check)
      const svg = renderedTree.svg;
      let defs = svg.select('defs');
      if (defs.empty()) {
        defs = svg.append('defs');
      }

      // Apply branch coloring based on selected option
      if (colorBranches === 'Tested') {
        const tested = data.tested?.[0] || {};
        renderedTree.style_edges((element, node) => {
          const branchName = node.target?.data?.name;
          if (branchName && tested[branchName] === 'test') {
            element.style('stroke', 'firebrick');
          } else {
            element.style('stroke', null);
          }
        });
      } else if (colorBranches === 'Support for selection') {
        // Create colorblind-friendly color scale with more pop
        const colorScale = d3.scaleDivergingLog()
          .domain([1e-4, 1, 1000])
          .range(['#0571b0', '#f7f7f7', '#ca0020']); // Colorblind-friendly blue-white-red
        
        let gradientId = 0;
        const tested = data.tested?.[0] || {};
        
        renderedTree.style_edges((element, node) => {
          const branchName = node.target?.data?.name;
          if (!branchName) return;
          
          const isTest = tested[branchName] === 'test';
          const omegaData = getAbsrelTestOmega(data, branchName);
          
          // Calculate p-value based stroke width
          const testResults = data['test results']?.[branchName];
          const pValue = testResults?.['corrected p'] || testResults?.['Corrected P-value'];
          let strokeWidth = 2; // Default
          
          if (isTest && pValue !== undefined) {
            if (pValue <= 0.001) {
              strokeWidth = 6; // Highly significant
            } else if (pValue <= 0.01) {
              strokeWidth = 5; // Very significant  
            } else if (pValue <= 0.05) {
              strokeWidth = 4; // Significant
            } else {
              strokeWidth = 3; // Not significant but tested
            }
          }
          
          if (omegaData.length > 0) {
            // Create gradient for this branch
            const gradientIdStr = `absrel_gradient_${gradientId++}`;
            const gradient = defs.append('linearGradient')
              .attr('id', gradientIdStr);
            
            let currentFrac = 0;
            omegaData.forEach(omega => {
              gradient.append('stop')
                .attr('offset', `${currentFrac * 100}%`)
                .style('stop-color', colorScale(omega.value));
              
              currentFrac += omega.weight;
              gradient.append('stop')
                .attr('offset', `${currentFrac * 100}%`)
                .style('stop-color', colorScale(omega.value));
            });
            
            // Apply gradient to branch with p-value thickness
            element.style('stroke', `url(#${gradientIdStr})`)
              .style('stroke-width', `${strokeWidth}px`)
              .style('opacity', isTest ? 1.0 : 0.6)
              .style('stroke-linejoin', 'round')
              .style('stroke-linecap', 'round');
            
            // Add tooltip
            const maxOmega = omegaData[omegaData.length - 1];
            
            let tooltipText = `${branchName} `;
            if (isTest && pValue !== undefined) {
              const significance = pValue <= 0.001 ? '***' : pValue <= 0.01 ? '**' : pValue <= 0.05 ? '*' : '';
              tooltipText += `(p = ${pValue.toFixed(3)}${significance})`;
            } else {
              tooltipText += '(not tested)';
            }
            tooltipText += ` max ω = ${maxOmega.value.toFixed(2)}`;
            
            element.selectAll('title').data([tooltipText]).join('title').text(d => d);
          }
        });
      }
      
      // Style nodes to use monospace font (only if renderedTree is properly initialized)
      if (renderedTree && typeof renderedTree.style_nodes === 'function') {
        renderedTree.style_nodes((element, node) => {
          element.selectAll('text').style('font-family', 'ui-monospace');
          if (!node.children || !node.children.length) {
            element.selectAll('title').data([node.data.name]).join('title').text(d => d);
          }
        });
      }
      
      // Skip traverse_and_compute and resortChildren - these can cause phylotree.js internal errors
      // The tree will use its default layout and sorting
      
      // Add to container (using the safer approach from PhylogeneticTreeViewer)
      treeContainer.innerHTML = '';
      if (renderedTree && typeof renderedTree.show === 'function') {
        treeContainer.appendChild(renderedTree.show());
      } else {
        treeContainer.innerHTML = '<p>Tree rendering failed - invalid tree data</p>';
      }
      
    } catch (error) {
      console.error('Error rendering ABSREL tree:', error);
      treeContainer.innerHTML = '<p>Error rendering tree</p>';
    }
  }

  function renderAdvancedHeatmap() {
    if (!heatmapContainer || !data) return;

    // Get profile branch sites data
    const profileBranchSites = getAbsrelProfileBranchSites(data);
    const testedBranchNames = testedBranches.map(b => b.name);
    
    // If no profile data available, generate mock data for visualization
    let plotData = profileBranchSites;
    if (plotData.length === 0) {
      plotData = generateMockProfileData(data, testedBranchNames);
    }
    
    let plot: any = null;

    switch (selectedPlotType) {
      case 'evidence-ratio':
        plot = createScrollableEvidenceRatioHeatmap(
          plotData,
          startSite,
          sitesToShow,
          testedBranchNames,
          selectedSizeField,
          Math.max(1, evidenceThreshold)
        );
        break;
      
      case 'positive-selection':
        // Convert profile data to format expected by positive selection heatmap
        const bsData = plotData.map(site => ({
          ...site,
          EBF: site.ER, // Use ER as EBF for coloring
          [selectedSizeField]: site[selectedSizeField] || site.subs || 0
        }));
        plot = createScrollablePositiveSelectionHeatmap(
          bsData,
          startSite,
          sitesToShow,
          testedBranchNames,
          selectedSizeField
        );
        break;
      
      case 'synonymous-rates':
        const srvData = generateSynonymousRateData(data, startSite, sitesToShow);
        plot = createScrollableSynonymousRatesPlot(srvData, startSite, sitesToShow);
        break;
    }

    if (plot) {
      heatmapContainer.innerHTML = '';
      heatmapContainer.appendChild(plot);
    }
  }

  // Create clean, minimal site evidence visualization
  function createScrollableEvidenceRatioHeatmap(
    profileBranchSites: any[],
    startSite: number,
    sitesToShow: number,
    branchOrder: string[],
    sizeField: string,
    threshold: number,
    plotType: string = 'evidence-ratio'
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.overflowX = 'auto';
    container.style.backgroundColor = '#fff';
    
    const endSite = startSite + sitesToShow - 1;
    const plotData = profileBranchSites
      .filter(d => d.site >= startSite && d.site <= endSite && branchOrder.includes(d.branch));

    if (plotData.length === 0) {
      const message = document.createElement('div');
      message.style.padding = '40px';
      message.style.textAlign = 'center';
      message.style.color = '#999';
      message.style.fontStyle = 'italic';
      message.textContent = 'No selection evidence in this range';
      container.appendChild(message);
      return container;
    }

    const cellSize = 16;
    const plotWidth = Math.max(400, sitesToShow * cellSize);
    const plotHeight = branchOrder.length * cellSize;
    const margin = { top: 20, right: 20, bottom: 40, left: 80 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', (plotWidth + margin.left + margin.right).toString());
    svg.setAttribute('height', (plotHeight + margin.top + margin.bottom).toString());
    svg.style.display = 'block';
    svg.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

    // Simple scales
    const xScale = (site: number) => margin.left + (site - startSite) * cellSize;
    const yScale = (branchIndex: number) => margin.top + branchIndex * cellSize;

    // Colorblind-friendly gradient for evidence strength
    const maxER = Math.max(...plotData.map(d => d.ER), 1);
    const colorScale = (er: number) => {
      const intensity = Math.min(er / maxER, 1);
      
      // Interpolate between colorblind-friendly colors
      if (intensity <= 0.33) {
        // Blue to Yellow
        const t = intensity / 0.33;
        const r = Math.round(86 + (240 - 86) * t);   // #56B4E9 to #F0E442
        const g = Math.round(180 + (228 - 180) * t);
        const b = Math.round(233 + (66 - 233) * t);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (intensity <= 0.66) {
        // Yellow to Orange  
        const t = (intensity - 0.33) / 0.33;
        const r = Math.round(240 + (230 - 240) * t); // #F0E442 to #E69F00
        const g = Math.round(228 + (159 - 228) * t);
        const b = Math.round(66 + (0 - 66) * t);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Orange to Purple
        const t = (intensity - 0.66) / 0.34;
        const r = Math.round(230 + (204 - 230) * t); // #E69F00 to #CC79A7
        const g = Math.round(159 + (121 - 159) * t);
        const b = Math.round(0 + (167 - 0) * t);
        return `rgb(${r}, ${g}, ${b})`;
      }
    };

    // Branch labels (minimal)
    branchOrder.forEach((branch, i) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (margin.left - 8).toString());
      text.setAttribute('y', (yScale(i) + cellSize/2 + 3).toString());
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#666');
      text.textContent = branch;
      svg.appendChild(text);
    });

    // Site labels (minimal, every 10th)
    for (let site = startSite; site <= endSite; site += 10) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (xScale(site) + cellSize/2).toString());
      text.setAttribute('y', (margin.top + plotHeight + 15).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#999');
      text.textContent = site.toString();
      svg.appendChild(text);
    }

    // Create a tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px 12px';
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.fontSize = '12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s';
    tooltip.style.zIndex = '1000';
    tooltip.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    tooltip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    document.body.appendChild(tooltip);

    // Data visualization with background squares and substitution circles
    plotData.forEach(d => {
      if (d.ER > 1) { // Only show evidence above baseline
        const branchIndex = branchOrder.indexOf(d.branch);
        
        // Create a group for better event handling
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.style.cursor = 'pointer';
        
        // Background rectangle for evidence strength
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', xScale(d.site).toString());
        rect.setAttribute('y', yScale(branchIndex).toString());
        rect.setAttribute('width', (cellSize - 1).toString());
        rect.setAttribute('height', (cellSize - 1).toString());
        rect.setAttribute('fill', colorScale(d.ER));
        rect.setAttribute('rx', '1');
        group.appendChild(rect);
        
        // Small circle for substitution count based on selected field
        const subsValue = selectedSizeField === 'syn_subs' ? (d.syn_subs || 0) :
                         selectedSizeField === 'nonsyn_subs' ? (d.nonsyn_subs || 0) :
                         (d.subs || 0);
        
        if (subsValue > 0) {
          const maxSubs = Math.max(...plotData.map(d => 
            selectedSizeField === 'syn_subs' ? (d.syn_subs || 0) :
            selectedSizeField === 'nonsyn_subs' ? (d.nonsyn_subs || 0) :
            (d.subs || 0)
          ), 1);
          
          // Circle radius based on substitution count (2-6px range)
          const radius = 2 + (subsValue / maxSubs) * 4;
          
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', (xScale(d.site) + cellSize/2).toString());
          circle.setAttribute('cy', (yScale(branchIndex) + cellSize/2).toString());
          circle.setAttribute('r', radius.toString());
          circle.setAttribute('fill', '#333');
          circle.setAttribute('opacity', '0.7');
          circle.style.pointerEvents = 'none'; // Let events pass through to the rect
          group.appendChild(circle);
        }
        
        // Enhanced tooltip content
        const subsInfo = selectedSizeField === 'syn_subs' ? `Synonymous: ${d.syn_subs || 0}` :
                        selectedSizeField === 'nonsyn_subs' ? `Non-synonymous: ${d.nonsyn_subs || 0}` :
                        `Total: ${d.subs || 0}`;
        
        // Add mouse events for tooltip
        group.addEventListener('mouseenter', (e) => {
          const metricLabel = plotType === 'positive-selection' ? 'Empirical Bayes Factor' : 'Evidence Ratio';
          const metricValue = plotType === 'positive-selection' ? (d.EBF || d.ER) : d.ER;
          
          const tooltipContent = `
            <div style="font-weight: bold; margin-bottom: 4px;">${d.branch}</div>
            <div>Site: ${d.site}</div>
            <div>${metricLabel}: ${metricValue.toFixed(2)}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div>Substitutions:</div>
              <div style="margin-left: 8px;">Total: ${d.subs || 0}</div>
              <div style="margin-left: 8px;">Synonymous: ${d.syn_subs || 0}</div>
              <div style="margin-left: 8px;">Non-synonymous: ${d.nonsyn_subs || 0}</div>
            </div>
            ${d.from && d.to ? `<div style="margin-top: 4px;">Codon: ${d.from} → ${d.to}</div>` : ''}
          `;
          
          tooltip.innerHTML = tooltipContent;
          tooltip.style.opacity = '1';
          
          // Position tooltip
          const rect = (e.target as Element).getBoundingClientRect();
          const x = rect.left + window.scrollX + cellSize / 2;
          const y = rect.top + window.scrollY - 10;
          
          // Adjust position to keep tooltip on screen
          const tooltipRect = tooltip.getBoundingClientRect();
          let adjustedX = x - tooltipRect.width / 2;
          let adjustedY = y - tooltipRect.height;
          
          if (adjustedX < 10) adjustedX = 10;
          if (adjustedX + tooltipRect.width > window.innerWidth - 10) {
            adjustedX = window.innerWidth - tooltipRect.width - 10;
          }
          
          if (adjustedY < 10) {
            adjustedY = rect.bottom + window.scrollY + 10;
          }
          
          tooltip.style.left = `${adjustedX}px`;
          tooltip.style.top = `${adjustedY}px`;
        });
        
        group.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
        });
        
        svg.appendChild(group);
      }
    });
    
    // Clean up tooltip when container is removed
    container.addEventListener('DOMNodeRemoved', () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });

    container.appendChild(svg);
    
    // Add legend
    const legend = createHeatmapLegend(plotType);
    container.appendChild(legend);
    
    return container;
  }

  // Create legend for heatmap visualization
  function createHeatmapLegend(plotType: string = 'evidence-ratio'): HTMLDivElement {
    const container = document.createElement('div');
    container.style.marginTop = '20px';
    container.style.fontSize = '12px';
    container.style.color = '#666';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

    // Color scale legend
    const colorLegend = document.createElement('div');
    colorLegend.style.marginBottom = '12px';
    
    const colorTitle = document.createElement('div');
    colorTitle.style.fontWeight = '500';
    colorTitle.style.marginBottom = '4px';
    colorTitle.textContent = plotType === 'positive-selection' ? 
      'Empirical Bayes Factor (color intensity)' : 
      'Evidence Ratio (color intensity)';
    colorLegend.appendChild(colorTitle);
    
    const colorScale = document.createElement('div');
    colorScale.style.display = 'flex';
    colorScale.style.alignItems = 'center';
    colorScale.style.gap = '8px';
    
    // Create colorblind-friendly gradient bar
    const gradientBar = document.createElement('div');
    gradientBar.style.width = '100px';
    gradientBar.style.height = '12px';
    gradientBar.style.background = 'linear-gradient(to right, #56B4E9, #F0E442, #E69F00, #CC79A7)';
    gradientBar.style.border = '1px solid #ddd';
    gradientBar.style.borderRadius = '2px';
    colorScale.appendChild(gradientBar);
    
    const lowLabel = document.createElement('span');
    lowLabel.textContent = 'Low';
    lowLabel.style.fontSize = '10px';
    colorScale.appendChild(lowLabel);
    
    const highLabel = document.createElement('span');
    highLabel.textContent = 'High';
    highLabel.style.fontSize = '10px';
    colorScale.appendChild(highLabel);
    
    colorLegend.appendChild(colorScale);
    container.appendChild(colorLegend);

    // Circle size legend
    const sizeLegend = document.createElement('div');
    
    const sizeTitle = document.createElement('div');
    sizeTitle.style.fontWeight = '500';
    sizeTitle.style.marginBottom = '4px';
    const fieldLabel = selectedSizeField === 'syn_subs' ? 'Synonymous substitutions' :
                      selectedSizeField === 'nonsyn_subs' ? 'Non-synonymous substitutions' :
                      'Total substitutions';
    sizeTitle.textContent = `${fieldLabel} (circle size)`;
    sizeLegend.appendChild(sizeTitle);
    
    const sizeScale = document.createElement('div');
    sizeScale.style.display = 'flex';
    sizeScale.style.alignItems = 'center';
    sizeScale.style.gap = '12px';
    
    // Small circle
    const smallCircleContainer = document.createElement('div');
    smallCircleContainer.style.display = 'flex';
    smallCircleContainer.style.alignItems = 'center';
    smallCircleContainer.style.gap = '4px';
    
    const smallSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    smallSvg.setAttribute('width', '16');
    smallSvg.setAttribute('height', '16');
    const smallCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    smallCircle.setAttribute('cx', '8');
    smallCircle.setAttribute('cy', '8');
    smallCircle.setAttribute('r', '2');
    smallCircle.setAttribute('fill', '#333');
    smallCircle.setAttribute('opacity', '0.7');
    smallSvg.appendChild(smallCircle);
    smallCircleContainer.appendChild(smallSvg);
    
    const smallLabel = document.createElement('span');
    smallLabel.textContent = 'Few';
    smallLabel.style.fontSize = '10px';
    smallCircleContainer.appendChild(smallLabel);
    
    // Large circle
    const largeCircleContainer = document.createElement('div');
    largeCircleContainer.style.display = 'flex';
    largeCircleContainer.style.alignItems = 'center';
    largeCircleContainer.style.gap = '4px';
    
    const largeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    largeSvg.setAttribute('width', '16');
    largeSvg.setAttribute('height', '16');
    const largeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    largeCircle.setAttribute('cx', '8');
    largeCircle.setAttribute('cy', '8');
    largeCircle.setAttribute('r', '6');
    largeCircle.setAttribute('fill', '#333');
    largeCircle.setAttribute('opacity', '0.7');
    largeSvg.appendChild(largeCircle);
    largeCircleContainer.appendChild(largeSvg);
    
    const largeLabel = document.createElement('span');
    largeLabel.textContent = 'Many';
    largeLabel.style.fontSize = '10px';
    largeCircleContainer.appendChild(largeLabel);
    
    sizeScale.appendChild(smallCircleContainer);
    sizeScale.appendChild(largeCircleContainer);
    sizeLegend.appendChild(sizeScale);
    container.appendChild(sizeLegend);
    
    return container;
  }

  // Generate mock profile data when real data is not available
  function generateMockProfileData(data: any, branchNames: string[]): any[] {
    const numSites = data.sites || data.input?.["number of sites"] || 5;
    const mockData: any[] = [];
    
    branchNames.forEach(branch => {
      for (let site = 1; site <= numSites; site++) {
        mockData.push({
          Key: `${branch}|${site}`,
          branch: branch,
          site: site,
          ER: 1 + Math.random() * 50, // Evidence ratio between 1-50
          subs: Math.floor(Math.random() * 5) + 1, // 1-5 substitutions
          from: ['ATG', 'GAA', 'TTC', 'AAA', 'GGG'][Math.floor(Math.random() * 5)],
          to: ['CTG', 'GAG', 'TTT', 'AAG', 'AGG'][Math.floor(Math.random() * 5)],
          syn_subs: Math.floor(Math.random() * 3),
          nonsyn_subs: Math.floor(Math.random() * 3) + 1
        });
      }
    });
    
    return mockData;
  }

  // Generate mock synonymous rate data since it's complex to extract
  function generateSynonymousRateData(data: any, startSite: number, sitesToShow: number): any[] {
    const endSite = startSite + sitesToShow - 1;
    const srvData = [];
    
    for (let site = startSite; site <= endSite; site++) {
      srvData.push({
        site,
        'SRV posterior mean': Math.random() * 1.2 + 0.1, // Mock data
        Codon: site
      });
    }
    
    return srvData;
  }

  // Create scrollable positive selection heatmap
  function createScrollablePositiveSelectionHeatmap(
    branchSiteData: any[],
    startSite: number,
    sitesToShow: number,
    branchOrder: string[],
    sizeField: string
  ): HTMLDivElement {
    // Similar implementation to evidence ratio but with EBF coloring
    return createScrollableEvidenceRatioHeatmap(branchSiteData, startSite, sitesToShow, branchOrder, sizeField, 1, 'positive-selection');
  }

  // Create scrollable synonymous rates plot
  function createScrollableSynonymousRatesPlot(
    siteData: any[],
    startSite: number,
    sitesToShow: number
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.overflowX = 'auto';
    container.style.border = '1px solid #ddd';
    container.style.background = '#fafafa';
    
    const cellWidth = 16;
    const plotWidth = Math.max(800, sitesToShow * cellWidth);
    const plotHeight = 300;
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', (plotWidth + margin.left + margin.right).toString());
    svg.setAttribute('height', (plotHeight + margin.top + margin.bottom).toString());
    svg.style.background = 'white';
    svg.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

    // Scales
    const xScale = (site: number) => margin.left + (site - startSite) * cellWidth + cellWidth/2;
    const maxRate = Math.max(...siteData.map(d => d['SRV posterior mean']), 1.4);
    const minRate = Math.min(...siteData.map(d => d['SRV posterior mean']), 0);
    const yScale = (rate: number) => plotHeight + margin.top - ((rate - minRate) / (maxRate - minRate)) * plotHeight;

    // Add Y axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left.toString());
    yAxis.setAttribute('y1', margin.top.toString());
    yAxis.setAttribute('x2', margin.left.toString());
    yAxis.setAttribute('y2', (margin.top + plotHeight).toString());
    yAxis.setAttribute('stroke', '#333');
    yAxis.setAttribute('stroke-width', '1');
    svg.appendChild(yAxis);

    // Add Y axis label
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', '20');
    yLabel.setAttribute('y', (margin.top + plotHeight/2).toString());
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('transform', `rotate(-90 20 ${margin.top + plotHeight/2})`);
    yLabel.setAttribute('font-size', '12');
    yLabel.setAttribute('fill', '#666');
    yLabel.textContent = 'SRV posterior mean';
    svg.appendChild(yLabel);

    // Add Y axis ticks and labels
    const tickValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4];
    tickValues.forEach(value => {
      if (value >= minRate && value <= maxRate) {
        const y = yScale(value);
        
        // Tick mark
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', (margin.left - 5).toString());
        tick.setAttribute('y1', y.toString());
        tick.setAttribute('x2', margin.left.toString());
        tick.setAttribute('y2', y.toString());
        tick.setAttribute('stroke', '#333');
        tick.setAttribute('stroke-width', '1');
        svg.appendChild(tick);
        
        // Tick label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', (margin.left - 8).toString());
        label.setAttribute('y', (y + 3).toString());
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#666');
        label.textContent = value.toFixed(1);
        svg.appendChild(label);
      }
    });

    // Add X axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left.toString());
    xAxis.setAttribute('y1', (margin.top + plotHeight).toString());
    xAxis.setAttribute('x2', (plotWidth + margin.left).toString());
    xAxis.setAttribute('y2', (margin.top + plotHeight).toString());
    xAxis.setAttribute('stroke', '#333');
    xAxis.setAttribute('stroke-width', '1');
    svg.appendChild(xAxis);

    // Add X axis label
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', (margin.left + plotWidth/2).toString());
    xLabel.setAttribute('y', (margin.top + plotHeight + 35).toString());
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '12');
    xLabel.setAttribute('fill', '#666');
    xLabel.textContent = 'Codon';
    svg.appendChild(xLabel);

    // Add X axis ticks (every 10 sites)
    for (let site = startSite; site <= startSite + sitesToShow; site += 10) {
      const x = xScale(site);
      
      // Tick mark
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', x.toString());
      tick.setAttribute('y1', (margin.top + plotHeight).toString());
      tick.setAttribute('x2', x.toString());
      tick.setAttribute('y2', (margin.top + plotHeight + 5).toString());
      tick.setAttribute('stroke', '#333');
      tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);
      
      // Tick label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x.toString());
      label.setAttribute('y', (margin.top + plotHeight + 18).toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#666');
      label.textContent = site.toString();
      svg.appendChild(label);
    }

    // Add data points (gray circles like in the image)
    siteData.forEach(d => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', xScale(d.site).toString());
      circle.setAttribute('cy', yScale(d['SRV posterior mean']).toString());
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', '#999');
      circle.setAttribute('stroke', 'none');
      circle.setAttribute('opacity', '0.8');
      
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Codon ${d.site}: ${d['SRV posterior mean'].toFixed(3)}`;
      circle.appendChild(title);
      
      svg.appendChild(circle);
    });

    container.appendChild(svg);
    return container;
  }
  

  function handleRateTableSort(column: string) {
    if (rateTableSortColumn === column) {
      rateTableSortDirection = rateTableSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      rateTableSortColumn = column;
      rateTableSortDirection = 'asc';
    }
  }

  function handleBranchSelection(branchName: string) {
    if (selectedBranches.includes(branchName)) {
      selectedBranches = selectedBranches.filter(b => b !== branchName);
    } else {
      selectedBranches = [...selectedBranches, branchName];
    }
  }

  function handleRateTableRowClick(row: any) {
    // Select the branch for omega distribution display
    selectedBranchForOmega = row.branch;
    
    // Also toggle it in selected branches for plots
    handleBranchSelection(row.branch);
  }

</script>

<div class="absrel-visualization">
  {#if !data}
    <div class="loading">
      Loading ABSREL data...
    </div>
  {:else}
    <!-- Analysis Summary -->
    <div class="analysis-info">
      <h2>aBSREL Analysis Results</h2>
      <p>
        <strong>Adaptive Branch-Site Random Effects Likelihood</strong> test for 
        episodic positive selection. This analysis tests whether branches have 
        experienced episodic positive selection without requiring a priori 
        specification of lineages.
      </p>
    </div>

    <!-- Summary Tiles -->
    {#if summary}
      <div class="summary-tiles">
        <div class="tile">
          <div class="tile-number">{summary.sequences}</div>
          <div class="tile-description">Sequences</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.sites}</div>
          <div class="tile-description">Sites</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.branchesTested}</div>
          <div class="tile-description">Branches Tested</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.branchesWithSelection}</div>
          <div class="tile-description">Branches with Selection</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.lrt.toFixed(2)}</div>
          <div class="tile-description">Likelihood Ratio Test</div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="pvalue-threshold">p-value threshold:</label>
        <input 
          type="number" 
          id="pvalue-threshold"
          bind:value={pValueThreshold} 
          min="0.001" 
          max="0.1" 
          step="0.001"
        />
      </div>

      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            bind:checked={showOnlySignificant}
          />
          Show only significant branches
        </label>
      </div>

      <div class="control-group">
        <label for="evidence-threshold">Evidence ratio threshold:</label>
        <input 
          type="number" 
          id="evidence-threshold"
          bind:value={evidenceThreshold} 
          min="1" 
          max="1000" 
          step="1"
        />
      </div>
    </div>


    <!-- Site Analysis -->
    {#if data && distributionTable.length > 0}
      <div class="plot-section">
        <h3>Site Analysis</h3>
        <p class="plot-description">
          {#if selectedPlotType === 'synonymous-rates'}
            Synonymous rate variation (SRV) posterior mean values across alignment sites. Each dot represents 
            the posterior mean rate for synonymous substitutions at that codon position.
          {:else}
            Evidence for positive selection (ω > 1) across alignment sites. Each cell represents the evidence ratio 
            for a branch-site combination, with darker cells indicating stronger evidence. Sites without evidence 
            are not shown. Navigate through the alignment using the arrow buttons to explore different regions.
          {/if}
        </p>
        
        <div class="minimal-controls">
          <div class="control-row">
            <div class="control-group">
              <label for="plot-type">Plot type:</label>
              <select id="plot-type" bind:value={selectedPlotType}>
                <option value="evidence-ratio">Evidence ratio</option>
                <option value="positive-selection">Positive selection</option>
                <option value="synonymous-rates">Synonymous rates</option>
              </select>
            </div>
            
            {#if selectedPlotType !== 'synonymous-rates'}
              <div class="control-group">
                <label for="size-field">Circle size:</label>
                <select id="size-field" bind:value={selectedSizeField}>
                  <option value="subs">Total substitutions</option>
                  <option value="syn_subs">Synonymous substitutions</option>
                  <option value="nonsyn_subs">Non-synonymous substitutions</option>
                </select>
              </div>
            {/if}
          </div>
          
          <div class="site-nav">
            <span class="sites-label">Sites {startSite}–{startSite + sitesToShow - 1}</span>
            <div class="nav-buttons">
              <button 
                type="button" 
                on:click={() => startSite = Math.max(1, startSite - sitesToShow)}
                disabled={startSite <= 1}
                class="nav-button"
                aria-label="Previous sites"
              >
                ←
              </button>
              <button 
                type="button" 
                on:click={() => startSite = Math.min((summary?.sites || 100) - sitesToShow + 1, startSite + sitesToShow)}
                disabled={startSite + sitesToShow > (summary?.sites || 100)}
                class="nav-button"
                aria-label="Next sites"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div class="clean-heatmap" bind:this={heatmapContainer}></div>
      </div>
    {/if}

    <!-- Phylogenetic Tree Visualization -->
    {#if showTree && data?.input?.trees}
      <div class="plot-section">
        <h3>Phylogenetic Tree</h3>
        <p class="plot-description">
          Phylogenetic tree showing evidence for positive selection. Branch colors and thicknesses 
          indicate selection pressure, with red indicating positive selection (ω &gt; 1) and blue 
          indicating purifying selection (ω &lt; 1).
        </p>
        
        <div class="tree-controls">
          <div class="control-row">
            <div class="control-group">
              <label for="color-branches">Color branches:</label>
              <select id="color-branches" bind:value={colorBranches}>
                <option value="Tested">Tested branches</option>
                <option value="Support for selection">Support for selection</option>
              </select>
            </div>
            
            <div class="control-group">
              <label for="branch-length">Branch length:</label>
              <select id="branch-length" bind:value={branchLength}>
                <option value="Baseline MG94xREV">Baseline MG94xREV</option>
                <option value="original name">Original length</option>
              </select>
            </div>
            
            <div class="control-group">
              <label for="tree-width">Width:</label>
              <input type="number" id="tree-width" bind:value={treeWidth} min="400" max="1200" step="50" />
            </div>
            
            <div class="control-group">
              <label for="tree-height">Height:</label>
              <input type="number" id="tree-height" bind:value={treeHeight} min="300" max="1000" step="50" />
            </div>
          </div>
          
          <div class="control-row">
            <div class="control-group">
              <label>
                <input type="checkbox" bind:checked={showScale} />
                Show scale
              </label>
            </div>
            
            <div class="control-group">
              <label>
                <input type="checkbox" bind:checked={alignTips} />
                Align tips
              </label>
            </div>
            
            <div class="control-group">
              <label>
                <input type="checkbox" bind:checked={showInternal} />
                Show internal nodes
              </label>
            </div>
          </div>
        </div>

        <div class="tree-container" bind:this={treeContainer}></div>
        
        {#if colorBranches === 'Support for selection'}
          <div class="tree-legend">
            <div class="legend-title">ω (dN/dS ratio)</div>
            <div class="omega-scale">
              <div class="scale-bar"></div>
              <div class="scale-labels">
                <span>0.0001</span>
                <span>0.001</span>
                <span>0.01</span>
                <span>0.1</span>
                <span>1</span>
                <span>10</span>
                <span>100</span>
                <span>1000</span>
              </div>
            </div>
            <div class="legend-description">
              <strong>Color:</strong> Blue: Purifying selection (ω &lt; 1) | White: Neutral (ω = 1) | Red: Positive selection (ω &gt; 1)<br>
              <strong>Thickness:</strong> Thicker branches = more significant p-values (*** p≤0.001, ** p≤0.01, * p≤0.05)
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Branch-by-branch Rate Table -->
    {#if distributionTable.length > 0}
      <div class="rate-table-section">
        <h3>Branch-by-branch Rate Results</h3>
        <p class="table-description">
          Interactive table with branch rate distributions and test statistics. Click rows to select/compare branches.
        </p>
        
        <div class="rate-table-container">
          <table class="rate-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th 
                  class="sortable" 
                  class:sorted={rateTableSortColumn === 'branch'}
                  style="padding: 8px; text-align: left; border: 1px solid #ddd; cursor: pointer; user-select: none;"
                  on:click={() => handleRateTableSort('branch')}
                >
                  <div class="header-content">
                    <span>Branch</span>
                    <span class="sort-indicator">
                      {#if rateTableSortColumn === 'branch'}
                        {rateTableSortDirection === 'asc' ? '↑' : '↓'}
                      {:else}
                        ↕
                      {/if}
                    </span>
                  </div>
                </th>
                <th 
                  class="sortable" 
                  class:sorted={rateTableSortColumn === 'tested'}
                  style="padding: 8px; text-align: left; border: 1px solid #ddd; cursor: pointer; user-select: none;"
                  on:click={() => handleRateTableSort('tested')}
                >
                  <div class="header-content">
                    <span>Tested</span>
                    <span class="sort-indicator">
                      {#if rateTableSortColumn === 'tested'}
                        {rateTableSortDirection === 'asc' ? '↑' : '↓'}
                      {:else}
                        ↕
                      {/if}
                    </span>
                  </div>
                </th>
                <th 
                  class="sortable" 
                  class:sorted={rateTableSortColumn === 'p-value'}
                  style="padding: 8px; text-align: left; border: 1px solid #ddd; cursor: pointer; user-select: none;"
                  on:click={() => handleRateTableSort('p-value')}
                >
                  <div class="header-content">
                    <span>p-value</span>
                    <span class="sort-indicator">
                      {#if rateTableSortColumn === 'p-value'}
                        {rateTableSortDirection === 'asc' ? '↑' : '↓'}
                      {:else}
                        ↕
                      {/if}
                    </span>
                  </div>
                </th>
                <th 
                  class="sortable" 
                  class:sorted={rateTableSortColumn === 'sites'}
                  style="padding: 8px; text-align: left; border: 1px solid #ddd; cursor: pointer; user-select: none;"
                  on:click={() => handleRateTableSort('sites')}
                >
                  <div class="header-content">
                    <span>Sites</span>
                    <span class="sort-indicator">
                      {#if rateTableSortColumn === 'sites'}
                        {rateTableSortDirection === 'asc' ? '↑' : '↓'}
                      {:else}
                        ↕
                      {/if}
                    </span>
                  </div>
                </th>
                <th 
                  class="sortable" 
                  class:sorted={rateTableSortColumn === 'rates'}
                  style="padding: 8px; text-align: left; border: 1px solid #ddd; cursor: pointer; user-select: none;"
                  on:click={() => handleRateTableSort('rates')}
                >
                  <div class="header-content">
                    <span>Rate Classes</span>
                    <span class="sort-indicator">
                      {#if rateTableSortColumn === 'rates'}
                        {rateTableSortDirection === 'asc' ? '↑' : '↓'}
                      {:else}
                        ↕
                      {/if}
                    </span>
                  </div>
                </th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">ω distribution</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">ω plot</th>
              </tr>
            </thead>
            <tbody>
              {#each sortedDistributionTable as row, index}
                <tr 
                  style="background-color: {index % 2 === 0 ? '#ffffff' : '#f9f9f9'}; cursor: pointer;"
                  on:click={() => handleRateTableRowClick(row)}
                >
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    {#if row['p-value'] !== null && row['p-value'] <= 0.05}
                      <strong>{row.branch}</strong>
                    {:else}
                      {row.branch}
                    {/if}
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd;">{row.tested}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    {#if row['p-value'] !== null}
                      {row['p-value'] < 0.001 ? row['p-value'].toExponential(2) : row['p-value'].toFixed(4)}
                    {:else}
                      N/A
                    {/if}
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    {row.sites !== null ? row.sites : 'N/A'}
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd;">{row.rates}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">
                    {#if row.dist[1].length > 0}
                      <div style="font-size: 0.9em;">
                        {#each row.dist[1] as rate, i}
                          {floatFormat(rate.value)} ({proportionFormat(rate.weight)})
                          {#if i < row.dist[1].length - 1}<br/>{/if}
                        {/each}
                        <br/>
                        <strong>Mean = {floatFormat(distMean(row.dist[1]))}</strong>
                        <br/>
                        <strong>CoV = {floatFormat(Math.sqrt(distVar(row.dist[1]))/distMean(row.dist[1]))}</strong>
                      </div>
                    {:else}
                      N/A
                    {/if}
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                    {#if row.dist[1].length > 1}
                      {@html (() => {
                        const plotDiv = createMiniOmegaPlot(row.dist[1]);
                        return plotDiv.innerHTML;
                      })()}
                    {:else}
                      <span style="color: #666; font-size: 0.9em;">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Site-by-site Results Table -->
    {#if siteTableData[0].length > 0}
      <div class="rate-table-section">
        <h3>Table 2. Detailed site-by-site results</h3>
        <p class="table-description">
          Detailed site-by-site results from the aBSREL analysis showing codon positions, 
          log-likelihood values, synonymous rate variation, substitutions, and evidence ratio counts.
        </p>
        
        <div class="scrollable-table-container">
          <table class="data-table">
            <thead>
              <tr>
                {#each Object.entries(siteTableData[1]) as [key, label]}
                  <th>{label}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each siteTableData[0].slice(0, 10) as row, index}
                <tr class:even-row={index % 2 === 0}>
                  {#each Object.keys(siteTableData[1]) as key}
                    <td>
                      {#if typeof row[key] === 'number'}
                        {row[key] < 0.01 && row[key] > 0 ? row[key].toExponential(2) : 
                         row[key] % 1 !== 0 ? row[key].toFixed(3) : row[key]}
                      {:else}
                        {row[key]}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
          {#if siteTableData[0].length > 10}
            <div class="table-footer">
              Showing 10 of {siteTableData[0].length} sites
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Branch-specific Site Results Table -->
    {#if selectedBranchForOmega && branchSiteTableData.length > 0}
      <div class="rate-table-section">
        <h3>Table 3. Detailed site-by-site results for {selectedBranchForOmega}</h3>
        <p class="table-description">
          Detailed site-by-site results for a specific branch in the aBSREL analysis showing
          evidence for positive selection at individual sites.
        </p>
        
        <div class="scrollable-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Site</th>
                <th>Parent</th>
                <th>Codon</th>
                <th># substitutions</th>
                <th>Evidence ratio</th>
                <th>Empirical BF</th>
              </tr>
            </thead>
            <tbody>
              {#each branchSiteTableData.slice(0, 10) as row, index}
                <tr class:even-row={index % 2 === 0}>
                  <td>{row.branch}</td>
                  <td>{row.site}</td>
                  <td>{row.from || 'N/A'}</td>
                  <td>{row.to || 'N/A'}</td>
                  <td>{row.subs}</td>
                  <td>{row.ER.toFixed(2)}</td>
                  <td>{row.ER.toFixed(2)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if branchSiteTableData.length > 10}
            <div class="table-footer">
              Showing 10 of {branchSiteTableData.length} sites with ER ≥ {evidenceThreshold}
            </div>
          {/if}
        </div>
      </div>
    {:else if selectedBranchForOmega}
      <div class="rate-table-section">
        <h3>Table 3. Detailed site-by-site results for {selectedBranchForOmega}</h3>
        <p class="table-description">
          No sites with evidence ratio ≥ {evidenceThreshold} found for this branch.
        </p>
      </div>
    {/if}

    <!-- Bayes Factor Plot -->
    <div class="plot-section">
      <h3>Bayes Factor Evidence</h3>
      <p class="plot-description">
        Bayes Factor evidence for positive selection on each branch. 
        Higher values indicate stronger evidence.
      </p>
      <div class="plot-container" bind:this={bayesFactorPlotContainer}></div>
    </div>

    <!-- Site Log Likelihood Plot -->
    {#if selectedBranches.length > 0}
      <div class="plot-section">
        <h3>Site-Level Log Likelihood</h3>
        <p class="plot-description">
          Log likelihood values across sites for selected branches.
        </p>
        <div class="plot-container" bind:this={siteLogLikePlotContainer}></div>
      </div>
    {/if}

    <!-- Citation -->
    <div class="citation">
      <h3>Citation</h3>
      <code>
        Smith MD, Wertheim JO, Weaver S, Murrell B, Scheffler K, Kosakovsky Pond SL. 
        Less is more: an adaptive branch-site random effects model for efficient 
        detection of episodic diversifying selection. Mol Biol Evol. 2015;32(5):1342-53.
      </code>
    </div>
  {/if}
</div>

<style>
  .absrel-visualization {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .summary-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .tile {
    background: #fff;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .rate-table-section {
    margin-bottom: 2rem;
  }

  .rate-table-container {
    overflow-x: auto;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .rate-table {
    font-size: 0.9em;
  }

  .rate-table th {
    font-weight: 600;
    background-color: #f5f5f5 !important;
  }

  .rate-table tr:hover {
    background-color: #f0f8ff !important;
  }

  .rate-table .sortable:hover {
    background-color: #e9ecef !important;
  }

  .rate-table .sortable.sorted {
    background-color: #dee2e6 !important;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-indicator {
    font-size: 0.8rem;
    color: #666;
    opacity: 0.7;
    min-width: 12px;
    text-align: center;
  }

  .sortable.sorted .sort-indicator {
    color: #333;
    opacity: 1;
  }

  .tile-number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .tile-description {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .analysis-info {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    border-left: 4px solid #e3243b;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-group label {
    font-weight: 500;
    color: #333;
  }

  .plot-section {
    margin-bottom: 2rem;
  }

  .plot-description, .table-description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1rem;
  }

  .plot-container {
    min-height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
  }

  .minimal-controls {
    margin-bottom: 1.5rem;
  }

  .site-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 200px;
  }

  .sites-label {
    font-size: 0.9rem;
    color: #666;
  }

  .nav-buttons {
    display: flex;
    gap: 4px;
  }

  .nav-button {
    width: 24px;
    height: 24px;
    border: none;
    background: #f5f5f5;
    color: #666;
    cursor: pointer;
    border-radius: 2px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }

  .nav-button:hover:not(:disabled) {
    background: #e5e5e5;
  }

  .nav-button:disabled {
    background: #fafafa;
    color: #ccc;
    cursor: default;
  }

  .clean-heatmap {
    border-radius: 2px;
    overflow-x: auto;
  }

  .citation {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;
  }

  .citation code {
    background: #f4f4f4;
    padding: 1rem;
    border-radius: 4px;
    display: block;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  h2, h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  input[type="number"], select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .control-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .control-row .control-group {
    margin: 0;
  }

  .scrollable-table-container {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 1rem;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .data-table th {
    background-color: #f5f5f5;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 2px solid #ddd;
    font-weight: 600;
    white-space: nowrap;
  }

  .data-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #eee;
  }

  .data-table tr.even-row {
    background-color: #f9f9f9;
  }

  .data-table tbody tr:hover {
    background-color: #f0f0f0;
  }

  .table-footer {
    padding: 0.5rem;
    text-align: center;
    font-size: 0.85rem;
    color: #666;
    background-color: #f5f5f5;
    border-top: 1px solid #ddd;
  }

  .tree-controls {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .tree-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    overflow: auto;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .tree-legend {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 0.9rem;
  }

  .legend-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .omega-scale {
    margin-bottom: 0.5rem;
  }

  .scale-bar {
    height: 20px;
    background: linear-gradient(to right, 
      #0571b0 0%, 
      #2166ac 12.5%, 
      #4393c3 25%, 
      #92c5de 37.5%, 
      #f7f7f7 50%, 
      #fddbc7 62.5%, 
      #f4a582 75%, 
      #d6604d 87.5%, 
      #ca0020 100%);
    border-radius: 4px;
    border: 1px solid #ccc;
    margin-bottom: 0.25rem;
  }

  .scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #666;
  }

  .legend-description {
    font-size: 0.8rem;
    color: #666;
    font-style: italic;
  }

  input[type="number"] {
    width: 80px;
  }

  /* Phylotree specific styles */
  :global(.phylotree-container) {
    font-family: ui-monospace, 'Courier New', monospace;
  }

  :global(.node) {
    fill: #333;
    stroke: #333;
  }

  :global(.branch) {
    fill: none;
    stroke: #333;
    stroke-width: 1px;
  }

  :global(.internal-node) {
    fill: #666;
    stroke: #666;
  }

  :global(.tree-scale-bar) {
    stroke: #666;
    stroke-width: 1px;
  }

  :global(.tree-scale-label) {
    font-size: 10px;
    fill: #666;
  }

</style>
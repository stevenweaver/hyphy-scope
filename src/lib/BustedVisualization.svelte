<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css"
  />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";
  import * as d3 from 'd3';
  import { phylotree } from 'phylotree';

  export let data: any;

  // Reactive data processing - using same pattern as working components
  $: summary = data ? getBustedSummary(data) : null;
  $: siteData = data ? getBustedSiteData(data) : [];
  $: distributionData = data ? getDistributionData(data) : null;
  $: alignmentWideResults = data ? getAlignmentWideResults(data) : null;

  // Interfaces
  interface BustedSiteData {
    site: number;
    partition: number;
    'Evidence Ratio': number;
    'Synonymous Rate': number;
    'Selection': string;
  }

  interface BustedSummary {
    sequences: number;
    sites: number;
    partitions: number;
    branchesTestedCount: number;
    rateClasses: number;
    synonymousRateVariation: string;
    pValue: number;
    sitesWithHighER: number;
    multipleTestingCorrection: string;
    hasSelection: boolean;
  }


  // Controls
  let evidenceThreshold = 100;
  let showOnlySignificant = false;
  let selectedVisualization = 'evidence';

  // Tree controls
  let showTree = true;
  let colorBranches = 'Tested';
  let treeWidth = 800;
  let treeHeight = 600;
  let showScale = true;
  let alignTips = false;
  let showInternal = false;

  // Sorting and pagination
  let sortColumn = 'Evidence Ratio';
  let sortDirection: 'asc' | 'desc' = 'desc';
  let currentPage = 1;
  let itemsPerPage = 50;

  // Filtered and sorted data
  $: filteredData = showOnlySignificant 
    ? siteData.filter(site => site['Evidence Ratio'] >= evidenceThreshold)
    : siteData;

  $: sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortColumn as keyof BustedSiteData];
    const bVal = b[sortColumn as keyof BustedSiteData];
    
    const comparison = typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal));
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  $: totalPages = Math.ceil(sortedData.length / itemsPerPage);
  $: paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Plot containers
  let evidenceRatioContainer: HTMLDivElement;
  let synonymousRateContainer: HTMLDivElement;
  let distributionContainer: HTMLDivElement;
  let alignmentWideContainer: HTMLDivElement;
  let discretePlotContainers: { [key: string]: HTMLDivElement } = {};
  let treeContainer: HTMLDivElement;

  // Utility Functions
  function getBustedSummary(data: any): BustedSummary {
    const testResults = data['test results'];
    const fits = data.fits;
    const input = data.input;
    const analysis = data.analysis;
    
    // Count rate classes from model fits
    const constrainedModel = fits?.['Constrained model'] || fits?.[Object.keys(fits || {})[0]];
    const rateDistribution = constrainedModel?.['rate-distributions'];
    const omegaRates = rateDistribution?.['Test omega']?.['rate-distribution'];
    const rateClassCount = omegaRates ? omegaRates.length : 3;
    
    // Check for synonymous rate variation
    const hasSRV = analysis?.settings?.srv === 'Yes' || 
                  rateDistribution?.['Synonymous site-to-site rates'] !== undefined;
    
    // Count sites with Evidence Ratio >= 10
    const evidenceRatios = data['Evidence Ratios'];
    let sitesWithHighER = 0;
    if (evidenceRatios) {
      let erArray = null;
      if (evidenceRatios['constrained'] && Array.isArray(evidenceRatios['constrained'][0])) {
        erArray = evidenceRatios['constrained'][0];
      } else if (evidenceRatios['optimized null'] && Array.isArray(evidenceRatios['optimized null'][0])) {
        erArray = evidenceRatios['optimized null'][0];
      }
      if (erArray) {
        sitesWithHighER = erArray.filter((ratio: number) => ratio >= 10).length;
      }
    }
    
    return {
      sequences: input?.['number of sequences'] || input?.sequences || 0,
      sites: input?.['number of sites'] || input?.sites || 0,
      partitions: input?.['partition count'] || 1,
      branchesTestedCount: data.tested ? Object.keys(data.tested).length : 0,
      rateClasses: rateClassCount,
      synonymousRateVariation: hasSRV ? 'Yes' : 'None',
      pValue: testResults?.['p-value'] || 1,
      sitesWithHighER: sitesWithHighER,
      multipleTestingCorrection: 'N/A:N/A',
      hasSelection: (testResults?.['p-value'] || 1) <= 0.05
    };
  }

  function getBustedSiteData(data: any): BustedSiteData[] {
    const evidenceRatios = data['Evidence Ratios'];
    const synonymousRates = data['Synonymous site-posteriors'];

    // Evidence Ratios structure: { 'constrained': [[er1, er2, ...]], 'optimized null': [[...]] }
    // Get the constrained evidence ratios array
    let erArray = null;
    if (evidenceRatios) {
      if (evidenceRatios['constrained'] && Array.isArray(evidenceRatios['constrained'][0])) {
        erArray = evidenceRatios['constrained'][0];
      } else if (evidenceRatios['optimized null'] && Array.isArray(evidenceRatios['optimized null'][0])) {
        erArray = evidenceRatios['optimized null'][0];
      }
    }

    // Determine number of sites
    const numSites = erArray ? erArray.length : (data.input?.['number of sites'] || data.input?.sites || 0);

    if (numSites === 0) return [];

    return Array.from({length: numSites}, (_, i) => {
      const site = i + 1;
      const evidence = erArray ? (erArray[i] || 0) : 0;

      // Handle synonymous rates as 2D array
      let synRate = 0;
      if (synonymousRates && Array.isArray(synonymousRates) && synonymousRates.length > 0) {
        // Average across rate categories for this site
        synRate = synonymousRates.reduce((sum, rateCategory) => {
          const siteRate = Array.isArray(rateCategory) ? (rateCategory[i] || 0) : 0;
          return sum + siteRate;
        }, 0) / synonymousRates.length;
      }

      return {
        site,
        partition: 1,
        'Evidence Ratio': evidence,
        'Synonymous Rate': synRate,
        'Selection': getSelectionCategory(evidence)
      };
    });
  }

  function getDistributionData(data: any) {
    const fits = data.fits;
    if (!fits) return null;

    // Handle different model naming conventions
    const baseline = fits['Baseline MG94xREV'] || 
                    fits['MG94xREV with separate rates for branch sets'] ||
                    fits['Nucleotide GTR'];
    const alternative = fits['Alternative model'] || 
                       fits['Unconstrained model'];

    return {
      baseline: {
        logL: baseline?.['log-likelihood'] || 0,
        parameters: baseline?.parameters || 0,
        AIC: baseline?.AIC || 0
      },
      alternative: {
        logL: alternative?.['log-likelihood'] || 0,
        parameters: alternative?.parameters || 0,
        AIC: alternative?.AIC || 0
      },
      lrt: 2 * ((alternative?.['log-likelihood'] || 0) - (baseline?.['log-likelihood'] || 0))
    };
  }

  function getAlignmentWideResults(data: any) {
    const fits = data.fits;
    if (!fits) return null;

    // Extract model information
    const unconstrained = fits['Unconstrained model'];
    const constrained = fits['Constrained model'];

    if (!unconstrained || !constrained) {
      return null;
    }

    // Extract rate distributions - convert object to array
    const unconstrainedTestRates = unconstrained['Rate Distributions']?.['Test'];
    const constrainedTestRates = constrained['Rate Distributions']?.['Test'];
    
    const unconstrainedRates = unconstrainedTestRates ? Object.values(unconstrainedTestRates) : [];
    const constrainedRates = constrainedTestRates ? Object.values(constrainedTestRates) : [];

    const result = {
      models: [
        {
          name: 'Unconstrained model',
          logL: unconstrained['Log Likelihood'] || 0,
          aicC: unconstrained['AIC-c'] || 0,
          parameters: unconstrained['estimated parameters'] || 0,
          rateDistribution: unconstrainedRates,
          mean: calculateMean(unconstrainedRates),
          cov: calculateCoV(unconstrainedRates)
        },
        {
          name: 'Constrained model', 
          logL: constrained['Log Likelihood'] || 0,
          aicC: constrained['AIC-c'] || 0,
          parameters: constrained['estimated parameters'] || 0,
          rateDistribution: constrainedRates,
          mean: calculateMean(constrainedRates),
          cov: calculateCoV(constrainedRates)
        }
      ]
    };

    return result;
  }

  function calculateMean(rateDistribution: any[]) {
    if (!rateDistribution || rateDistribution.length === 0) return 0;
    
    let totalRate = 0;
    let totalProportion = 0;
    
    rateDistribution.forEach(rate => {
      const omega = rate.omega || rate[0] || 0;
      const proportion = rate.proportion || rate[1] || 0;
      totalRate += omega * proportion;
      totalProportion += proportion;
    });
    
    return totalProportion > 0 ? totalRate / totalProportion : 0;
  }

  function calculateCoV(rateDistribution: any[]) {
    if (!rateDistribution || rateDistribution.length === 0) return 0;
    
    const mean = calculateMean(rateDistribution);
    let variance = 0;
    let totalProportion = 0;
    
    rateDistribution.forEach(rate => {
      const omega = rate.omega || rate[0] || 0;
      const proportion = rate.proportion || rate[1] || 0;
      variance += proportion * Math.pow(omega - mean, 2);
      totalProportion += proportion;
    });
    
    if (totalProportion > 0 && mean > 0) {
      variance /= totalProportion;
      return Math.sqrt(variance) / mean * 100; // CoV as percentage
    }
    
    return 0;
  }

  function getSelectionCategory(evidenceRatio: number): string {
    if (evidenceRatio >= 100) return 'Strong Positive';
    if (evidenceRatio >= 10) return 'Moderate Positive';
    if (evidenceRatio >= 3) return 'Weak Positive';
    return 'Neutral/Purifying';
  }

  function getSelectionColor(selection: string): string {
    switch (selection) {
      case 'Strong Positive': return '#e3243b';
      case 'Moderate Positive': return '#ff6b35';
      case 'Weak Positive': return '#ffa500';
      default: return '#666';
    }
  }

  // Plotting Functions
  function createEvidenceRatioPlot(data: BustedSiteData[]): any {
    if (!data.length) return null;

    const cappedData = data.map(d => ({
      ...d,
      cappedRatio: Math.min(d['Evidence Ratio'], 1000)
    }));

    return Plot.plot({
      title: "Evidence Ratios for Positive Selection",
      subtitle: "Sites with higher ratios show stronger evidence for selection",
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "Evidence Ratio (capped at 1000)",
        grid: true
      },
      color: {
        type: "ordinal",
        domain: ["Strong Positive", "Moderate Positive", "Weak Positive", "Neutral/Purifying"],
        range: ["#e3243b", "#ff6b35", "#ffa500", "#666"]
      },
      marks: [
        // Threshold lines
        Plot.ruleY([100], { stroke: "#e3243b", strokeDasharray: "5,5" }),
        Plot.ruleY([10], { stroke: "#ff6b35", strokeDasharray: "3,3" }),
        Plot.ruleY([3], { stroke: "#ffa500", strokeDasharray: "2,2" }),
        
        // Points
        Plot.dot(cappedData, {
          x: "site",
          y: "cappedRatio",
          fill: "Selection",
          r: 3,
          title: d => `Site ${d.site}\nEvidence Ratio: ${d['Evidence Ratio'].toFixed(2)}\nCategory: ${d.Selection}`
        }),
        
        // Line
        Plot.line(cappedData, {
          x: "site",
          y: "cappedRatio",
          stroke: "#999",
          strokeWidth: 1
        })
      ]
    });
  }

  function createSynonymousRatePlot(data: BustedSiteData[]): any {
    if (!data.length) return null;

    return Plot.plot({
      title: "Synonymous Substitution Rates",
      subtitle: "Rate of synonymous substitutions across sites",
      width: 1000,
      height: 300,
      marginLeft: 60,
      x: {
        label: "Site",
        grid: true
      },
      y: {
        label: "Synonymous Rate",
        grid: true
      },
      marks: [
        Plot.line(data, {
          x: "site",
          y: "Synonymous Rate",
          stroke: "#1f77b4",
          strokeWidth: 2
        }),
        
        Plot.dot(data.filter((d, i) => i % 20 === 0), {
          x: "site",
          y: "Synonymous Rate",
          fill: "#1f77b4",
          r: 3,
          title: d => `Site ${d.site}\nSynonymous Rate: ${d['Synonymous Rate'].toFixed(4)}`
        })
      ]
    });
  }

  function createDistributionPlot(distData: any): any {
    if (!distData) return null;

    const plotData = [
      { model: "Baseline", logL: distData.baseline.logL, AIC: distData.baseline.AIC, parameters: distData.baseline.parameters },
      { model: "Alternative", logL: distData.alternative.logL, AIC: distData.alternative.AIC, parameters: distData.alternative.parameters }
    ];

    return Plot.plot({
      title: "Model Comparison",
      subtitle: `LRT = ${distData.lrt.toFixed(2)}`,
      width: 500,
      height: 300,
      marginLeft: 100,
      x: {
        type: "band",
        domain: ["Baseline", "Alternative"],
        label: "Model"
      },
      y: {
        label: "Log Likelihood",
        grid: true
      },
      marks: [
        Plot.barY(plotData, {
          x: "model",
          y: "logL",
          fill: "#1f77b4",
          title: d => `${d.model}\nLog-L: ${d.logL.toFixed(2)}\nAIC: ${d.AIC.toFixed(2)}\nParameters: ${d.parameters}`
        })
      ]
    });
  }

  function createAlignmentWidePlot(alignmentData: any): any {
    if (!alignmentData || !alignmentData.models || alignmentData.models.length < 2) return null;

    // Extract data for both models
    const unconstrainedModel = alignmentData.models.find((m: any) => m.name.includes('Unconstrained'));
    const constrainedModel = alignmentData.models.find((m: any) => m.name.includes('Constrained'));

    if (!unconstrainedModel || !constrainedModel) return null;

    // Convert to data arrays matching D3 format
    const data1 = (unconstrainedModel.rateDistribution || []).map((rate: any) => ({
      value: rate.omega || 0,
      weight: rate.proportion || 0
    })).filter(d => d.weight > 0);

    const data2 = (constrainedModel.rateDistribution || []).map((rate: any) => ({
      value: rate.omega || 0,
      weight: rate.proportion || 0
    })).filter(d => d.weight > 0);

    if (data1.length === 0 || data2.length === 0) return null;

    // Options
    const width = 1000;
    const height = 150;
    const margin = { top: 20, right: 300, bottom: 40, left: 40 };

    // Find x-axis range
    const xValues = [...data1, ...data2].map(d => d.value);
    const xExtent = [Math.min(0, ...xValues), Math.max(1, ...xValues)];

    // Create scales using D3
    const xScale = d3.scaleSqrt()
      .domain(xExtent)
      .range([margin.left, width - margin.right])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top])
      .nice();

    // Size function for circles
    const sizeFunc = (weight: number) => Math.sqrt(weight) * (height - margin.top - margin.bottom) * 0.5;

    // Create paired data for trapezoids
    const paired = data1.map((d1, i) => {
      const d2 = data2[i];
      if (!d2) return null;
      return {
        x1: d1.value,
        x2: d2.value,
        w1: d1.weight,
        w2: d2.weight
      };
    }).filter(Boolean);

    // Create SVG using D3
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Add trapezoids
    const trapezoidsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    paired.forEach(d => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const r1 = sizeFunc(d.w1);
      const r2 = sizeFunc(d.w2);
      const x1 = xScale(d.x1);
      const x2 = xScale(d.x2);
      const y1 = yScale(0.25);
      const y2 = yScale(0.75);

      const pathData = `M ${x1 - r1},${y1} L ${x1 + r1},${y1} L ${x2 + r2},${y2} L ${x2 - r2},${y2} Z`;
      path.setAttribute("d", pathData);
      path.setAttribute("fill", "grey");
      path.setAttribute("stroke", "black");
      path.setAttribute("stroke-width", "0.5");
      path.setAttribute("opacity", "0.5");
      trapezoidsGroup.appendChild(path);
    });
    svg.appendChild(trapezoidsGroup);

    // Add reference line at omega = 1
    const refLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    refLine.setAttribute("x1", xScale(1).toString());
    refLine.setAttribute("x2", xScale(1).toString());
    refLine.setAttribute("y1", yScale(0).toString());
    refLine.setAttribute("y2", yScale(1).toString());
    refLine.setAttribute("stroke", "firebrick");
    refLine.setAttribute("stroke-width", "2");
    refLine.setAttribute("opacity", "0.5");
    svg.appendChild(refLine);

    // Add circles for unconstrained model
    data1.forEach(d => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", xScale(d.value).toString());
      circle.setAttribute("cy", yScale(0.25).toString());
      circle.setAttribute("r", sizeFunc(d.weight).toString());
      circle.setAttribute("fill", "lightgrey");
      circle.setAttribute("fill-opacity", "0.2");
      circle.setAttribute("stroke", "firebrick");
      circle.setAttribute("stroke-width", "1");

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `ω = ${d.value} (${d.weight})`;
      circle.appendChild(title);

      svg.appendChild(circle);
    });

    // Add circles for constrained model
    data2.forEach(d => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", xScale(d.value).toString());
      circle.setAttribute("cy", yScale(0.75).toString());
      circle.setAttribute("r", sizeFunc(d.weight).toString());
      circle.setAttribute("fill", "lightgrey");
      circle.setAttribute("fill-opacity", "0.2");
      circle.setAttribute("stroke", "steelblue");
      circle.setAttribute("stroke-width", "1");

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `ω = ${d.value} (${d.weight})`;
      circle.appendChild(title);

      svg.appendChild(circle);
    });

    // Add x-axis
    const xAxisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    xAxisGroup.setAttribute("transform", `translate(0,${height - margin.bottom})`);

    // Add axis line
    const axisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axisLine.setAttribute("x1", margin.left.toString());
    axisLine.setAttribute("x2", (width - margin.right).toString());
    axisLine.setAttribute("y1", "0");
    axisLine.setAttribute("y2", "0");
    axisLine.setAttribute("stroke", "black");
    xAxisGroup.appendChild(axisLine);

    // Add ticks
    const ticks = [0, 1, 2, 3, 4, 5, 6, 7];
    ticks.forEach(tick => {
      if (tick <= xExtent[1]) {
        const tickX = xScale(tick);
        const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tickLine.setAttribute("x1", tickX.toString());
        tickLine.setAttribute("x2", tickX.toString());
        tickLine.setAttribute("y1", "0");
        tickLine.setAttribute("y2", "6");
        tickLine.setAttribute("stroke", "black");
        xAxisGroup.appendChild(tickLine);

        const tickText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tickText.setAttribute("x", tickX.toString());
        tickText.setAttribute("y", "20");
        tickText.setAttribute("text-anchor", "middle");
        tickText.setAttribute("font-size", "10");
        tickText.textContent = tick.toString();
        xAxisGroup.appendChild(tickText);
      }
    });

    // Add axis label
    const axisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    axisLabel.setAttribute("x", ((margin.left + width - margin.right) / 2).toString());
    axisLabel.setAttribute("y", "35");
    axisLabel.setAttribute("text-anchor", "middle");
    axisLabel.setAttribute("font-size", "12");
    axisLabel.textContent = "ω →";
    xAxisGroup.appendChild(axisLabel);

    svg.appendChild(xAxisGroup);

    // Add labels
    const label1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label1.setAttribute("x", (width - margin.right + 10).toString());
    label1.setAttribute("y", yScale(0.25).toString());
    label1.setAttribute("font-size", "12");
    label1.setAttribute("font-family", "monospace");
    label1.setAttribute("dominant-baseline", "middle");
    label1.textContent = "Unconstrained model ω tested";
    svg.appendChild(label1);

    const label2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label2.setAttribute("x", (width - margin.right + 10).toString());
    label2.setAttribute("y", yScale(0.75).toString());
    label2.setAttribute("font-size", "12");
    label2.setAttribute("font-family", "monospace");
    label2.setAttribute("dominant-baseline", "middle");
    label2.textContent = "Constrained model ω tested";
    svg.appendChild(label2);

    return svg;
  }

  function createDiscreteDistribution(rateDistribution: any[], options: any = {}): any {
    if (!rateDistribution || rateDistribution.length === 0) return null;

    // Convert rate distribution to data format
    const data = rateDistribution
      .map(rate => ({
        omega: rate.omega || rate[0] || 0,
        proportion: rate.proportion || rate[1] || 0
      }))
      .filter(d => d.proportion > 0);

    if (data.length === 0) return null;

    const width = options.width || 180;
    const height = options.height || 45;
    const margin = { top: 8, right: 20, bottom: 22, left: 25 };

    // Determine domain with nice scaling
    const maxOmega = Math.max(2, Math.max(...data.map(d => d.omega)));
    const xExtent = [0, maxOmega * 1.1];
    
    return Plot.plot({
      width,
      height,
      marginLeft: margin.left,
      marginRight: margin.right,
      marginTop: margin.top,
      marginBottom: margin.bottom,
      style: {
        background: "transparent",
        fontFamily: "system-ui, sans-serif",
        fontSize: "10px"
      },
      x: {
        label: "ω →",
        domain: xExtent,
        type: options.scale === "symlog" ? "symlog" : "linear",
        axis: "bottom",
        ticks: maxOmega > 50 ? [0, 1, 10, 100] : maxOmega > 5 ? [0, 1, 5, 10] : [0, 0.5, 1, 2],
        tickSize: 3,
        grid: false,
        labelAnchor: "center",
        labelOffset: 30
      },
      y: {
        domain: [0, 1],
        axis: null
      },
      marks: [
        // Reference line at omega = 1
        Plot.ruleX([1], {
          stroke: "#dc2626",
          strokeWidth: 1.5,
          opacity: 0.7
        }),
        
        // Rate class circles
        Plot.dot(data, {
          x: "omega",
          y: 0.5,
          r: d => Math.max(3, Math.sqrt(d.proportion) * 24),
          fill: "#6b7280",
          stroke: "#374151",
          strokeWidth: 1,
          opacity: 0.8,
          title: d => `ω = ${d.omega.toFixed(4)}\nProportion = ${(d.proportion * 100).toFixed(1)}%`
        })
      ]
    });
  }

  // Initialize plots when data is available and component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  $: if (mounted && (siteData.length > 0 || alignmentWideResults)) {
    renderPlots();
  }

  // Re-render tree when parameters change
  $: if (mounted && data && showTree && (colorBranches || treeWidth || treeHeight || showScale || alignTips || showInternal)) {
    renderBustedTree();
  }

  function renderPlots() {
    if (evidenceRatioContainer && (selectedVisualization === 'evidence' || selectedVisualization === 'all')) {
      const plot = createEvidenceRatioPlot(siteData);
      if (plot) {
        evidenceRatioContainer.innerHTML = '';
        evidenceRatioContainer.appendChild(plot);
      }
    }

    if (synonymousRateContainer && (selectedVisualization === 'synonymous' || selectedVisualization === 'all')) {
      const plot = createSynonymousRatePlot(siteData);
      if (plot) {
        synonymousRateContainer.innerHTML = '';
        synonymousRateContainer.appendChild(plot);
      }
    }

    if (distributionContainer && distributionData) {
      const plot = createDistributionPlot(distributionData);
      if (plot) {
        distributionContainer.innerHTML = '';
        distributionContainer.appendChild(plot);
      }
    }

    if (alignmentWideContainer && alignmentWideResults) {
      const plot = createAlignmentWidePlot(alignmentWideResults);
      if (plot) {
        alignmentWideContainer.innerHTML = '';
        alignmentWideContainer.appendChild(plot);
      }
    }

    // Render discrete distribution plots for each model
    if (alignmentWideResults && alignmentWideResults.models) {
      alignmentWideResults.models.forEach((model: any) => {
        const container = discretePlotContainers[model.name];
        if (container && model.rateDistribution) {
          const plot = createDiscreteDistribution(model.rateDistribution, {
            width: 180,
            height: 45,
            scale: "symlog"
          });
          if (plot) {
            container.innerHTML = '';
            container.appendChild(plot);
          }
        }
      });
    }
  }

  function getTreeNewick(data: any): string | null {
    if (!data?.input?.trees) return null;

    const trees = data.input.trees;

    // Handle different tree storage formats
    if (Array.isArray(trees)) {
      return trees[0] || null;
    } else if (typeof trees === 'object' && trees !== null) {
      const treeKeys = Object.keys(trees);
      const treeKey = treeKeys[0];
      return trees[treeKey] || null;
    } else if (typeof trees === 'string') {
      return trees;
    }

    return null;
  }

  function renderBustedTree() {
    if (!data?.input?.trees || !treeContainer) return;

    try {
      // Get the Newick string
      const newick = getTreeNewick(data);
      if (!newick || typeof newick !== 'string' || newick.trim() === '') {
        treeContainer.innerHTML = '<p>No tree data found</p>';
        return;
      }

      // Create phylotree instance
      const tree = new phylotree(newick);

      if (!tree) {
        treeContainer.innerHTML = '<p>Failed to create tree from data</p>';
        return;
      }

      // Combined edge styler function
      function edgeStyler(element, data) {
        try {
          if (colorBranches === 'Tested') {
            const tested = data?.tested || {};
            const branchName = data.target?.data?.name;
            if (branchName && tested[branchName] === 'test') {
              element.style('stroke', 'firebrick').style('stroke-width', '3px');
            }
          }
        } catch (e) {
          console.error('Error in edgeStyler:', e);
        }
      }

      // Render the tree
      const renderedTree = tree.render({
        container: '.tree-container',
        height: treeHeight,
        width: treeWidth,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'show-scale': showScale,
        'is-radial': false,
        'show-menu': false,
        selectable: false,
        collapsible: false,
        reroot: false,
        hide: false,
        'edge-styler': edgeStyler
      });

      // Clear the container and append the SVG element
      treeContainer.innerHTML = '';
      treeContainer.appendChild(renderedTree.show());

      // Style nodes to use monospace font
      if (renderedTree && typeof renderedTree.style_nodes === 'function') {
        renderedTree.style_nodes((element, node) => {
          element.selectAll('text').style('font-family', 'ui-monospace');
          if (!node.children || !node.children.length) {
            element.selectAll('title').data([node.data.name]).join('title').text(d => d);
          }
        });
      }

      // Apply branch coloring after rendering
      if (colorBranches === 'Tested' && renderedTree && typeof renderedTree.style_edges === 'function') {
        const tested = data.tested || {};
        renderedTree.style_edges((element, node) => {
          const branchName = node.target?.data?.name;
          if (branchName && tested[branchName] === 'test') {
            element.style('stroke', 'firebrick').style('stroke-width', '3px');
          }
        });
      }

    } catch (error) {
      console.error('Error rendering BUSTED tree:', error);
      if (treeContainer) {
        treeContainer.innerHTML = '<p>Error rendering phylogenetic tree</p>';
      }
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'desc';
    }
    currentPage = 1;
  }

  function formatValue(value: any, column: string): string {
    if (typeof value !== 'number') return String(value);
    
    if (column === 'Evidence Ratio') {
      return value < 0.001 ? value.toExponential(2) : value.toFixed(2);
    }
    if (column === 'Synonymous Rate') {
      return value.toFixed(4);
    }
    return value.toString();
  }

  const tableHeaders = [
    { key: 'site', label: 'Site', sortable: true },
    { key: 'Evidence Ratio', label: 'Evidence Ratio', sortable: true },
    { key: 'Synonymous Rate', label: 'Synonymous Rate', sortable: true },
    { key: 'Selection', label: 'Selection Category', sortable: true }
  ];
</script>

<div class="busted-visualization">
  {#if !data}
    <div class="loading">
      Loading BUSTED data...
    </div>
  {:else}
    <!-- Analysis Summary -->
    <div class="analysis-info">
      <h2>BUSTED Analysis Results</h2>
      <p>
        <strong>Branch-site Unrestricted Statistical Test for Episodic Diversification</strong> 
        tests whether a gene has experienced positive selection at some sites along some branches.
      </p>
    </div>

    <!-- Summary Tiles -->
    {#if summary}
      <div class="summary-tiles">
        <div class="tile">
          <div class="tile-number">{summary.sequences}</div>
          <div class="tile-description">sequences in the alignment</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.sites}</div>
          <div class="tile-description">codon sites in the alignment</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.partitions}</div>
          <div class="tile-description">partitions</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.branchesTestedCount}</div>
          <div class="tile-description">median branches/partition used for testing</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.rateClasses} classes</div>
          <div class="tile-description">non-synonymous rate variation</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.synonymousRateVariation}</div>
          <div class="tile-description">synonymous rate variation</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.pValue <= 0.05 ? '#8e44ad' : '#666'}">
            {summary.pValue.toFixed(5)}
          </div>
          <div class="tile-description">p-value for episodic diversifying selection</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.pValue <= 0.05 ? '#8e44ad' : '#666'}">
            {summary.sitesWithHighER}
          </div>
          <div class="tile-description">Sites with ER≥10 for positive selection</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.pValue <= 0.05 ? '#8e44ad' : '#666'}">
            {summary.multipleTestingCorrection}
          </div>
          <div class="tile-description">Multiple hit rates (2H:3H)</div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="evidence-threshold">Evidence threshold:</label>
        <input 
          type="number" 
          id="evidence-threshold"
          bind:value={evidenceThreshold} 
          min="1" 
          max="1000" 
          step="10"
        />
      </div>

      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            bind:checked={showOnlySignificant}
          />
          Show only sites above threshold
        </label>
      </div>

      <div class="control-group">
        <label for="visualization-type">Show plots:</label>
        <select id="visualization-type" bind:value={selectedVisualization}>
          <option value="evidence">Evidence Ratios</option>
          <option value="synonymous">Synonymous Rates</option>
          <option value="all">All Plots</option>
        </select>
      </div>
    </div>

    <!-- Alignment-wide Results -->
    {#if alignmentWideResults}
      <div class="alignment-wide-section">
        <h2>Alignment-wide results</h2>
        
        <div class="alignment-wide-container">
          <!-- Model Comparison Table with integrated plot -->
          <table class="model-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Log (L)</th>
                <th>AIC-c</th>
                <th>Params.</th>
                <th>Rate distribution</th>
                <th>Rate plot</th>
              </tr>
            </thead>
            <tbody>
              {#each alignmentWideResults.models as model}
                <tr>
                  <td class="model-name">{model.name}</td>
                  <td>{model.logL ? model.logL.toFixed(2) : 'N/A'}</td>
                  <td>{model.aicC ? model.aicC.toFixed(1) : 'N/A'}</td>
                  <td>{model.parameters || 'N/A'}</td>
                  <td class="rate-distribution">
                    <div class="tested-omega">
                      <strong>Tested ω</strong>
                    </div>
                    {#if model.rateDistribution && model.rateDistribution.length > 0}
                      <div class="rate-values">
                        {#each model.rateDistribution as rate, i}
                          {@const omega = rate.omega || rate[0] || 0}
                          {@const proportion = rate.proportion || rate[1] || 0}
                          {#if proportion > 0}
                            <span class="rate-value">
                              {omega.toFixed(4)} ({(proportion * 100).toFixed(1)}%)
                            </span>{#if i < model.rateDistribution.length - 1} {/if}
                          {/if}
                        {/each}
                      </div>
                      <div class="mean-cov">
                        Mean = {model.mean ? model.mean.toFixed(5) : '0.00000'}, CoV = {model.cov ? model.cov.toFixed(2) : '0.00'}
                      </div>
                    {/if}
                  </td>
                  <td class="rate-plot-cell">
                    <div class="discrete-plot-container" bind:this={discretePlotContainers[model.name]}></div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          
          <!-- Full Rate Distribution Plot -->
          <div class="rate-plot-container">
            <div class="plot-container" bind:this={alignmentWideContainer}></div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Phylogenetic Tree Visualization -->
    {#if showTree && data?.input?.trees}
      <div class="plot-section">
        <h3>Phylogenetic Tree</h3>
        <p class="plot-description">
          Phylogenetic tree showing which branches were tested for positive selection.
          Tested branches are highlighted in red.
        </p>

        <div class="tree-controls">
          <div class="control-row">
            <div class="control-group">
              <label for="color-branches">Color branches:</label>
              <select id="color-branches" bind:value={colorBranches}>
                <option value="Tested">Tested branches</option>
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
      </div>
    {/if}

    <!-- Model Comparison -->
    <div class="plot-section">
      <h3>Model Comparison</h3>
      <p class="plot-description">
        Comparison of baseline and alternative models. The likelihood ratio test determines 
        if positive selection is present.
      </p>
      <div class="plot-container" bind:this={distributionContainer}></div>
    </div>

    <!-- Evidence Ratio Plot -->
    {#if selectedVisualization === 'evidence' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>Evidence Ratios for Positive Selection</h3>
        <p class="plot-description">
          Sites with higher evidence ratios show stronger statistical support for positive selection.
          Thresholds: Strong (≥100), Moderate (≥10), Weak (≥3).
        </p>
        <div class="plot-container" bind:this={evidenceRatioContainer}></div>
      </div>
    {/if}

    <!-- Synonymous Rate Plot -->
    {#if selectedVisualization === 'synonymous' || selectedVisualization === 'all'}
      <div class="plot-section">
        <h3>Synonymous Substitution Rates</h3>
        <p class="plot-description">
          Rate of synonymous substitutions across sites, indicating background mutation rate.
        </p>
        <div class="plot-container" bind:this={synonymousRateContainer}></div>
      </div>
    {/if}

    <!-- Site Results Table -->
    <div class="table-section">
      <h3>Site-Level Results</h3>
      <p class="table-description">
        Statistical evidence for positive selection at each site. Click column headers to sort.
      </p>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              {#each tableHeaders as header}
                <th 
                  class:sortable={header.sortable}
                  class:sorted={sortColumn === header.key}
                  on:click={() => header.sortable && handleSort(header.key)}
                >
                  <div class="header-content">
                    <span>{header.label}</span>
                    {#if header.sortable}
                      <span class="sort-indicator">
                        {#if sortColumn === header.key}
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        {:else}
                          ↕
                        {/if}
                      </span>
                    {/if}
                  </div>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each paginatedData as site}
              <tr>
                {#each tableHeaders as header}
                  <td 
                    style="color: {header.key === 'Selection' ? getSelectionColor(site[header.key]) : 'inherit'}"
                  >
                    {formatValue(site[header.key], header.key)}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="pagination">
          <div class="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} 
            of {sortedData.length} sites
          </div>
          
          <div class="pagination-controls">
            <button 
              class="page-btn" 
              disabled={currentPage === 1}
              on:click={() => currentPage = 1}
            >
              ‹‹
            </button>
            <button 
              class="page-btn" 
              disabled={currentPage === 1}
              on:click={() => currentPage--}
            >
              ‹
            </button>
            
            {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
              const start = Math.max(1, currentPage - 2);
              return start + i;
            }).filter(page => page <= totalPages) as page}
              <button 
                class="page-btn"
                class:active={page === currentPage}
                on:click={() => currentPage = page}
              >
                {page}
              </button>
            {/each}
            
            <button 
              class="page-btn" 
              disabled={currentPage === totalPages}
              on:click={() => currentPage++}
            >
              ›
            </button>
            <button 
              class="page-btn" 
              disabled={currentPage === totalPages}
              on:click={() => currentPage = totalPages}
            >
              ››
            </button>
          </div>

          <div class="page-size-control">
            <label for="page-size">Per page:</label>
            <select id="page-size" bind:value={itemsPerPage} on:change={() => currentPage = 1}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      {/if}
    </div>

    <!-- Citation -->
    <div class="citation">
      <h3>Citation</h3>
      <code>
        Murrell B, Weaver S, Smith MD, Wertheim JO, Murrell S, Aylward A, Eren K, Pollner T, 
        Martin DP, Smith DM, Scheffler K, Kosakovsky Pond SL. Gene-wide identification of 
        episodic selection. Mol Biol Evol. 2015;32(5):1365-71.
      </code>
    </div>
  {/if}
</div>

<style>
  .busted-visualization {
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
    text-align: center;
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

  .plot-section, .table-section {
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

  .table-container {
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
  }

  th {
    background: #f8f9fa;
    font-weight: 500;
    position: sticky;
    top: 0;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
  }

  th.sortable:hover {
    background: #e9ecef;
  }

  th.sortable.sorted {
    background: #dee2e6;
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

  th.sortable.sorted .sort-indicator {
    color: #333;
    opacity: 1;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-top: 1px solid #ddd;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pagination-info {
    font-size: 0.9rem;
    color: #666;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .page-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    background: #fff;
    color: #333;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 40px;
    transition: all 0.2s ease;
  }

  .page-btn:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #adb5bd;
  }

  .page-btn:disabled {
    background: #f8f9fa;
    color: #adb5bd;
    cursor: not-allowed;
  }

  .page-btn.active {
    background: #007bff;
    color: #fff;
    border-color: #007bff;
  }

  .page-size-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
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

  .alignment-wide-section {
    margin-bottom: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .alignment-wide-section h2 {
    margin: 0;
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
  }

  .alignment-wide-container {
    padding: 1.5rem;
  }

  .model-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }

  .model-table th {
    background: #f3f4f6;
    padding: 0.75rem 1rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.8rem;
    color: #374151;
    border-bottom: 1px solid #d1d5db;
  }

  .model-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }

  .model-table tbody tr:last-child td {
    border-bottom: none;
  }

  .model-table tbody tr:hover {
    background: #f9fafb;
  }

  .model-name {
    font-weight: 600;
    color: #374151;
    min-width: 160px;
  }

  .rate-distribution {
    min-width: 350px;
    padding: 0.5rem;
  }

  .tested-omega {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
    font-size: 0.8rem;
  }

  .rate-values {
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
    line-height: 1.4;
    color: #4b5563;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  .rate-value {
    display: inline-block;
    margin-right: 0.5rem;
    margin-bottom: 0.25rem;
    padding: 0.2rem 0.4rem;
    background: #f3f4f6;
    border-radius: 3px;
    font-size: 0.75rem;
  }

  .mean-cov {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }

  .rate-plot-cell {
    width: 200px;
    padding: 0.5rem;
    text-align: center;
  }

  .discrete-plot-container {
    min-height: 45px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: #fafbfc;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .discrete-plot-container :global(svg) {
    display: block;
  }

  .rate-plot-container {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    background: #fafbfc;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .tree-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .control-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
  }

  .tree-container {
    min-height: 400px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    overflow: auto;
    background: #fff;
  }

  :global(.phylotree-container) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  :global(.phylotree-container text) {
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace !important;
  }

  @media (max-width: 768px) {
    .pagination {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }
    
    .pagination-controls {
      justify-content: center;
    }

    .alignment-wide-container {
      flex-direction: column;
    }

    .model-table-container,
    .rate-plot-container {
      min-width: unset;
    }
  }
</style>
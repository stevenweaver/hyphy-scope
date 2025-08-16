<script lang="ts">
  import { onMount } from 'svelte';
  import * as Plot from "@observablehq/plot";

  export let data: any;

  // Interfaces
  interface RelaxSummary {
    sequences: number;
    sites: number;
    partitions: number;
    testBranches: number;
    referenceBranches: number;
    kValue: number;
    pValue: number;
    lrt: number;
    isSignificant: boolean;
    selectionType: 'Intensification' | 'Relaxation' | 'No Change';
    nullLogL: number;
    alternativeLogL: number;
  }

  interface RateDistribution {
    omega: number;
    proportion: number;
    branchSet: string;
    category: number;
  }

  interface ModelComparison {
    model: string;
    logL: number;
    parameters: number;
    AICc: number;
  }

  // Reactive data processing
  $: summary = data ? getRelaxSummary(data) : null;
  $: rateDistributions = data ? getRateDistributions(data) : [];
  $: modelComparisons = data ? getModelComparisons(data) : [];

  // Controls
  let selectedBranchSet = 'Test';
  let showDistributions = true;

  // Plot containers
  let kValueContainer: HTMLDivElement;
  let distributionContainer: HTMLDivElement;
  let modelComparisonContainer: HTMLDivElement;

  // Utility Functions
  function getRelaxSummary(data: any): RelaxSummary {
    const testResults = data['test results'];
    const tested = data.tested || {};
    const fits = data.fits || {};
    
    const kValue = testResults?.K || 1;
    const pValue = testResults?.['p-value'] || 1;
    const lrt = testResults?.LRT || 0;
    
    let selectionType: 'Intensification' | 'Relaxation' | 'No Change' = 'No Change';
    if (pValue <= 0.05) {
      selectionType = kValue > 1 ? 'Intensification' : 'Relaxation';
    }

    return {
      sequences: data.input?.sequences || 0,
      sites: data.input?.sites || 0,
      partitions: Object.keys(data['data partitions'] || {}).length,
      testBranches: tested?.Test?.length || 0,
      referenceBranches: tested?.Reference?.length || 0,
      kValue,
      pValue,
      lrt,
      isSignificant: pValue <= 0.05,
      selectionType,
      nullLogL: fits['RELAX null']?.['log-likelihood'] || 0,
      alternativeLogL: fits['RELAX alternative']?.['log-likelihood'] || 0
    };
  }

  function getRateDistributions(data: any): RateDistribution[] {
    const branchAttrs = data['branch attributes'] || {};
    const distributions: RateDistribution[] = [];
    
    ['Test', 'Reference'].forEach(branchSet => {
      if (branchAttrs[branchSet]?.['Rate Distributions']) {
        const rateDist = branchAttrs[branchSet]['Rate Distributions'];
        rateDist.forEach((dist: any, index: number) => {
          distributions.push({
            omega: dist.omega || 0,
            proportion: dist.proportion || 0,
            branchSet,
            category: index + 1
          });
        });
      }
    });
    
    return distributions;
  }

  function getModelComparisons(data: any): ModelComparison[] {
    const fits = data.fits || {};
    const models: ModelComparison[] = [];
    
    Object.entries(fits).forEach(([modelName, modelData]: [string, any]) => {
      models.push({
        model: modelName,
        logL: modelData['log-likelihood'] || 0,
        parameters: modelData.parameters || 0,
        AICc: modelData.AICc || 0
      });
    });
    
    return models.sort((a, b) => a.AICc - b.AICc);
  }

  function getKValueColor(kValue: number, isSignificant: boolean): string {
    if (!isSignificant) return '#666';
    if (kValue > 1) return '#e3243b'; // Red for intensification
    if (kValue < 1) return '#1f77b4'; // Blue for relaxation
    return '#666';
  }

  function getKValueIcon(kValue: number, isSignificant: boolean): string {
    if (!isSignificant) return '○';
    if (kValue > 1) return '▲'; // Up arrow for intensification
    if (kValue < 1) return '▼'; // Down arrow for relaxation
    return '○';
  }

  function getSelectionDescription(selectionType: string): string {
    switch (selectionType) {
      case 'Intensification':
        return 'Selection has been intensified on test branches (K > 1)';
      case 'Relaxation':
        return 'Selection has been relaxed on test branches (K < 1)';
      default:
        return 'No significant change in selection pressure';
    }
  }

  // Plotting Functions
  function createKValuePlot(summary: RelaxSummary): any {
    const plotData = [{
      k: summary.kValue,
      pValue: summary.pValue,
      significant: summary.isSignificant,
      type: summary.selectionType
    }];

    return Plot.plot({
      title: "Selection Intensity Parameter (K)",
      subtitle: getSelectionDescription(summary.selectionType),
      width: 600,
      height: 300,
      marginLeft: 80,
      x: {
        domain: [0, Math.max(2, summary.kValue * 1.2)],
        label: "K Value",
        grid: true
      },
      y: {
        domain: [-0.5, 0.5],
        label: "",
        axis: null
      },
      color: {
        type: "ordinal",
        domain: ["Intensification", "Relaxation", "No Change"],
        range: ["#e3243b", "#1f77b4", "#666"]
      },
      marks: [
        // Reference line at K = 1
        Plot.ruleX([1], { stroke: "#666", strokeDasharray: "5,5", strokeWidth: 2 }),
        
        // K value point
        Plot.dot(plotData, {
          x: "k",
          y: 0,
          fill: "type",
          r: summary.isSignificant ? 15 : 10,
          stroke: summary.isSignificant ? "#000" : "#666",
          strokeWidth: summary.isSignificant ? 2 : 1,
          title: d => `K = ${d.k.toFixed(3)}\np-value = ${d.pValue.toExponential(3)}\n${d.type}`
        }),
        
        // Text labels
        Plot.text([{ x: 1, y: -0.3, text: "K = 1\n(Neutral)" }], {
          x: "x",
          y: "y", 
          text: "text",
          fontSize: 12,
          fill: "#666",
          textAnchor: "middle"
        }),
        
        Plot.text([{ x: summary.kValue, y: 0.3, text: `K = ${summary.kValue.toFixed(3)}` }], {
          x: "x",
          y: "y",
          text: "text", 
          fontSize: 14,
          fill: getKValueColor(summary.kValue, summary.isSignificant),
          fontWeight: "bold",
          textAnchor: "middle"
        })
      ]
    });
  }

  function createDistributionPlot(distributions: RateDistribution[], selectedSet: string): any {
    const filteredData = distributions.filter(d => d.branchSet === selectedSet);
    if (!filteredData.length) return null;

    return Plot.plot({
      title: `ω Distribution - ${selectedSet} Branches`,
      subtitle: "Rate categories and their proportions",
      width: 600,
      height: 300,
      marginLeft: 80,
      x: {
        label: "ω (dN/dS)",
        grid: true
      },
      y: {
        label: "Proportion",
        grid: true,
        domain: [0, 1]
      },
      color: {
        type: "ordinal", 
        domain: ["Purifying (ω < 1)", "Neutral (ω = 1)", "Positive (ω > 1)"],
        range: ["#1f77b4", "#2ca02c", "#e3243b"]
      },
      marks: [
        // Reference line at ω = 1
        Plot.ruleX([1], { stroke: "#666", strokeDasharray: "3,3" }),
        
        // Bars
        Plot.barY(filteredData, {
          x: "omega",
          y: "proportion", 
          fill: d => d.omega > 1 ? "Positive (ω > 1)" : 
                    d.omega === 1 ? "Neutral (ω = 1)" : 
                    "Purifying (ω < 1)",
          title: d => `Category ${d.category}\nω = ${d.omega.toFixed(3)}\nProportion = ${d.proportion.toFixed(3)}`
        }),
        
        // Labels
        Plot.text(filteredData, {
          x: "omega",
          y: d => d.proportion + 0.05,
          text: d => d.proportion.toFixed(2),
          fontSize: 10,
          textAnchor: "middle"
        })
      ]
    });
  }

  function createModelComparisonPlot(models: ModelComparison[]): any {
    if (!models.length) return null;

    return Plot.plot({
      title: "Model Comparison",
      subtitle: "Lower AICc indicates better model fit",
      width: 600,
      height: 300,
      marginLeft: 120,
      x: {
        type: "band",
        domain: models.map(m => m.model),
        label: "Model"
      },
      y: {
        label: "AICc",
        grid: true
      },
      marks: [
        Plot.barY(models, {
          x: "model",
          y: "AICc",
          fill: (d, i) => i === 0 ? "#e3243b" : "#1f77b4",
          title: d => `${d.model}\nLog-L: ${d.logL.toFixed(2)}\nParameters: ${d.parameters}\nAICc: ${d.AICc.toFixed(2)}`
        })
      ]
    });
  }

  // Initialize plots when data is available and component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  $: if (mounted && summary) {
    renderPlots();
  }

  function renderPlots() {
    if (kValueContainer && summary) {
      const plot = createKValuePlot(summary);
      if (plot) {
        kValueContainer.innerHTML = '';
        kValueContainer.appendChild(plot);
      }
    }

    if (distributionContainer && rateDistributions.length > 0 && showDistributions) {
      const plot = createDistributionPlot(rateDistributions, selectedBranchSet);
      if (plot) {
        distributionContainer.innerHTML = '';
        distributionContainer.appendChild(plot);
      }
    }

    if (modelComparisonContainer && modelComparisons.length > 0) {
      const plot = createModelComparisonPlot(modelComparisons);
      if (plot) {
        modelComparisonContainer.innerHTML = '';
        modelComparisonContainer.appendChild(plot);
      }
    }
  }
</script>

<div class="relax-visualization">
  {#if !data}
    <div class="loading">
      Loading RELAX data...
    </div>
  {:else}
    <!-- Analysis Summary -->
    <div class="analysis-info">
      <h2>RELAX Analysis Results</h2>
      <p>
        <strong>RELAX</strong> tests whether selection pressure has been relaxed or intensified 
        on a specified set of test branches relative to a set of reference branches.
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
          <div class="tile-number">{summary.testBranches}</div>
          <div class="tile-description">Test Branches</div>
        </div>
        <div class="tile">
          <div class="tile-number">{summary.referenceBranches}</div>
          <div class="tile-description">Reference Branches</div>
        </div>
        <div class="tile k-value-tile">
          <div class="tile-number" style="color: {getKValueColor(summary.kValue, summary.isSignificant)}">
            <span class="k-icon">{getKValueIcon(summary.kValue, summary.isSignificant)}</span>
            {summary.kValue.toFixed(3)}
          </div>
          <div class="tile-description">K Parameter</div>
        </div>
        <div class="tile">
          <div class="tile-number" style="color: {summary.isSignificant ? '#e3243b' : '#666'}">
            {summary.pValue.toExponential(3)}
          </div>
          <div class="tile-description">p-value</div>
        </div>
        <div class="tile selection-tile">
          <div class="tile-number" style="color: {getKValueColor(summary.kValue, summary.isSignificant)}">
            {summary.selectionType}
          </div>
          <div class="tile-description">Selection Change</div>
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="branch-set">Branch set for distribution:</label>
        <select id="branch-set" bind:value={selectedBranchSet}>
          <option value="Test">Test Branches</option>
          <option value="Reference">Reference Branches</option>
        </select>
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" bind:checked={showDistributions} />
          Show rate distributions
        </label>
      </div>
    </div>

    <!-- K Value Plot -->
    <div class="plot-section">
      <h3>Selection Intensity Parameter (K)</h3>
      <p class="plot-description">
        K measures the change in selection intensity. K &gt; 1 indicates intensification, 
        K &lt; 1 indicates relaxation, and K = 1 indicates no change.
      </p>
      <div class="plot-container" bind:this={kValueContainer}></div>
    </div>

    <!-- Rate Distribution Plot -->
    {#if showDistributions}
      <div class="plot-section">
        <h3>Rate Distributions</h3>
        <p class="plot-description">
          Distribution of ω (dN/dS) values across rate categories for the selected branch set.
          Categories with ω > 1 indicate positive selection.
        </p>
        <div class="plot-container" bind:this={distributionContainer}></div>
      </div>
    {/if}

    <!-- Model Comparison -->
    <div class="plot-section">
      <h3>Model Comparison</h3>
      <p class="plot-description">
        Comparison of null and alternative models. The model with lower AICc provides better fit.
      </p>
      <div class="plot-container" bind:this={modelComparisonContainer}></div>
    </div>

    <!-- Results Table -->
    <div class="table-section">
      <h3>Statistical Results</h3>
      <p class="table-description">
        Summary of the likelihood ratio test for selection intensity changes.
      </p>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {#if summary}
              <tr>
                <td><strong>K Parameter</strong></td>
                <td style="color: {getKValueColor(summary.kValue, summary.isSignificant)}">
                  <span class="k-icon">{getKValueIcon(summary.kValue, summary.isSignificant)}</span>
                  {summary.kValue.toFixed(4)}
                </td>
                <td>{getSelectionDescription(summary.selectionType)}</td>
              </tr>
              <tr>
                <td><strong>p-value</strong></td>
                <td style="color: {summary.isSignificant ? '#e3243b' : '#666'}">
                  {summary.pValue.toExponential(4)}
                </td>
                <td>{summary.isSignificant ? 'Statistically significant' : 'Not significant'}</td>
              </tr>
              <tr>
                <td><strong>LRT Statistic</strong></td>
                <td>{summary.lrt.toFixed(4)}</td>
                <td>Likelihood ratio test statistic</td>
              </tr>
              <tr>
                <td><strong>Test Branches</strong></td>
                <td>{summary.testBranches}</td>
                <td>Number of branches tested for selection change</td>
              </tr>
              <tr>
                <td><strong>Reference Branches</strong></td>
                <td>{summary.referenceBranches}</td>
                <td>Number of reference branches</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Citation -->
    <div class="citation">
      <h3>Citation</h3>
      <code>
        Wertheim JO, Murrell B, Smith MD, Kosakovsky Pond SL, Scheffler K. RELAX: detecting 
        relaxed selection in a phylogenetic framework. Mol Biol Evol. 2015;32(3):820-32.
      </code>
    </div>
  {/if}
</div>

<style>
  .relax-visualization {
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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .tile-description {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .k-value-tile .tile-number,
  .selection-tile .tile-number {
    font-size: 1.2rem;
  }

  .k-icon {
    font-size: 1.2rem;
    font-weight: bold;
  }

  .analysis-info {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    border-left: 4px solid #007bff;
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
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
  }

  th {
    background: #f8f9fa;
    font-weight: 500;
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

  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }
</style>
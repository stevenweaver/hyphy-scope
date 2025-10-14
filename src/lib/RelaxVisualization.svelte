<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';

  export let data: any;

  // Interfaces
  interface RateDistribution {
    omega: number;
    proportion: number;
  }

  interface ModelFit {
    model: string;
    logL: number;
    parameters: number;
    AICc: number;
    rateDistributions: Record<string, RateDistribution[]>;
  }

  interface BranchAttribute {
    name: string;
    partition: string;
    branchLength: number;
    k?: number;
  }

  // State
  let groupInView = 'Test';
  let referenceGroup = 'Reference';
  let testGroups: string[] = [];
  let kValue = 1;
  let direction = 'unknown';
  let evidence = 'unknown';
  let pValue = 0;
  let lrt = 0;
  let significant = false;
  let modelFits: ModelFit[] = [];
  let branchAttributes: BranchAttribute[] = [];
  let hoveredModel: string | null = null;

  // Containers for omega plots
  let nullModelContainer: HTMLDivElement;
  let altModelContainer: HTMLDivElement;
  let descriptiveModelContainer: HTMLDivElement;

  // Process data
  $: if (data) {
    processData(data);
  }

  function processData(json: any) {
    const testResults = json['test results'];
    const kParam = testResults['relaxation or intensification parameter'];

    // Determine if this is a multi-group analysis
    const isMultiGroup = typeof kParam === 'object' && !Array.isArray(kParam);

    if (isMultiGroup) {
      const allGroups = Object.keys(json.fits['RELAX alternative']['Rate Distributions']);
      const refGroups = Object.keys(json.fits['RELAX null']['Rate Distributions']);
      referenceGroup = refGroups[0];
      testGroups = allGroups.filter(g => g !== referenceGroup);
      groupInView = testGroups[0];
      kValue = kParam[groupInView];
    } else {
      kValue = kParam;
      groupInView = 'Test';
      referenceGroup = 'Reference';
      testGroups = ['Test'];
    }

    const p = testResults['p-value'];
    pValue = p;
    lrt = testResults['LRT'];
    significant = p <= 0.05;
    direction = kValue > 1 ? 'intensification' : 'relaxation';
    evidence = significant ? 'significant' : 'not significant';

    // Process model fits
    modelFits = processModelFits(json);

    // Process branch attributes
    branchAttributes = processBranchAttributes(json);
  }

  function processModelFits(json: any): ModelFit[] {
    const fits = json.fits;
    const models: ModelFit[] = [];

    // Filter out the base model
    Object.entries(fits).forEach(([modelName, modelData]: [string, any]) => {
      if (modelName === 'Nucleotide GTR' ||
          modelName === 'MG94xREV with separate rates for branch sets') {
        return;
      }

      const distributions = modelData['Rate Distributions'];
      const rateDistributions: Record<string, RateDistribution[]> = {};

      if (distributions) {
        Object.entries(distributions).forEach(([branchSet, dist]: [string, any]) => {
          rateDistributions[branchSet] = Object.values(dist).map((d: any) => ({
            omega: d.omega,
            proportion: d.proportion
          }));
        });
      }

      models.push({
        model: modelName,
        logL: modelData['Log Likelihood'] || 0,
        parameters: modelData['estimated parameters'] || 0,
        AICc: modelData['AIC-c'] || 0,
        rateDistributions
      });
    });

    return models;
  }

  function processBranchAttributes(json: any): BranchAttribute[] {
    const branchAttrs = json['branch attributes'][0];
    const tested = json.tested[0];
    const branchLengths = json.fits?.['Nucleotide GTR']?.['branch-lengths'] ||
                         json.trees?.branchLengths?.['Nucleotide GTR'] || {};

    const attributes: BranchAttribute[] = [];

    Object.keys(branchAttrs).forEach(branchName => {
      const attr: BranchAttribute = {
        name: branchName,
        partition: tested[branchName] || 'Not tested',
        branchLength: branchLengths[branchName] || 0
      };

      if (branchAttrs[branchName]['k (general descriptive)'] !== undefined) {
        attr.k = branchAttrs[branchName]['k (general descriptive)'];
      }

      attributes.push(attr);
    });

    return attributes.sort((a, b) => a.partition.localeCompare(b.partition));
  }

  function updateGroupInView(group: string) {
    groupInView = group;
    if (data && typeof data['test results']['relaxation or intensification parameter'] === 'object') {
      kValue = data['test results']['relaxation or intensification parameter'][group];
      direction = kValue > 1 ? 'intensification' : 'relaxation';
    }
    renderOmegaPlots();
  }

  function omegaFormatter(omegaDict: RateDistribution | undefined): string {
    if (!omegaDict) return 'N/A';
    if (omegaDict.omega === undefined) return 'N/A';
    if (omegaDict.proportion === undefined) return 'N/A';
    return `${omegaDict.omega.toFixed(2)} (${(100 * omegaDict.proportion).toFixed(2)}%)`;
  }

  // D3 Omega Plotting Functions
  function makeSpring(x1: number, x2: number, y1: number, y2: number, step: number, displacement: number): string {
    if (x1 === x2) {
      const minY = Math.min(y1, y2);
      return `M${x1},${minY - 40}v20`;
    }

    const springData: [number, number][] = [];
    let point: [number, number] = [x1, y1];
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const stepVec: [number, number] = [step * Math.cos(angle), step * Math.sin(angle)];
    let k = 0;

    if (Math.abs(x1 - x2) < 15) {
      springData.push(point);
    } else {
      while ((x1 < x2 && point[0] < x2 - 15) || (x1 > x2 && point[0] > x2 + 15)) {
        point = [point[0] + stepVec[0], point[1] + stepVec[1]];
        if (k % 2) {
          springData.push([point[0], point[1] + displacement]);
        } else {
          springData.push([point[0], point[1] - displacement]);
        }
        k++;
        if (k > 100) break;
      }
    }

    if (springData.length > 1) {
      springData.pop();
    }
    springData.push([x2, y2]);

    const line = d3.line().curve(d3.curveMonotoneX);
    return line(springData) || '';
  }

  function renderOmegaPlot(
    container: HTMLDivElement,
    modelName: string,
    modelData: ModelFit,
    refGroup: string,
    testGroup: string
  ) {
    if (!container || !modelData.rateDistributions[refGroup]) return;

    const referenceData = modelData.rateDistributions[refGroup];
    const testData = modelData.rateDistributions[testGroup];

    const dimensions = { width: 600, height: 400 };
    const margins = { left: 50, right: 15, bottom: 35, top: 35 };
    const legendBuffer = 100;
    const plotWidth = dimensions.width - margins.left - margins.right;
    const plotHeight = dimensions.height - margins.top - margins.bottom;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', dimensions.width + legendBuffer)
      .attr('height', dimensions.height);

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white');

    // Scales
    const allOmegas = referenceData.concat(testData || []).map(d => d.omega);
    const domain = d3.extent(allOmegas) as [number, number];
    domain[0] *= 0.5;

    const hasZeros = allOmegas.some(omega => omega <= 0);
    const omegaScale = (hasZeros ? d3.scalePow().exponent(0.2) : d3.scaleLog())
      .range([0, plotWidth])
      .domain(domain)
      .nice();

    const proportionScale = d3.scaleLinear()
      .range([plotHeight, 0])
      .domain([-0.05, 1])
      .clamp(true);

    const plot = svg.append('g')
      .attr('transform', `translate(${margins.left}, ${margins.top})`);

    // Neutral line
    plot.append('line')
      .attr('class', 'hyphy-neutral-line')
      .attr('x1', omegaScale(1))
      .attr('x2', omegaScale(1))
      .attr('y1', 0)
      .attr('y2', plotHeight)
      .style('stroke', '#cbd5e1')
      .style('stroke-dasharray', '5,5')
      .style('stroke-width', 2);

    // Reference lines (slate gray)
    if (testData) {
      plot.selectAll('.hyphy-omega-line-reference')
        .data(referenceData)
        .enter()
        .append('line')
        .attr('class', 'hyphy-omega-line-reference')
        .attr('x1', d => omegaScale(d.omega))
        .attr('x2', d => omegaScale(d.omega))
        .attr('y1', proportionScale(-0.05))
        .attr('y2', d => proportionScale(d.proportion))
        .style('stroke', '#64748b')
        .style('stroke-width', 3);
    }

    // Test lines (modern blue)
    const linesToPlot = testData || referenceData;
    plot.selectAll('.hyphy-omega-line')
      .data(linesToPlot)
      .enter()
      .append('line')
      .attr('class', 'hyphy-omega-line')
      .attr('x1', d => omegaScale(d.omega))
      .attr('x2', d => omegaScale(d.omega))
      .attr('y1', proportionScale(-0.05))
      .attr('y2', d => proportionScale(d.proportion))
      .style('stroke', '#3b82f6')
      .style('stroke-width', 3);

    // Displacement springs
    if (testData) {
      const diffs = referenceData.map((d, i) => ({
        x1: d.omega,
        x2: testData[i].omega,
        y1: d.proportion * 0.98,
        y2: testData[i].proportion * 0.98
      }));

      svg.append('defs')
        .append('marker')
        .attr('id', 'arrowhead-' + modelName.replace(/\s+/g, '-'))
        .attr('refX', 10)
        .attr('refY', 4)
        .attr('markerWidth', 10)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .attr('stroke', '#1e293b')
        .attr('fill', '#1e293b')
        .append('path')
        .attr('d', 'M 0,0 V8 L10,4 Z');

      plot.selectAll('.hyphy-displacement-line')
        .data(diffs)
        .enter()
        .append('path')
        .attr('class', 'hyphy-displacement-line')
        .attr('d', d => makeSpring(
          omegaScale(d.x1),
          omegaScale(d.x2),
          proportionScale(d.y1 * 0.5),
          proportionScale(d.y2 * 0.5),
          5,
          5
        ))
        .attr('marker-end', `url(#arrowhead-${modelName.replace(/\s+/g, '-')})`)
        .style('stroke', '#1e293b')
        .style('fill', 'none')
        .style('stroke-width', 1.5);
    }

    // X axis
    const xAxis = d3.axisBottom(omegaScale).ticks(10, '.0e');
    svg.append('g')
      .attr('transform', `translate(${margins.left}, ${plotHeight + margins.top})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(-45)');

    svg.append('text')
      .attr('x', margins.left + plotWidth)
      .attr('y', plotHeight + margins.top + margins.bottom - 5)
      .style('text-anchor', 'end')
      .text('ω');

    // Y axis
    const yAxis = d3.axisLeft(proportionScale).ticks(10, '.1%');
    svg.append('g')
      .attr('transform', `translate(${margins.left}, ${margins.top})`)
      .call(yAxis);

    svg.append('text')
      .attr('x', 10)
      .attr('y', margins.top - 10)
      .style('text-anchor', 'start')
      .text('Proportion of sites');

    // Legend
    if (testData) {
      const legend = svg.append('g')
        .attr('transform', `translate(${dimensions.width}, 40)`);

      const legendData = [
        { label: testGroup, color: '#3b82f6' },
        { label: refGroup, color: '#64748b' }
      ];

      legendData.forEach((item, i) => {
        const y = i * 25;
        legend.append('rect')
          .attr('width', 20)
          .attr('height', 20)
          .attr('y', y)
          .attr('fill', item.color);

        legend.append('text')
          .attr('x', 25)
          .attr('y', y + 15)
          .text(item.label)
          .style('font-size', '14px');
      });
    }
  }

  function renderOmegaPlots() {
    if (!modelFits.length) return;

    // Find relevant models
    const nullModel = modelFits.find(m => m.model === 'RELAX null');
    const altModel = modelFits.find(m => m.model === 'RELAX alternative');
    const descModel = modelFits.find(m => m.model === 'RELAX partitioned descriptive');

    if (nullModelContainer && nullModel) {
      renderOmegaPlot(nullModelContainer, 'RELAX null', nullModel, referenceGroup, groupInView);
    }

    if (altModelContainer && altModel) {
      renderOmegaPlot(altModelContainer, 'RELAX alternative', altModel, referenceGroup, groupInView);
    }

    if (descriptiveModelContainer && descModel) {
      renderOmegaPlot(descriptiveModelContainer, 'RELAX partitioned descriptive', descModel, referenceGroup, groupInView);
    }
  }

  onMount(() => {
    if (data) {
      processData(data);
    }
  });

  afterUpdate(() => {
    renderOmegaPlots();
  });
</script>

<div class="relax-visualization">
  {#if !data}
    <div class="loading">Loading RELAX data...</div>
  {:else}
    <!-- Summary Section -->
    <section class="summary-section">
      <h2>RELAX Analysis Summary</h2>
      <p class="summary-text">
        Test for selection <strong class="summary-direction">{direction}</strong>
        (K = <strong class="summary-k">{kValue.toFixed(2)}</strong>) was
        <strong class="summary-evidence" class:significant>{evidence}</strong>
        (p = <strong class="summary-pvalue">{pValue.toFixed(3)}</strong>,
        LR = <strong class="summary-lrt">{lrt.toFixed(2)}</strong>).
      </p>

      {#if testGroups.length > 1}
        <div class="group-selector">
          <p>
            Comparing test branch partition:
            <select bind:value={groupInView} on:change={() => updateGroupInView(groupInView)}>
              {#each testGroups as group}
                <option value={group}>{group}</option>
              {/each}
            </select>
            against reference branch partition: <strong>{referenceGroup}</strong>
          </p>
        </div>
      {/if}
    </section>

    <!-- Model Fits Table -->
    <section class="model-fits-section">
      <h2>Model Fits</h2>
      <p class="section-description">Hover over a column header for a description of its content.</p>

      <div class="table-container">
        <table class="model-table">
          <thead>
            <tr>
              <th title="Model name">Model</th>
              <th title="Log likelihood of model fit"><em>log</em> L</th>
              <th title="Number of parameters"># params</th>
              <th title="Small-sample correct Akaike information criterion">AIC<sub>c</sub></th>
              <th title="Indicates which branch set each parameter belongs to">Branch set</th>
              <th title="First omega rate class">ω<sub>1</sub></th>
              <th title="Second omega rate class">ω<sub>2</sub></th>
              <th title="Third omega rate class">ω<sub>3</sub></th>
            </tr>
          </thead>
          <tbody>
            {#each modelFits as model}
              {@const branchSets = Object.keys(model.rateDistributions)}
              {#each branchSets as branchSet, i}
                <tr
                  class:active={hoveredModel === model.model}
                  on:mouseenter={() => hoveredModel = model.model}
                  on:mouseleave={() => hoveredModel = null}
                >
                  {#if i === 0}
                    <td>{model.model}</td>
                    <td>{model.logL.toFixed(1)}</td>
                    <td>{model.parameters}</td>
                    <td>{model.AICc.toFixed(1)}</td>
                  {:else}
                    <td colspan="4"></td>
                  {/if}
                  <td>{branchSet}</td>
                  <td>{omegaFormatter(model.rateDistributions[branchSet][0])}</td>
                  <td>{omegaFormatter(model.rateDistributions[branchSet][1])}</td>
                  <td>{omegaFormatter(model.rateDistributions[branchSet][2])}</td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Omega Plots -->
    <section class="omega-plots-section">
      <h2>Omega Distributions</h2>
      <p class="section-description">
        Shows the different omega rate distributions under the null and alternative models.
      </p>

      <div class="omega-plot-card">
        <h3>ω distributions under the <strong>RELAX null</strong> model</h3>
        <div bind:this={nullModelContainer} class="plot-container"></div>
      </div>

      <div class="omega-plot-card">
        <h3>ω distributions under the <strong>RELAX alternative</strong> model</h3>
        <div bind:this={altModelContainer} class="plot-container"></div>
      </div>

      {#if modelFits.some(m => m.model === 'RELAX partitioned descriptive')}
        <div class="omega-plot-card">
          <h3>ω distributions under the <strong>RELAX partitioned descriptive</strong> model</h3>
          <div bind:this={descriptiveModelContainer} class="plot-container"></div>
        </div>
      {/if}
    </section>

    <!-- Branch Attributes Table -->
    <section class="branch-attributes-section">
      <h2>Branch Attributes</h2>
      <div class="table-container">
        <table class="branch-table">
          <thead>
            <tr>
              <th title="Branch name">Branch</th>
              <th title="Reference, Test or Not Tested">Partition</th>
              <th title="Nucleotide GTR Branch Length">Branch Length</th>
              {#if branchAttributes.some(b => b.k !== undefined)}
                <th title="Branch specific relaxation parameter">k</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each branchAttributes as branch}
              <tr>
                <td>{branch.name}</td>
                <td><span class="partition-badge" class:test={branch.partition === 'Test'} class:reference={branch.partition === 'Reference'}>{branch.partition}</span></td>
                <td>{branch.branchLength.toFixed(3)}</td>
                {#if branchAttributes.some(b => b.k !== undefined)}
                  <td>{branch.k !== undefined ? branch.k.toFixed(3) : 'N/A'}</td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Citation -->
    <section class="citation-section">
      <h3>Citation</h3>
      <p>
        Wertheim JO, Murrell B, Smith MD, Kosakovsky Pond SL, Scheffler K. <strong>RELAX: detecting relaxed selection in a phylogenetic framework.</strong> Mol Biol Evol. 2015;32(3):820-32.
        <a href="http://www.ncbi.nlm.nih.gov/pubmed/25540451" target="_blank" rel="noopener noreferrer">PMID: 25540451</a>
      </p>
    </section>
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

  section {
    margin-bottom: 2rem;
    background: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  h2 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.5rem;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: #555;
    font-size: 1.2rem;
  }

  .section-description {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .summary-section {
    background: #f8f9fa;
    border-left: 4px solid #3b82f6;
  }

  .summary-text {
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .summary-direction,
  .summary-k,
  .summary-lrt {
    color: #3b82f6;
  }

  .summary-evidence {
    color: #666;
  }

  .summary-evidence.significant {
    color: #e74c3c;
    background: #ffebeb;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
  }

  .group-selector {
    margin-top: 1rem;
    padding: 1rem;
    background: #fff;
    border-radius: 4px;
  }

  .group-selector select {
    margin: 0 0.5rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .table-container {
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    position: sticky;
    top: 0;
    cursor: help;
  }

  .model-table tbody tr {
    transition: background-color 0.15s;
  }

  .model-table tbody tr:hover,
  .model-table tbody tr.active {
    background-color: #f0f8ff;
  }

  .branch-table tbody tr:hover {
    background-color: #f8f9fa;
  }

  .partition-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.85rem;
    font-weight: 500;
    background: #e9ecef;
    color: #495057;
  }

  .partition-badge.test {
    background: #d1ecf1;
    color: #0c5460;
  }

  .partition-badge.reference {
    background: #f8d7da;
    color: #721c24;
  }

  .omega-plot-card {
    margin-bottom: 2rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    background: #fafafa;
  }

  .omega-plot-card h3 {
    text-align: center;
    margin-bottom: 1rem;
  }

  .plot-container {
    min-height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .plot-container :global(svg) {
    max-width: 100%;
    height: auto;
  }

  .citation-section {
    background: #f8f9fa;
    border-top: 2px solid #dee2e6;
  }

  .citation-section p {
    margin: 0;
    line-height: 1.6;
  }

  .citation-section a {
    color: #007bff;
    text-decoration: none;
  }

  .citation-section a:hover {
    text-decoration: underline;
  }

  /* Global styles for D3 elements */
  :global(.hyphy-neutral-line) {
    stroke: #cbd5e1;
    stroke-width: 2;
    stroke-dasharray: 5,5;
  }

  :global(.hyphy-omega-line) {
    stroke: #3b82f6;
    stroke-width: 3;
  }

  :global(.hyphy-omega-line-reference) {
    stroke: #64748b;
    stroke-width: 3;
  }

  :global(.hyphy-displacement-line) {
    stroke: #1e293b;
    stroke-width: 1.5;
    fill: none;
  }
</style>

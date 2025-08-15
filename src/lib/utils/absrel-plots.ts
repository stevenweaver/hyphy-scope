/**
 * ABSREL plotting functions using Observable Plot
 */

import * as Plot from "@observablehq/plot";
import type { AbsrelBranchData, AbsrelSiteData, AbsrelResults } from './absrel-utils.js';

/**
 * Create a p-value significance plot
 */
export function createPValuePlot(branches: AbsrelBranchData[], threshold: number = 0.05): any {
  if (!branches.length) return null;

  // Transform data for plotting
  const plotData = branches.map((branch, index) => ({
    branch: branch.name,
    index: index,
    uncorrectedPValue: branch['Uncorrected P-value'],
    correctedPValue: branch['Corrected P-value'],
    logUncorrected: -Math.log10(Math.max(branch['Uncorrected P-value'], 1e-10)),
    logCorrected: -Math.log10(Math.max(branch['Corrected P-value'], 1e-10)),
    significant: branch['Corrected P-value'] <= threshold
  }));

  const thresholdLine = -Math.log10(threshold);

  return Plot.plot({
    title: "Branch Selection Significance",
    subtitle: `p-value threshold: ${threshold}`,
    width: 800,
    height: 400,
    marginLeft: 100,
    marginBottom: 120,
    x: {
      type: "band",
      domain: plotData.map(d => d.branch),
      label: "Branch",
      tickRotate: -45
    },
    y: {
      label: "-log₁₀(p-value)",
      grid: true
    },
    color: {
      legend: true,
      range: ["#1f77b4", "#ff7f0e"]
    },
    marks: [
      // Threshold line
      Plot.ruleY([thresholdLine], {
        stroke: "#d62728",
        strokeDasharray: "5,5",
        strokeWidth: 2
      }),
      
      // Uncorrected p-values
      Plot.dot(plotData, {
        x: "branch",
        y: "logUncorrected", 
        fill: "#1f77b4",
        r: 6,
        title: d => `${d.branch}\nUncorrected: ${d.uncorrectedPValue.toExponential(2)}`
      }),
      
      // Corrected p-values
      Plot.dot(plotData, {
        x: "branch",
        y: "logCorrected",
        fill: "#ff7f0e", 
        r: 6,
        title: d => `${d.branch}\nCorrected: ${d.correctedPValue.toExponential(2)}`
      }),
      
      // Highlight significant branches
      Plot.dot(plotData.filter(d => d.significant), {
        x: "branch",
        y: "logCorrected",
        stroke: "#d62728",
        strokeWidth: 3,
        fill: "none",
        r: 8
      })
    ]
  });
}

/**
 * Create a Bayes Factor plot
 */
export function createBayesFactorPlot(branches: AbsrelBranchData[]): any {
  if (!branches.length) return null;

  const plotData = branches.map((branch, index) => ({
    branch: branch.name,
    index: index,
    bayesFactor: branch['Bayes Factor'],
    logBayesFactor: Math.log10(Math.max(branch['Bayes Factor'], 1e-10)),
    evidenceLevel: getEvidenceLevel(branch['Bayes Factor'])
  }));

  return Plot.plot({
    title: "Bayes Factor Evidence for Selection",
    subtitle: "Higher values indicate stronger evidence for selection",
    width: 800,
    height: 400,
    marginLeft: 100,
    marginBottom: 120,
    x: {
      type: "band", 
      domain: plotData.map(d => d.branch),
      label: "Branch",
      tickRotate: -45
    },
    y: {
      label: "log₁₀(Bayes Factor)",
      grid: true
    },
    color: {
      type: "ordinal",
      domain: ["Very Strong", "Strong", "Substantial", "Weak", "No Evidence"],
      range: ["#8B0000", "#DC143C", "#FF6347", "#FFA500", "#808080"]
    },
    marks: [
      // Reference lines for evidence levels
      Plot.ruleY([0], { stroke: "#666", strokeDasharray: "3,3" }), // BF = 1
      Plot.ruleY([Math.log10(3)], { stroke: "#999", strokeDasharray: "3,3" }), // BF = 3 (substantial)
      Plot.ruleY([Math.log10(10)], { stroke: "#999", strokeDasharray: "3,3" }), // BF = 10 (strong)
      Plot.ruleY([Math.log10(100)], { stroke: "#999", strokeDasharray: "3,3" }), // BF = 100 (very strong)
      
      // Bars
      Plot.barY(plotData, {
        x: "branch",
        y: "logBayesFactor",
        fill: "evidenceLevel",
        title: d => `${d.branch}\nBayes Factor: ${d.bayesFactor.toFixed(2)}\nEvidence: ${d.evidenceLevel}`
      })
    ]
  });
}

/**
 * Create omega distribution plot for a specific branch
 */
export function createOmegaDistributionPlot(branch: AbsrelBranchData): any {
  if (!branch['ω distribution'] || !branch['ω distribution'].length) return null;

  const plotData = branch['ω distribution'].map((dist, index) => ({
    rateClass: dist['rate class'] || index + 1,
    omega: dist.omega,
    weight: dist.weight,
    category: dist.omega > 1 ? 'Positive Selection (ω > 1)' : 
              dist.omega === 1 ? 'Neutral (ω = 1)' : 'Purifying Selection (ω < 1)'
  }));

  return Plot.plot({
    title: `ω Distribution for ${branch.name}`,
    subtitle: "Rate classes and their weights",
    width: 600,
    height: 300,
    marginLeft: 80,
    x: {
      label: "Rate Class",
      grid: true
    },
    y: {
      label: "ω (dN/dS)",
      grid: true
    },
    color: {
      type: "ordinal",
      domain: ["Purifying Selection (ω < 1)", "Neutral (ω = 1)", "Positive Selection (ω > 1)"],
      range: ["#1f77b4", "#2ca02c", "#d62728"]
    },
    marks: [
      // Reference line at ω = 1
      Plot.ruleY([1], { stroke: "#666", strokeDasharray: "3,3" }),
      
      // Points sized by weight
      Plot.dot(plotData, {
        x: "rateClass",
        y: "omega",
        fill: "category",
        r: d => Math.sqrt(d.weight) * 20,
        title: d => `Rate Class ${d.rateClass}\nω = ${d.omega.toFixed(3)}\nWeight = ${d.weight.toFixed(3)}`
      })
    ]
  });
}

/**
 * Create site-level log likelihood plot
 */
export function createSiteLogLikelihoodPlot(
  siteData: AbsrelSiteData[], 
  selectedBranches: string[] = []
): any {
  if (!siteData.length) return null;

  // Get all branch names (excluding 'site' and 'partition')
  const branchNames = Object.keys(siteData[0]).filter(key => 
    key !== 'site' && key !== 'partition'
  );
  
  // Use selected branches or all branches if none selected
  const activeBranches = selectedBranches.length > 0 ? selectedBranches : branchNames.slice(0, 3);
  
  // Transform data for plotting
  const plotData = siteData.flatMap(site => 
    activeBranches.map(branch => ({
      site: site.site,
      branch: branch,
      logLikelihood: site[branch] || 0
    }))
  );

  return Plot.plot({
    title: "Site-Level Log Likelihood",
    subtitle: `Showing ${activeBranches.join(', ')}`,
    width: 1000,
    height: 400,
    marginLeft: 80,
    x: {
      label: "Site",
      grid: true
    },
    y: {
      label: "Log Likelihood",
      grid: true
    },
    color: {
      legend: true
    },
    marks: [
      Plot.line(plotData, {
        x: "site",
        y: "logLikelihood",
        stroke: "branch",
        strokeWidth: 2
      }),
      
      Plot.dot(plotData.filter((d, i) => i % 10 === 0), { // Show every 10th point
        x: "site",
        y: "logLikelihood", 
        fill: "branch",
        r: 3
      })
    ]
  });
}

/**
 * Create model comparison plot
 */
export function createModelComparisonPlot(results: AbsrelResults): any {
  const baseline = results.fits['Baseline model'];
  const fullModel = results.fits['Full adaptive model'];
  
  const plotData = [
    {
      model: "Baseline",
      logLikelihood: baseline['log-likelihood'],
      AIC: baseline.AIC,
      parameters: baseline.parameters
    },
    {
      model: "Full Adaptive", 
      logLikelihood: fullModel['log-likelihood'],
      AIC: fullModel.AIC,
      parameters: fullModel.parameters
    }
  ];

  return Plot.plot({
    title: "Model Comparison",
    subtitle: "Log Likelihood and AIC values",
    width: 500,
    height: 300,
    marginLeft: 100,
    x: {
      type: "band",
      domain: ["Baseline", "Full Adaptive"],
      label: "Model"
    },
    y: {
      label: "Log Likelihood",
      grid: true
    },
    marks: [
      Plot.barY(plotData, {
        x: "model",
        y: "logLikelihood",
        fill: "#1f77b4",
        title: d => `${d.model}\nLog-L: ${d.logLikelihood.toFixed(2)}\nAIC: ${d.AIC.toFixed(2)}\nParameters: ${d.parameters}`
      })
    ]
  });
}

/**
 * Helper function to categorize evidence level based on Bayes Factor
 */
function getEvidenceLevel(bayesFactor: number): string {
  if (bayesFactor >= 100) return "Very Strong";
  if (bayesFactor >= 10) return "Strong"; 
  if (bayesFactor >= 3) return "Substantial";
  if (bayesFactor >= 1) return "Weak";
  return "No Evidence";
}
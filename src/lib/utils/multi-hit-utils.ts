/**
 * Multi-Hit utility functions
 */

export interface MultiHitResults {
  'test results': {
    'Triple-hit vs single-hit'?: TestResult;
    'Triple-hit vs double-hit'?: TestResult;
    'Triple-hit vs Triple-hit-island'?: TestResult;
    'Double-hit vs single-hit'?: TestResult;
    'Triple-hit-island vs double-hit'?: TestResult;
  };
  'Evidence Ratios': {
    [key: string]: number[][];
  };
  'Site Log Likelihood': {
    [key: string]: number[][];
  };
  'Site substitutions': {
    [siteIndex: string]: {
      [sourceCodon: string]: {
        [targetCodon: string]: any;
      };
    };
  };
  input?: any;
  fits?: any;
  tested?: any[];
}

export interface TestResult {
  LRT: number;
  'p-value': number;
}

export interface ERThresholds {
  [key: string]: [number, number];
}

export interface CodonLayout {
  len: number;
  color: string;
  label: string;
  id: string;
  aa: string;
}

export interface ChordData {
  count: number;
  source: {
    id: string;
    start: number;
    end: number;
    codon: string;
  };
  target: {
    id: string;
    start: number;
    end: number;
    codon: string;
  };
}

// Genetic code translation table (codon -> amino acid)
export const translationTable: { [codon: string]: string } = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

/**
 * Get unique amino acids in order
 */
export function getUniqueAminoAcids(): string[] {
  const aminoAcids = Object.values(translationTable);
  return Array.from(new Set(aminoAcids)).sort();
}

/**
 * Get amino acid index for color mapping
 */
export function getAminoAcidIndex(aa: string): number {
  const uniqueAAs = getUniqueAminoAcids();
  return uniqueAAs.indexOf(aa) / uniqueAAs.length;
}

/**
 * Format evidence ratio data for table display
 */
export function formatEvidenceRatios(data: MultiHitResults): number[][] {
  const erKeys = Object.keys(data['Evidence Ratios']);
  const erValues = erKeys.map(key => data['Evidence Ratios'][key][0]);

  if (erValues.length === 0) return [];

  const numSites = erValues[0].length;
  const rows: number[][] = [];

  for (let i = 0; i < numSites; i++) {
    const row = [i + 1]; // Site number
    erKeys.forEach((key, idx) => {
      row.push(erValues[idx][i]);
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Format site log likelihood data for table display
 */
export function formatSiteLogLikelihood(data: MultiHitResults): number[][] {
  const logLKeys = Object.keys(data['Site Log Likelihood']);
  const logLValues = logLKeys.map(key => data['Site Log Likelihood'][key][0]);

  if (logLValues.length === 0) return [];

  const numSites = logLValues[0].length;
  const rows: number[][] = [];

  for (let i = 0; i < numSites; i++) {
    const row = [i + 1]; // Site number
    logLKeys.forEach((key, idx) => {
      row.push(logLValues[idx][i]);
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Get ER range (min, max) for a dataset
 */
export function getERRange(values: number[]): [number, number] {
  return [Math.min(...values), Math.max(...values)];
}

/**
 * Initialize ER thresholds from data
 */
export function initializeERThresholds(data: MultiHitResults): ERThresholds {
  const thresholds: ERThresholds = {};

  Object.entries(data['Evidence Ratios']).forEach(([key, values]) => {
    const range = getERRange(values[0]);
    thresholds[key] = range;
  });

  return thresholds;
}

/**
 * Count nucleotide differences between two codons
 */
export function countNucleotideDifferences(codon1: string, codon2: string): number {
  let count = 0;
  for (let i = 0; i < 3; i++) {
    if (codon1[i] !== codon2[i]) count++;
  }
  return count;
}

/**
 * Prepare codon substitution data for circos visualization
 */
export function prepareCircosData(
  substitutions: MultiHitResults['Site substitutions'],
  evidenceRatios: MultiHitResults['Evidence Ratios'],
  erThresholds: ERThresholds,
  minTransitions: number
): { layout: CodonLayout[]; chords: ChordData[]; maxCount: number } {

  // Filter sites based on ER thresholds
  const erKeys = Object.keys(evidenceRatios);
  const sitesToKeep = new Set<number>();

  if (erKeys.length > 0) {
    const numSites = evidenceRatios[erKeys[0]][0].length;

    for (let site = 0; site < numSites; site++) {
      let keepSite = true;

      for (const key of erKeys) {
        const er = evidenceRatios[key][0][site];
        const [min, max] = erThresholds[key] || [0, Infinity];

        if (er < min || er > max) {
          keepSite = false;
          break;
        }
      }

      if (keepSite) {
        sitesToKeep.add(site + 1);
      }
    }
  }

  // Count transitions
  const counts: { [source: string]: { [target: string]: number } } = {};

  Object.entries(substitutions).forEach(([siteStr, sources]) => {
    const siteNum = parseInt(siteStr);

    if (!sitesToKeep.has(siteNum)) return;

    Object.entries(sources).forEach(([sourceCodon, targets]) => {
      if (!counts[sourceCodon]) counts[sourceCodon] = {};

      Object.entries(targets).forEach(([targetCodon, occurrences]) => {
        if (!counts[sourceCodon][targetCodon]) {
          counts[sourceCodon][targetCodon] = 0;
        }
        counts[sourceCodon][targetCodon] += Object.keys(occurrences).length;
      });
    });
  });

  // Build chord data
  const chords: ChordData[] = [];
  const codonTally: { [codon: string]: number } = {};
  let maxCount = 0;

  // Initialize tally for all codons
  Object.keys(translationTable).forEach(codon => {
    codonTally[codon] = 0;
  });

  Object.entries(counts).forEach(([sourceCodon, targets]) => {
    Object.entries(targets).forEach(([targetCodon, count]) => {
      if (count > maxCount) maxCount = count;

      const nucDiff = countNucleotideDifferences(sourceCodon, targetCodon);

      if (nucDiff >= minTransitions) {
        chords.push({
          count,
          source: {
            id: `codon-${sourceCodon}`,
            start: codonTally[sourceCodon],
            end: codonTally[sourceCodon] += count,
            codon: sourceCodon
          },
          target: {
            id: `codon-${targetCodon}`,
            start: codonTally[targetCodon],
            end: codonTally[targetCodon] += count,
            codon: targetCodon
          }
        });
      }
    });
  });

  // Get unique codons from chords
  const uniqueCodons = new Set<string>();
  chords.forEach(chord => {
    uniqueCodons.add(chord.source.codon);
    uniqueCodons.add(chord.target.codon);
  });

  // Build layout
  const layout: CodonLayout[] = Array.from(uniqueCodons).map(codon => ({
    len: codonTally[codon],
    color: getCodonColor(codon),
    label: codon,
    id: `codon-${codon}`,
    aa: translationTable[codon] || '?'
  }));

  return { layout, chords, maxCount };
}

/**
 * Get color for a codon based on its amino acid
 */
export function getCodonColor(codon: string): string {
  const aa = translationTable[codon];
  if (!aa) return '#999';

  const uniqueAAs = getUniqueAminoAcids();
  const index = uniqueAAs.indexOf(aa);

  // Use d3 category20 colors
  const colors = [
    '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
    '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
    '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f',
    '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
  ];

  return colors[index % colors.length];
}

/**
 * Get test result summary
 */
export function getTestSummary(data: MultiHitResults, pThreshold: number = 0.1): {
  significant: string[];
  total: number;
} {
  const testResults = data['test results'];
  const significant: string[] = [];

  Object.entries(testResults).forEach(([testName, result]) => {
    if (result && result['p-value'] < pThreshold) {
      significant.push(testName);
    }
  });

  return {
    significant,
    total: Object.keys(testResults).length
  };
}

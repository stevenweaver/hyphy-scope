// Minimal PRIME test data for unit tests
export const mockPrimeData = {
  "MLE": {
    "content": {
      "0": [
        [1.26, 0.114, 1.31, 0.114, 1.60, 1, 2, -19.98, -23.19, 0.266, 0.649, 1.065, 0.842, -19.99, 15, 0.671, -21.10, -3.58, 1, -20.02, 15, 1, -20.10, -1.08, 1, -20.34],
        [0.88, 0.136, 0.89, 0.136, 1.21, 2, 2, -30.75, -35.81, 0.072, 0.296, 1.062, 0.381, -31.92, -4.77, 0.261, -32.64, 15, 0.488, -31.95, 15, 0.475, -31.01, 2.72, 0.892, -31.04],
        [0.44, 0.615, 0.44, 0.615, 12.69, 6, 5, -36.60, -42.25, 0.046, 0.237, -0.104, 0.415, -36.94, 4.19, 0.107, -39.25, -3.25, 0.774, -37.45, 1.84, 0.947, -37.11, -0.83, 0.636, -37.10]
      ]
    },
    "headers": [
      ["\u03b1", "Synonymous rate"],
      ["p-value", "Omnibus p-value"],
      ["\u03b2", "Non-synonymous rate"],
      ["q-value", "Omnibus q-value"],
      ["Total branch length", "Total branch length"],
      ["# subs", "Number of substitutions"],
      ["# aa", "Number of unique amino acids"],
      ["log L alt", "Alternative log-likelihood"],
      ["log L null", "Null log-likelihood"],
      ["p-value omnibus", "Omnibus test p"],
      ["q-value omnibus", "Omnibus test q"],
      ["&lambda;1 Hydrophobicity KyteDoolittle", "Lambda for Hydrophobicity"],
      ["p-value Hydrophobicity KyteDoolittle", "p for Hydrophobicity"],
      ["log L Hydrophobicity KyteDoolittle", "logL for Hydrophobicity"],
      ["&lambda;1 Volume Angstrom3", "Lambda for Volume"],
      ["p-value Volume Angstrom3", "p for Volume"],
      ["log L Volume Angstrom3", "logL for Volume"],
      ["&lambda;1 Isoelectric Point pI", "Lambda for Isoelectric Point"],
      ["p-value Isoelectric Point pI", "p for Isoelectric Point"],
      ["log L Isoelectric Point pI", "logL for Isoelectric Point"],
      ["&lambda;1 AlphaHelix Propensity ChouFasman", "Lambda for Alpha Helix"],
      ["p-value AlphaHelix Propensity ChouFasman", "p for Alpha Helix"],
      ["log L AlphaHelix Propensity ChouFasman", "logL for Alpha Helix"],
      ["&lambda;1 BetaSheet Propensity ChouFasman", "Lambda for Beta Sheet"],
      ["p-value BetaSheet Propensity ChouFasman", "p for Beta Sheet"],
      ["log L BetaSheet Propensity ChouFasman", "logL for Beta Sheet"]
    ],
    "substitutions": {
      "0": {
        "0": {"ROOT": "ATG", "NODE1": "ATG", "TIP1": "ATG", "TIP2": "GTG"},
        "1": {"ROOT": "GCT", "NODE1": "GCT", "TIP1": "GCT", "TIP2": "GCT"},
        "2": {"ROOT": "AAA", "NODE1": "AAG", "TIP1": "GAG", "TIP2": "CAG"}
      }
    }
  },
  "input": {
    "number of sequences": 10,
    "number of sites": 3,
    "partition count": 1,
    "file name": "test_data.fna",
    "trees": {
      "0": "((TIP1:0.1,TIP2:0.2)NODE1:0.3,TIP3:0.4)"
    }
  },
  "fits": {
    "Global MG94xREV": {}
  },
  "model": {
    "residue_properties": {
      "Hydrophobicity_KyteDoolittle": {"A": 1.8, "C": 2.5, "D": -3.5, "E": -3.5, "F": 2.8, "G": -0.4, "H": -3.2, "I": 4.5, "K": -3.9, "L": 3.8, "M": 1.9, "N": -3.5, "P": -1.6, "Q": -3.5, "R": -4.5, "S": -0.8, "T": -0.7, "V": 4.2, "W": -0.9, "Y": -1.3},
      "Volume_Angstrom3": {"A": -0.733, "C": -0.862, "D": -0.198, "E": 0.221, "F": 0.942, "G": -1.133, "H": 0.411, "I": 0.652, "K": 0.243, "L": 0.652, "M": 0.561, "N": -0.198, "P": -0.433, "Q": 0.221, "R": 0.654, "S": -0.633, "T": -0.233, "V": 0.152, "W": 1.461, "Y": 0.961},
      "Isoelectric_Point_pI": {"A": 0.0, "C": -0.628, "D": -1.937, "E": -1.675, "F": -0.628, "G": 0.0, "H": 1.257, "I": 0.0, "K": 1.937, "L": 0.0, "M": 0.0, "N": 0.0, "P": 0.0, "Q": 0.0, "R": 2.618, "S": 0.0, "T": 0.0, "V": 0.0, "W": -0.628, "Y": -0.628},
      "AlphaHelix_Propensity_ChouFasman": {"A": 1.533, "C": -1.095, "D": 0.353, "E": 0.883, "F": 0.353, "G": -1.095, "H": 0.353, "I": 0.353, "K": 0.353, "L": 0.353, "M": 0.883, "N": -0.117, "P": -1.095, "Q": 0.353, "R": 0.353, "S": -0.117, "T": -0.117, "V": 0.353, "W": 0.353, "Y": -0.117},
      "BetaSheet_Propensity_ChouFasman": {"A": -0.559, "C": 0.441, "D": -1.559, "E": -1.059, "F": 0.441, "G": -1.059, "H": -0.559, "I": 1.441, "K": -0.559, "L": 0.441, "M": 0.441, "N": -1.059, "P": -1.559, "Q": 0.441, "R": -0.559, "S": -0.559, "T": 0.441, "V": 1.441, "W": 0.441, "Y": 0.441}
    }
  },
  "ordering": {
    "Hydrophobicity_KyteDoolittle": 0,
    "Volume_Angstrom3": 1,
    "Isoelectric_Point_pI": 2,
    "AlphaHelix_Propensity_ChouFasman": 3,
    "BetaSheet_Propensity_ChouFasman": 4
  },
  "branch attributes": {
    "0": {
      "NODE1": {"Global MG94xREV": 0.3},
      "TIP1": {"Global MG94xREV": 0.1},
      "TIP2": {"Global MG94xREV": 0.2},
      "TIP3": {"Global MG94xREV": 0.4}
    }
  },
  "analysis": {
    "citation": "Kosakovsky Pond et al. (2024). PRIME: PRoperty Informed Models of Evolution."
  }
};

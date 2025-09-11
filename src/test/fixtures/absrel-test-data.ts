// Minimal ABSREL test data structure for testing
export const mockAbsrelData = {
  "sequences": 12,
  "sites": 5,
  "branches tested": 2,
  "branches with selection": 1,
  "p-value threshold": 0.05,
  "test results": {
    "Node1": {
      "LRT": 5.2,
      "p": 0.023,
      "uncorrected p": 0.012,
      "corrected p": 0.046
    },
    "Node2": {
      "LRT": 1.8,
      "p": 0.18,
      "uncorrected p": 0.18,
      "corrected p": 0.36
    }
  },
  "branch attributes": {
    "0": {
      "Node1": {
        "Rate Distributions": {
          "0": [[0.5, 0.8], [0.3, 0.2]],
          "1": [[1.2, 2.1], [0.7, 0.3]]
        },
        "original name": "Node1"
      },
      "Node2": {
        "Rate Distributions": {
          "0": [[0.4, 0.6], [0.6, 0.4]],
          "1": [[0.9, 1.1], [0.5, 0.5]]
        },
        "original name": "Node2"
      }
    }
  },
  "fits": {
    "Baseline model": {
      "log-likelihood": -1240.1,
      "parameters": 20,
      "AIC": 2520.4
    },
    "Full adaptive model": {
      "log-likelihood": -1234.5,
      "parameters": 25,
      "AIC": 2519.2
    }
  },
  "Site Log Likelihood": {
    "unconstrained": {
      "0": [-15.2, -12.8, -18.3, -14.7, -16.1]
    },
    "tested": {
      "Node1": [[-16.1], [-13.2], [-19.1], [-15.3], [-17.0]],
      "Node2": [[-15.8], [-13.0], [-18.7], [-15.1], [-16.5]]
    }
  },
  "substitutions": {
    "0": [
      { "ATG": "CTG", "count": 2 },
      { "GAA": "GAG", "count": 1 },
      { "TTC": "TTT", "count": 3 },
      { "AAA": "AAG", "count": 1 },
      { "GGG": "AGG", "count": 2 }
    ]
  },
  "data partitions": {
    "0": {
      "coverage": [[0, 1, 2, 3, 4]]
    }
  },
  "input": {
    "number of sequences": 12,
    "number of sites": 5,
    "partition count": 1
  },
  "analysis": {
    "citation": "Test ABSREL citation"
  }
};

export const expectedAbsrelTileSpecs = [
  {
    number: 12,
    description: "sequences in the alignment",
    icon: "icon-options-vertical icons",
    color: "asbestos"
  },
  {
    number: 5,
    description: "codon sites in the alignment",
    icon: "icon-options icons",
    color: "asbestos"
  },
  {
    number: 1,
    description: "partitions",
    icon: "icon-arrow-up icons", 
    color: "asbestos"
  }
];
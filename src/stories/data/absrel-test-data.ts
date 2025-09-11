// Sample ABSREL test data for Storybook stories
export const absrelTestData = {
  "sequences": 8,
  "sites": 300,
  "branches tested": 5,
  "branches with selection": 2,
  "p-value threshold": 0.05,
  "test results": {
    "Branch1": {
      "Rate classes": 3,
      "uncorrected p": 0.023,
      "corrected p": 0.092,
      "Uncorrected P-value": 0.023,
      "Corrected P-value": 0.092,
      "Bayes Factor": 8.5,
      "LRT": 5.234
    },
    "Branch2": {
      "Rate classes": 3,
      "uncorrected p": 0.001,
      "corrected p": 0.004,
      "Uncorrected P-value": 0.001,
      "Corrected P-value": 0.004,
      "Bayes Factor": 125.0,
      "LRT": 12.567
    },
    "Branch3": {
      "Rate classes": 2,
      "uncorrected p": 0.156,
      "corrected p": 0.234,
      "Uncorrected P-value": 0.156,
      "Corrected P-value": 0.234,
      "Bayes Factor": 2.1,
      "LRT": 2.891
    },
    "Branch4": {
      "Rate classes": 3,
      "uncorrected p": 0.089,
      "corrected p": 0.178,
      "Uncorrected P-value": 0.089,
      "Corrected P-value": 0.178,
      "Bayes Factor": 4.2,
      "LRT": 6.123
    },
    "Branch5": {
      "Rate classes": 2,
      "uncorrected p": 0.345,
      "corrected p": 0.456,
      "Uncorrected P-value": 0.345,
      "Corrected P-value": 0.456,
      "Bayes Factor": 0.8,
      "LRT": 1.234
    }
  },
  "branch attributes": {
    "0": {
      "Branch1": {
        "Rate classes": 3,
        "Corrected P-value": 0.092,
        "Rate Distributions": {
          "0": [0.1, 0.5],
          "1": [0.8, 0.3],
          "2": [2.5, 0.2]
        },
        "original name": "Branch1",
        "Baseline MG94xREV": 0.1
      },
      "Branch2": {
        "Rate classes": 3,
        "Corrected P-value": 0.004,
        "Rate Distributions": {
          "0": [0.05, 0.6],
          "1": [1.2, 0.25],
          "2": [4.8, 0.15]
        },
        "original name": "Branch2",
        "Baseline MG94xREV": 0.15
      },
      "Branch3": {
        "Rate classes": 2,
        "Corrected P-value": 0.234,
        "Rate Distributions": {
          "0": [0.2, 0.7],
          "1": [0.9, 0.3]
        },
        "original name": "Branch3",
        "Baseline MG94xREV": 0.08
      },
      "Branch4": {
        "Rate classes": 3,
        "Corrected P-value": 0.178,
        "Rate Distributions": {
          "0": [0.15, 0.4],
          "1": [1.1, 0.4],
          "2": [3.2, 0.2]
        },
        "original name": "Branch4",
        "Baseline MG94xREV": 0.12
      },
      "Branch5": {
        "Rate classes": 2,
        "Corrected P-value": 0.456,
        "Rate Distributions": {
          "0": [0.3, 0.8],
          "1": [1.0, 0.2]
        },
        "original name": "Branch5",
        "Baseline MG94xREV": 0.2
      }
    }
  },
  "tested": {
    "0": {
      "Branch1": "test",
      "Branch2": "test",
      "Branch3": "test",
      "Branch4": "test",
      "Branch5": "test"
    }
  },
  "fits": {
    "Baseline model": {
      "log-likelihood": -1890.45,
      "AIC": 3802.90,
      "parameters": 11
    },
    "Full adaptive model": {
      "log-likelihood": -1876.23,
      "AIC": 3776.46,
      "parameters": 12
    }
  },
  "Site Log Likelihood": {
    "tested": {
      "Branch1": Array.from({ length: 300 }, () => [Math.random() * -10 - 5]),
      "Branch2": Array.from({ length: 300 }, () => [Math.random() * -10 - 5]),
      "Branch3": Array.from({ length: 300 }, () => [Math.random() * -10 - 5])
    },
    "unconstrained": {
      "0": Array.from({ length: 300 }, () => Math.random() * -8 - 2)
    }
  },
  "substitutions": {
    "0": Array.from({ length: 300 }, () => Math.random() > 0.7 ? { from: "ATG", to: "CTG" } : null)
  },
  "data partitions": {
    "0": {
      "coverage": [Array.from({ length: 300 }, (_, i) => i)]
    }
  },
  "input": {
    "file name": "sample.fas",
    "number of sequences": 8,
    "number of sites": 300,
    "partition count": 1,
    "trees": "(Branch1:0.1,Branch2:0.15,(Branch3:0.08,Branch4:0.12)Node1:0.05,Branch5:0.2);"
  }
};
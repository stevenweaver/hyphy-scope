// Sample ABSREL test data for Storybook stories
export const absrelTestData = {
  "test results": {
    "Branch1": {
      "Uncorrected P-value": 0.023,
      "Corrected P-value": 0.092,
      "omega distribution": [
        [0.1, 0.5],
        [0.8, 0.3],
        [2.5, 0.2]
      ],
      "LRT": 5.234
    },
    "Branch2": {
      "Uncorrected P-value": 0.001,
      "Corrected P-value": 0.004,
      "omega distribution": [
        [0.05, 0.6],
        [1.2, 0.25],
        [4.8, 0.15]
      ],
      "LRT": 12.567
    },
    "Branch3": {
      "Uncorrected P-value": 0.156,
      "Corrected P-value": 0.234,
      "omega distribution": [
        [0.2, 0.7],
        [0.9, 0.3]
      ],
      "LRT": 2.891
    },
    "Branch4": {
      "Uncorrected P-value": 0.089,
      "Corrected P-value": 0.178,
      "omega distribution": [
        [0.15, 0.4],
        [1.1, 0.4],
        [3.2, 0.2]
      ],
      "LRT": 6.123
    },
    "Branch5": {
      "Uncorrected P-value": 0.345,
      "Corrected P-value": 0.456,
      "omega distribution": [
        [0.3, 0.8],
        [1.0, 0.2]
      ],
      "LRT": 1.234
    }
  },
  "fits": {
    "Null model": {
      "LogL": -1890.45,
      "AIC-c": 3802.90,
      "parameters": 11
    },
    "Alternative model": {
      "LogL": -1876.23,
      "AIC-c": 3776.46,
      "parameters": 12
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
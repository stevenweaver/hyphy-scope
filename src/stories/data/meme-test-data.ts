// Sample MEME test data for Storybook stories
export const memeTestData = {
  "MLE": {
    "content": {
      "0": [
        [1.234, 0.567, 0.891, 2, 0.045, 1.234],
        [0.789, 0.234, 0.512, 1, 0.234, 0.789],
        [2.345, 1.678, 2.012, 3, 0.001, 2.345],
        [0.456, 0.123, 0.290, 0, 0.789, 0.456],
        [1.567, 0.890, 1.229, 2, 0.067, 1.567],
        [0.234, 0.067, 0.151, 0, 0.901, 0.234],
        [3.456, 2.789, 3.123, 4, 0.0001, 3.456],
        [1.123, 0.456, 0.790, 1, 0.156, 1.123],
        [0.678, 0.234, 0.456, 0, 0.567, 0.678],
        [2.789, 1.456, 2.123, 3, 0.012, 2.789]
      ]
    },
    "headers": [
      ["alpha", "Synonymous substitution rate at a site"],
      ["beta-", "Non-synonymous substitution rate at a site for the negative/neutral evolution component"],
      ["beta+", "Non-synonymous substitution rate at a site for the positive/diversifying evolution component"],
      ["Branches under selection", "The (very approximate and rough) estimate of how many branches have beta+ > alpha at this site"],
      ["LRT", "Likelihood ratio test statistic for episodic diversification"],
      ["p-value", "Asymptotic p-value for episodic diversification"]
    ]
  },
  "data partitions": {
    "0": {
      "coverage": [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]
    }
  },
  "fits": {
    "Null model": {
      "LogL": -2456.78,
      "AIC-c": 4935.56,
      "parameters": 11
    },
    "Alternative model": {
      "LogL": -2434.12,
      "AIC-c": 4892.24,
      "parameters": 12
    }
  },
  "input": {
    "file name": "sample.fas",
    "number of sequences": 8,
    "number of sites": 10,
    "partition count": 1
  },
  "test results": {
    "P-value threshold": 0.1,
    "tested": 10,
    "positive test results": 4,
    "negative test results": 6
  }
};
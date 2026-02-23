// Minimal FUBAR/B-STILL test data for unit tests
export const mockFubarData = {
  "MLE": {
    "content": {
      "0": [
        [3.97, 0.04, 0.003, 0.016, 0.264, 0.239, 0.035, 0, 0, 2.86, 0.72, 3.52, 2.31, 0],
        [12.23, 0.05, 0, 0, 0.245, 0.0003, 0, 0, 0, 0, 0, 3.19, 0.002, 0],
        [2.64, 0.04, 0, 0, 0.264, 0.021, 0.00005, 0, 0, 0, 0, 3.52, 0.16, 0]
      ]
    },
    "headers": [
      ["alpha", "Mean posterior synonymous substitution rate at a site"],
      ["beta", "Mean posterior non-synonymous substitution rate at a site"],
      ["Prob[alpha=beta=0]", "Posterior probability of alpha=beta=0"],
      ["Prob[alpha=0]", "Posterior probability of alpha=0"],
      ["Prob[beta=0]", "Posterior probability of beta=0"],
      ["Prob[alpha,beta~0]", "Posterior probability of alpha and beta within a radius of 0.5 of 0"],
      ["Prob[alpha<beta]", "Posterior probability of positive selection at a site"],
      ["PSRF", "Potential scale reduction factor"],
      ["Neff", "Estimated effective sample site"],
      ["EBF[alpha=beta=0]", "Empirical Bayes Factor for alpha=beta=0"],
      ["EBF[alpha=0]", "Empirical Bayes Factor for alpha=0"],
      ["EBF[beta=0]", "Empirical Bayes Factor for beta=0"],
      ["EBF[alpha,beta~0]", "Empirical Bayes Factor for alpha,beta~0"]
    ]
  },
  "grid": [
    [0, 0, 0.001], [0, 0.5, 0.002], [0, 1, 0.001],
    [0.5, 0, 0.003], [0.5, 0.5, 0.01], [0.5, 1, 0.005],
    [1, 0, 0.002], [1, 0.5, 0.008], [1, 1, 0.015]
  ],
  "posterior": {
    "0": {
      "0": [[0.01, 0.02, 0.01, 0.03, 0.1, 0.05, 0.02, 0.08, 0.68]],
      "1": [[0.5, 0.1, 0.05, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05]],
      "2": [[0.01, 0.02, 0.01, 0.03, 0.1, 0.05, 0.02, 0.08, 0.68]]
    }
  },
  "data partitions": {
    "0": { "coverage": [[0, 1, 2]] }
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
  "branch attributes": {
    "0": {
      "NODE1": {"Nucleotide GTR": 0.3},
      "TIP1": {"Nucleotide GTR": 0.1},
      "TIP2": {"Nucleotide GTR": 0.2},
      "TIP3": {"Nucleotide GTR": 0.4}
    }
  },
  "analysis": {
    "info": "Perform a B-STILL (Bayesian Significance Test of Invariant Low Likelihoods) analysis",
    "version": "1.0 (B-STILL)"
  },
  "settings": {
    "method": "Variational-Bayes",
    "chains": 1,
    "chain-length": 2000000,
    "grid size": 20,
    "posterior": 0.9
  }
};

// Regular FUBAR data (no B-STILL columns)
export const mockRegularFubarData = {
  "MLE": {
    "content": {
      "0": [
        [1.5, 0.5, -1.0, 0.85, 0.10, 1.5],
        [0.5, 2.0, 1.5, 0.05, 0.92, 12.0],
        [1.0, 1.0, 0.0, 0.50, 0.40, 0.8]
      ]
    },
    "headers": [
      ["alpha", "Mean posterior synonymous substitution rate"],
      ["beta", "Mean posterior non-synonymous substitution rate"],
      ["beta-alpha", "Mean posterior beta-alpha"],
      ["Prob[alpha>beta]", "Posterior probability of negative selection"],
      ["Prob[alpha<beta]", "Posterior probability of positive selection"],
      ["BayesFactor[alpha<beta]", "Bayes Factor for positive selection"]
    ]
  },
  "grid": [
    [0, 0, 0.01], [0, 1, 0.02], [1, 0, 0.03], [1, 1, 0.04]
  ],
  "posterior": {},
  "data partitions": {
    "0": { "coverage": [[0, 1, 2]] }
  },
  "input": {
    "number of sequences": 5,
    "number of sites": 3,
    "file name": "test_regular.fna",
    "trees": {
      "0": "((A:0.1,B:0.2):0.3,C:0.4)"
    }
  },
  "branch attributes": {
    "0": {
      "A": {"Nucleotide GTR": 0.1},
      "B": {"Nucleotide GTR": 0.2},
      "C": {"Nucleotide GTR": 0.4}
    }
  },
  "analysis": {
    "info": "FUBAR analysis"
  },
  "settings": {
    "method": "MCMC",
    "chains": 5,
    "chain-length": 10000000,
    "grid size": 20
  }
};

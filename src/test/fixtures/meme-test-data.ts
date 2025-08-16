// Minimal MEME test data structure for testing
export const mockMemeData = {
  "MLE": {
    "content": {
      "0": [
        [0, 0, 0, 0, 1, 0, 1],
        [1.5, 1.2, 0.8, 2.1, 1.8, 0.02, 0.05],
        [0.9, 0.7, 0.6, 1.4, 1.1, 0.15, 0.12]
      ]
    },
    "headers": [
      ["alpha", "Synonymous substitution rate"],
      ["beta-", "Non-synonymous substitution rate (neutral/negative selection)"],
      ["p-", "Mixture weight for negative selection"],
      ["beta+", "Non-synonymous substitution rate (positive selection)"],
      ["p+", "Mixture weight for positive selection"],
      ["p-value", "p-value for episodic diversifying selection"],
      ["Variation p", "p-value for rate variation"]
    ]
  },
  "data partitions": {
    "0": {
      "coverage": [[0, 1, 2]]
    }
  },
  "input": {
    "number of sequences": 8,
    "number of sites": 3,
    "partition count": 1
  },
  "analysis": {
    "citation": "Test MEME citation"
  }
};

export const expectedMemeTileSpecs = [
  {
    number: 8,
    description: "sequences in the alignment",
    icon: "icon-options-vertical icons",
    color: "asbestos"
  },
  {
    number: 3,
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
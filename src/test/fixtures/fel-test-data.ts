// Minimal FEL test data structure for testing
export const mockFelData = {
  "MLE": {
    "content": {
      "0": [
        [1.834966660318865, 1.036231205055131, 1.536362958190929, 0.2654239891213876, 0.6064180503450036],
        [0.654590620941386, 0, 0.3776941920651196, 1.099517412410052, 0.2943720365517136],
        [2.446561979518739, 2.01953959163026, 2.288957692952048, 0.04687266684075553, 0.828597274859304]
      ]
    },
    "headers": [
      ["alpha", "Synonymous substitution rate at a site"],
      ["beta", "Non-synonymous substitution rate at a site"],
      ["alpha=beta", "Synonymous = non-synonymous substitution rate at a site"],
      ["dN/dS MLE", "Non-synonymous to synonymous rate ratio"],
      ["p-value", "p-value for the test that dN/dS > 1 (or alpha != beta)"]
    ]
  },
  "data partitions": {
    "0": {
      "coverage": [[0, 1, 2]]
    }
  },
  "input": {
    "number of sequences": 10,
    "number of sites": 3,
    "partition count": 1
  },
  "analysis": {
    "citation": "Test citation"
  }
};

export const expectedTileSpecs = [
  {
    number: 10,
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
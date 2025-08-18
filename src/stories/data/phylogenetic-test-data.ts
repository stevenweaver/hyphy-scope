// Sample phylogenetic tree data for Storybook stories
export const phylogeneticTestData = {
  "input": {
    "trees": [
      "((A:0.1,B:0.2):0.05,(C:0.15,D:0.1):0.08,E:0.3);",
      "((A:0.12,B:0.18):0.06,(C:0.14,D:0.11):0.07,E:0.25);"
    ]
  },
  "branch attributes": {
    "0": {
      "A": {
        "omega": 0.5,
        "branch length": 0.1
      },
      "B": {
        "omega": 1.2,
        "branch length": 0.2
      },
      "C": {
        "omega": 0.8,
        "branch length": 0.15
      },
      "D": {
        "omega": 2.1,
        "branch length": 0.1
      },
      "E": {
        "omega": 0.3,
        "branch length": 0.3
      }
    }
  }
};

// Simple array format for phylotree.js
export const simpleTreeData = [
  "((A:0.1,B:0.2):0.05,(C:0.15,D:0.1):0.08,E:0.3);"
];

// Object format 
export const objectTreeData = {
  tree: "((A:0.1,B:0.2):0.05,(C:0.15,D:0.1):0.08,E:0.3);",
  metadata: {
    name: "Sample Tree",
    description: "A simple phylogenetic tree for demonstration"
  }
};
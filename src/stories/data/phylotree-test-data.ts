export const phylotreeTestData = {
  "input": {
    "trees": {
      "0": "((raccoon:0.08608945258845895,bear:0.03869666077116538):0.10932263490107244,((sea_lion:0.07892244506884896,seal:0.0968253855654862):0.09411113637804932,((monkey:0.12741256156688647,cat:0.20645355714690167):0.06239579696339296,weasel:0.05765211108152673):0.008002970664466925):0.12518506647502716,dog:0.14835051581902094)",
      "1": "((Human:0.1,Chimp:0.2):0.05,(Gorilla:0.15,Orangutan:0.1):0.05)"
    }
  },
  "branch attributes": {
    "0": {
      "raccoon": {
        "branch length": 0.08608945258845895,
        "dN/dS": 0.5123
      },
      "bear": {
        "branch length": 0.03869666077116538,
        "dN/dS": 1.234
      },
      "sea_lion": {
        "branch length": 0.07892244506884896,
        "dN/dS": 0.8921
      },
      "seal": {
        "branch length": 0.0968253855654862,
        "dN/dS": 1.567
      },
      "monkey": {
        "branch length": 0.12741256156688647,
        "dN/dS": 0.234
      },
      "cat": {
        "branch length": 0.20645355714690167,
        "dN/dS": 2.345
      },
      "weasel": {
        "branch length": 0.05765211108152673,
        "dN/dS": 0.678
      },
      "dog": {
        "branch length": 0.14835051581902094,
        "dN/dS": 1.012
      }
    },
    "1": {
      "Human": {
        "branch length": 0.1,
        "dN/dS": 0.5
      },
      "Chimp": {
        "branch length": 0.2,
        "dN/dS": 1.5
      },
      "Gorilla": {
        "branch length": 0.15,
        "dN/dS": 0.8
      },
      "Orangutan": {
        "branch length": 0.1,
        "dN/dS": 1.2
      }
    }
  }
};

// Additional test data with a larger tree
export const largePhylotreeTestData = {
  "input": {
    "trees": {
      "0": "((((((A:0.1,B:0.2):0.05,C:0.15):0.1,(D:0.2,E:0.25):0.05):0.05,((F:0.15,G:0.1):0.1,H:0.2):0.1):0.05,(((I:0.1,J:0.15):0.05,K:0.2):0.1,(L:0.25,M:0.15):0.05):0.1):0.05,((N:0.2,O:0.15):0.1,(P:0.1,Q:0.25):0.05):0.1)"
    }
  },
  "branch attributes": {
    "0": {
      "A": {
        "branch length": 0.1,
        "dN/dS": 0.45
      },
      "B": {
        "branch length": 0.2,
        "dN/dS": 1.8
      },
      "C": {
        "branch length": 0.15,
        "dN/dS": 0.92
      },
      "D": {
        "branch length": 0.2,
        "dN/dS": 1.34
      },
      "E": {
        "branch length": 0.25,
        "dN/dS": 2.1
      },
      "F": {
        "branch length": 0.15,
        "dN/dS": 0.67
      },
      "G": {
        "branch length": 0.1,
        "dN/dS": 0.23
      },
      "H": {
        "branch length": 0.2,
        "dN/dS": 1.56
      },
      "I": {
        "branch length": 0.1,
        "dN/dS": 0.78
      },
      "J": {
        "branch length": 0.15,
        "dN/dS": 1.23
      },
      "K": {
        "branch length": 0.2,
        "dN/dS": 1.89
      },
      "L": {
        "branch length": 0.25,
        "dN/dS": 2.34
      },
      "M": {
        "branch length": 0.15,
        "dN/dS": 0.56
      },
      "N": {
        "branch length": 0.2,
        "dN/dS": 1.45
      },
      "O": {
        "branch length": 0.15,
        "dN/dS": 0.89
      },
      "P": {
        "branch length": 0.1,
        "dN/dS": 0.34
      },
      "Q": {
        "branch length": 0.25,
        "dN/dS": 1.98
      }
    }
  }
};
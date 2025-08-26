// Sample FEL test data for Storybook stories
export const felTestData = {
  "MLE": {
    "content": {
      "0": [
        [0, 0, 0, 0, 1, 0],
        [1.834966660318865, 1.036231205055131, 1.536362958190929, 0.2654239891213876, 0.6064180503450036, 0.4354050034044405],
        [0, 0, 0, -4.363282357644493e-08, 1, 0.0756469963014308],
        [0.7470577895006099, 0, 0.6075695896816573, 0.827321570596439, 0.3630481699992005, 0.1413469977872825],
        [0.654590620941386, 0, 0.3776941920651196, 1.099517412410052, 0.2943720365517136, 0.1555180736159284],
        [0, 1.626017093921774, 1.198566507788612, 1.213261423797917, 0.2706871658964743, 0.5218942164851366],
        [2.446561979518739, 2.01953959163026, 2.288957692952048, 0.04687266684075553, 0.828597274859304, 0.9119725228734172],
        [0.7605312932507918, 0.7942286605461346, 0.7766280005350712, 0.0007237424463113484, 0.9785375300666302, 0.2992395100719886],
        [0.6047171954978929, 1.082441043578533, 0.7754093829227485, 0.1669781734924243, 0.6828114838011411, 0.1803938021151566],
        [1.823470098288982, 0, 1.132167947553739, 2.85556559532165, 0.09105820836299716, 0.2633912939282546]
      ]
    },
    "headers": [
      ["alpha", "Synonymous substitution rate at a site"],
      ["beta", "Non-synonymous substitution rate at a site"],
      ["alpha=beta", "Synonymous substitution rate at a site"],
      ["LRT", "Likelihood ratio test statistic for episodic diversification"],
      ["p-value", "Asymptotic p-value for episodic diversification"],
      ["Total branch length", "The total length of branches contributing to inference at this site"]
    ]
  },
  "data partitions": {
    "0": {
      "coverage": [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]
    }
  },
  "fits": {
    "Null model": {
      "LogL": -3624.46,
      "AIC-c": 7268.93,
      "parameters": 10
    },
    "Alternative model": {
      "LogL": -3598.77,  
      "AIC-c": 7219.56,
      "parameters": 11
    }
  },
  "input": {
    "file name": "sample.fas",
    "number of sequences": 8,
    "number of sites": 10,
    "partition count": 1,
    "trees": "(Cow:0.11,((Raccoon:0.08,Bear:0.05):0.03,(((Monkey:0.02,Cat:0.03):0.01,Weasel:0.04):0.02,(Dog:0.05,Seal:0.06):0.01):0.02):0.01,Horse:0.08);"
  },
  "test results": {
    "P-value threshold": 0.1,
    "tested": 10,
    "positive test results": 4,
    "negative test results": 6
  }
};
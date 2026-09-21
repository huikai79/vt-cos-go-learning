(function (root) {
  "use strict";

  const foundationBank = {
    captureFamilies: [
      { familyId: "p2-capture-central-single", group: "single", positions: [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5], [3, 3]], opens: [[4, 5], [4, 4], [5, 3], [3, 3], [4, 6], [4, 3]] },
      { familyId: "p2-capture-edge-single", group: "single", positions: [[3, 1], [5, 1], [1, 3], [7, 3], [3, 7], [5, 7]], opens: [[3, 0], [5, 0], [0, 3], [8, 3], [3, 8], [5, 8]] },
      { familyId: "p2-capture-corner-single", group: "single", positions: [[1, 1], [7, 1], [1, 7], [7, 7], [1, 1], [7, 7]], opens: [[0, 1], [8, 1], [0, 7], [8, 7], [1, 0], [7, 8]] },
      { familyId: "p2-capture-horizontal-pair", group: "horizontal", positions: [[3, 4], [3, 3], [3, 5], [2, 4], [4, 4], [3, 2]], opens: [[2, 4], [3, 2], [5, 5], [2, 3], [4, 3], [5, 2]] },
      { familyId: "p2-capture-vertical-pair", group: "vertical", positions: [[4, 3], [3, 3], [5, 3], [4, 2], [4, 4], [2, 3]], opens: [[4, 2], [2, 3], [6, 3], [4, 1], [3, 4], [2, 5]] }
    ],
    joinFamilies: [
      { axis: "horizontal", leftSize: 1, positions: [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5]] },
      { axis: "vertical", leftSize: 1, positions: [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5]] },
      { axis: "horizontal", leftSize: 2, positions: [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5]] },
      { axis: "vertical", leftSize: 2, positions: [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5]] },
      { axis: "horizontal", leftSize: 1, positions: [[2, 2], [6, 2], [2, 6], [6, 6], [2, 4]] },
      { axis: "vertical", leftSize: 1, positions: [[2, 2], [6, 2], [2, 6], [6, 6], [4, 2]] },
      { axis: "horizontal", leftSize: 2, positions: [[3, 2], [5, 2], [3, 6], [5, 6], [3, 4]] },
      { axis: "vertical", leftSize: 2, positions: [[2, 3], [6, 3], [2, 5], [6, 5], [4, 3]] }
    ],
    rescueFamilies: [
      { positions: [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5]], opens: [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 1]] },
      { positions: [[3, 1], [5, 1], [1, 3], [7, 3], [3, 7]], opens: [[0, -1], [0, -1], [-1, 0], [1, 0], [0, 1]] },
      { positions: [[1, 1], [7, 1], [1, 7], [7, 7], [1, 1]], opens: [[-1, 0], [1, 0], [-1, 0], [1, 0], [0, -1]] },
      { positions: [[2, 4], [6, 4], [4, 2], [4, 6], [3, 3]], opens: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 0]] },
      { positions: [[5, 3], [3, 5], [5, 5], [3, 2], [5, 2]], opens: [[0, -1], [0, 1], [1, 0], [-1, 0], [1, 0]] },
      { positions: [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]], opens: [[0, -1], [0, -1], [0, 1], [0, 1], [-1, 0]] }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = foundationBank;
  root.GoPhase2FoundationBank = foundationBank;
})(typeof window !== "undefined" ? window : globalThis);

(function (root) {
  "use strict";

  const lifeAndDeathBank = {
    straightThreeFamilies: [
      { axis: "horizontal", centers: [[3, 2], [5, 2]] },
      { axis: "vertical", centers: [[2, 3], [2, 5]] },
      { axis: "horizontal", centers: [[3, 4], [5, 4]] },
      { axis: "vertical", centers: [[4, 3], [4, 5]] },
      { axis: "horizontal", centers: [[3, 6], [5, 6]] },
      { axis: "vertical", centers: [[6, 3], [6, 5]] }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = lifeAndDeathBank;
  root.GoPhase2LifeAndDeathBank = lifeAndDeathBank;
})(typeof window !== "undefined" ? window : globalThis);

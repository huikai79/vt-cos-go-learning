(function (root) {
  "use strict";

  const items=[
    {
      id:"golden-chicken-black-bottom-v1",
      familyId:"golden-chicken-v1",
      variantId:"black-bottom",
      catalogId:"golden-chicken-candidate-v1",
      boardSize:7,
      quarterTurns:0,
      colorSwap:false,
      prompt:"輪到黑棋：中央黑串只剩 1 氣。哪一手一路立，能把自己變成 2 氣，並利用白棋兩側氣緊？",
      hint:"先找黑串唯一一口氣；正解不是直接吃子，而是往一路立下。",
      success:"對。黑棋一路立後由 1 氣變成 2 氣；白棋左右兩側都不能自行填入最後一氣，黑棋反而可從任一側提兩子。",
      revealName:"金雞獨立",
      variationAxes:["edge:bottom","color:black","mechanism:double-shortage"],
      scoringContractVersion:"classic-golden-chicken-mechanism-v1"
    },
    {
      id:"golden-chicken-white-bottom-v1",
      familyId:"golden-chicken-v1",
      variantId:"white-bottom",
      catalogId:"golden-chicken-candidate-v1",
      boardSize:7,
      quarterTurns:0,
      colorSwap:true,
      prompt:"換成白棋。相同機制下，白棋要在哪裡一路立，才能把 1 氣變成 2 氣？",
      hint:"棋色交換不改機制；先找白串唯一一口氣，再檢查落子後的兩個新氣。",
      success:"對。換色後仍是同一個金雞獨立機制：一路立、增加一氣，並形成對手兩側不入。",
      revealName:"金雞獨立",
      variationAxes:["edge:bottom","color:white","mechanism:double-shortage"],
      scoringContractVersion:"classic-golden-chicken-mechanism-v1"
    },
    {
      id:"golden-chicken-black-right-v1",
      familyId:"golden-chicken-v1",
      variantId:"black-right",
      catalogId:"golden-chicken-candidate-v1",
      boardSize:7,
      quarterTurns:1,
      colorSwap:false,
      prompt:"棋形轉到右邊。輪到黑棋：不要記原本下邊的座標，重新找那個讓 1 氣變 2 氣的邊線立。",
      hint:"沿著右邊界找黑串的唯一一口氣；方向變了，規則關係沒有變。",
      success:"對。旋轉後仍由規則機制決定正解，不是固定座標。",
      revealName:"金雞獨立",
      variationAxes:["edge:right","color:black","orientation:rot90","surface-coordinate-control"],
      scoringContractVersion:"classic-golden-chicken-mechanism-v1"
    },
    {
      id:"golden-chicken-white-top-v1",
      familyId:"golden-chicken-v1",
      variantId:"white-top",
      catalogId:"golden-chicken-candidate-v1",
      boardSize:7,
      quarterTurns:2,
      colorSwap:true,
      prompt:"最後換到上邊並交換棋色。白棋要走哪個邊線立，才能重現同一個雙重氣緊機制？",
      hint:"先找白串唯一的一口氣，再確認落子後兩側會各成一口、而黑棋兩側都不能入子。",
      success:"對。位置與棋色都改變後，仍能用 1 氣→2 氣與兩側不入辨認金雞獨立。",
      revealName:"金雞獨立",
      variationAxes:["edge:top","color:white","orientation:rot180","surface-coordinate-control"],
      scoringContractVersion:"classic-golden-chicken-mechanism-v1"
    }
  ];

  const api=Object.freeze({
    version:"golden-chicken-practice-v1",
    scoringContractVersion:"classic-golden-chicken-mechanism-v1",
    familyId:"golden-chicken-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoGoldenChickenPractice=api;
})(typeof window!=="undefined"?window:globalThis);

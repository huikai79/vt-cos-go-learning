(function (root) {
  "use strict";

  const B = 1;
  const W = 2;

  const tracks = [
    {
      id: "reading-tesuji",
      title: "讀棋與手筋",
      summary: "把「找到第一手」推進到候選、最強應手、反例與終點判斷。",
      status: "active"
    },
    {
      id: "middle-game",
      title: "中盤攻防",
      summary: "練打入／侵消、輕重、棄子與安定，不把攻擊等同全吃。",
      status: "active"
    },
    {
      id: "endgame-judgment",
      title: "官子與全局判斷",
      summary: "比較先後手、局部差額、急場與全局取捨。",
      status: "active"
    },
    {
      id: "full-board-review",
      title: "完整棋局與複盤",
      summary: "進入 19 路全盤實戰練習，把局部讀棋、攻防與官子放回完整棋局；更深入的 SGF 複盤功能仍在後續發展。",
      status: "active",
      href: "live-game.html?size=19"
    }
  ];

  const experiences = [
    {
      id: "adv-r01",
      trackId: "reading-tesuji",
      title: "征子前先看引征",
      target: "在開始一路追之前，先檢查逃跑路線上是否有對方接應。",
      prompt: "白棋正在被追。判斷征子是否成立時，最先應補上的檢查是什麼？",
      choices: ["逃跑路線上是否有白棋可接應", "黑棋目前總共有幾顆棋", "哪一邊離角落比較近"],
      answer: 0,
      hint: "不要先假設對手只能一路逃；先看追逐路線前方。",
      explanation: "征子不是看到打吃就一路照走。遠方接應可能讓逃棋突然連上或反打，這類支援通常稱為引征。先檢查路線，再決定是否值得開始追。",
      takeaway: "先讀路線，再追棋；看見遠方接應就重算。",
      terms: [
        ["征子", "利用連續打吃把對方棋沿固定斜向追到無法逃脫的手段。"],
        ["引征", "位在征子逃跑路線上的接應棋，可能使原本成立的征子失效。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[2,2,W],[1,2,B],[2,1,B]], highlights: [[3,2],[2,3]], label: "先辨認兩個逃跑方向", caption: "這是征子閱讀的起點示意。先找被追白棋下一步可能延長的位置，不要直接假設追逐一定成立。" },
        { boardSize: 7, stones: [[2,2,W],[1,2,B],[2,1,B],[5,5,W]], highlights: [[3,3],[4,4]], reference: [[5,5]], label: "沿逃跑路線往前看", caption: "藍框白棋位在逃跑路線附近。它是否真能接應要靠完整讀棋判定，但這就是開始征子前必須檢查的風險。" },
        { boardSize: 7, stones: [[2,2,W],[1,2,B],[2,1,B]], highlights: [[3,3],[4,4],[5,5]], label: "沒有接應才繼續往下讀", caption: "若路線前方沒有對方接應，再逐手讀打吃、延長與下一次打吃。名稱不是答案；成立條件才是。" }
      ]
    },
    {
      id: "adv-r02",
      trackId: "reading-tesuji",
      title: "枷不是每手都打吃",
      target: "比較「一路追」和「先封出口」兩種候選。",
      prompt: "對方弱棋有兩個相鄰逃路時，枷的核心想法較接近哪一種？",
      choices: ["先封住主要出口，讓對方無法有效逃脫", "每一手都必須直接打吃", "只要靠近棋盤邊就一定成立"],
      answer: 0,
      hint: "想想能不能不貼身追，而是先佔對方下一步最想去的位置。",
      explanation: "枷的重點是封住逃跑空間，不要求每一手都形成打吃。實戰是否成立仍要讀對手的衝、斷、連接與外援。",
      takeaway: "手筋不是固定形狀；先問這一手改變了哪些逃路。",
      terms: [
        ["枷", "不必一路打吃，而是利用包圍與封路讓對方弱棋難以逃脫的手段。"],
        ["出口", "弱棋可以延長、連接或衝出的方向；封住出口常比貼身追更有效率。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[3,3,W],[3,4,W],[2,2,B],[2,3,B],[4,2,B]], highlights: [[4,3],[4,4]], label: "先看白棋想往哪裡逃", caption: "先標出白棋的兩個主要出口。若只追著一個方向跑，可能把白棋送到外援附近。" },
        { boardSize: 7, stones: [[3,3,W],[3,4,W],[2,2,B],[2,3,B],[4,2,B],[5,3,B]], emphasis: [[5,3]], highlights: [[4,4]], label: "先封住外側出口", caption: "黑棋先佔外側，目的不是立刻提子，而是縮小白棋有效逃路。這是枷的結構性想法示意。" },
        { boardSize: 7, stones: [[3,3,W],[3,4,W],[2,2,B],[2,3,B],[4,2,B],[5,3,B]], highlights: [[4,4],[3,5]], label: "再讀剩下的抵抗", caption: "封路後仍要檢查白棋能否衝、斷或連到別處；不能只因看起來像枷就宣布成功。" }
      ]
    },
    {
      id: "adv-r03",
      trackId: "reading-tesuji",
      title: "倒撲：先送一子再重算",
      target: "理解「犧牲一子」可能改變對方整串的氣。",
      prompt: "倒撲類手筋為什麼常會先下出一顆看似會被吃的棋？",
      choices: ["誘使對方提子後，整串可能只剩新的最後一氣", "因為被吃的棋會自動復活", "因為任何送子都能增加自己的實地"],
      answer: 0,
      hint: "把『對方提完之後』當成新的局面，再數一次氣。",
      explanation: "倒撲的關鍵不是送子本身，而是送子被提之後改變了氣與提子次序。若對方提完反而只剩一口氣，就可能被立即提回更多棋。",
      takeaway: "看到送子先別判虧；把提子後的盤面當新局面重新數氣。",
      terms: [
        ["倒撲", "先故意送一子，誘使對方提子後再立即提回更多棋的手筋。"],
        ["次序", "同樣的落點若順序不同，氣與可提子的棋串也可能完全不同。"]
      ],
      demoSteps: [
        { boardSize: 5, stones: [[1,1,B],[2,1,W],[3,1,B],[1,2,W],[3,2,W],[2,3,B]], highlights: [[2,2]], label: "先看中央送子點", caption: "中央空點是候選。這一步是否成立不能只看『會不會被吃』，要繼續讀提子後的氣。" },
        { boardSize: 5, stones: [[1,1,B],[2,1,W],[3,1,B],[1,2,W],[3,2,W],[2,3,B],[2,2,B]], emphasis: [[2,2]], label: "黑棋先送進去", caption: "黑棋先進中央，可能立即成為可被提的棋。這一步的目的在製造下一個局面，不是把這顆棋救活。" },
        { boardSize: 5, stones: [[1,1,B],[3,1,B],[1,2,W],[2,2,W],[3,2,W],[2,3,B]], highlights: [[2,1]], reference: [[2,2]], label: "提子後重新數氣", caption: "藍框表示剛被提走的送子位置。對方提完後，要立刻檢查整串是否只剩金色點這一口氣；若不是，就不能硬套倒撲。" }
      ]
    },
    {
      id: "adv-r04",
      trackId: "reading-tesuji",
      title: "對殺先分外氣與公氣",
      target: "在互相包圍時，先把可觀察的氣分類，再讀誰先填哪一口。",
      prompt: "兩串棋互相包圍、準備對殺時，哪一種盤點最有用？",
      choices: ["分別數雙方外氣、公氣，並標示輪到誰走", "只數自己棋子的顆數", "只看哪一串比較靠近中央"],
      answer: 0,
      hint: "兩串共同相鄰的空點，和只屬於其中一方的外氣，作用不完全相同。",
      explanation: "對殺不能只比一個總氣數。外氣、公氣、眼形、提子後新增的氣與先走方都可能改變結果。第一步是把盤面可觀察條件分開。",
      takeaway: "先分類氣，再讀次序；總數相同不代表結果相同。",
      terms: [
        ["對殺", "雙方棋串都尚未安定，彼此競爭誰先吃掉對方的局部戰鬥。"],
        ["外氣", "只鄰接其中一方棋串的氣。"],
        ["公氣", "同時鄰接雙方棋串、雙方都可能需要填的共享空點。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[2,2,B],[2,3,B],[4,2,W],[4,3,W]], highlights: [[1,2],[1,3],[5,2],[5,3],[3,2],[3,3]], label: "先把氣分組", caption: "左右外側是各自的外氣；中間兩點同時靠近雙方棋串，先標成公氣候選，再進一步讀次序。" },
        { boardSize: 7, stones: [[2,2,B],[2,3,B],[4,2,W],[4,3,W]], highlights: [[3,2],[3,3]], emphasis: [[2,2],[2,3],[4,2],[4,3]], label: "公氣不能當普通外氣直接相減", caption: "公氣常牽涉誰先填、填後是否讓對方先提。這張圖只建立分類，不直接宣告哪一方贏。" },
        { boardSize: 7, stones: [[2,2,B],[2,3,B],[4,2,W],[4,3,W]], highlights: [[1,2],[5,2]], label: "最後才比較候選順序", caption: "分類完後，再比較從外氣開始、從公氣開始或先做眼的不同候選。進階讀棋的重點是分支，不是背一條口訣。" }
      ]
    },
    {
      id: "adv-m01",
      trackId: "middle-game",
      title: "打入還是侵消",
      target: "先比較深淺、退路、附近厚弱，再決定進入對方模樣的方式。",
      prompt: "面對對方大模樣時，決定深打還是淺消之前，最該先比較哪組條件？",
      choices: ["模樣深淺、自己的退路、附近雙方厚弱", "哪個點離天元最近", "對手上一手用了幾秒"],
      answer: 0,
      hint: "同一個落點，在附近有厚勢或弱棋時，風險會完全不同。",
      explanation: "打入與侵消不是固定座標題。越深的著手通常要求更可靠的出路與讀棋；附近敵我厚弱會改變可接受風險。",
      takeaway: "先問能不能安全處理，再問能拿多少。",
      terms: [
        ["打入", "較深入對方勢力範圍，企圖在裡面做活、逃出或製造戰鬥。"],
        ["侵消", "較淺地壓縮對方模樣，通常保留更多退路，不一定深入求活。"],
        ["模樣", "可能發展成地但邊界尚未確定的較大勢力範圍。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[1,1,W],[3,1,W],[5,1,W],[5,3,W]], highlights: [[3,3],[3,5]], label: "同一模樣有深淺不同候選", caption: "上方白棋形成模樣示意。靠近內部的候選更深，較外側候選較淺；這不是固定答案。" },
        { boardSize: 7, stones: [[1,1,W],[3,1,W],[5,1,W],[5,3,W],[1,5,B]], highlights: [[3,3],[3,5]], emphasis: [[1,5]], label: "加入己方支援後重新判斷", caption: "左下黑棋提供支援後，原本危險的候選可能變得可行。進階判斷要把全局條件帶回局部。" },
        { boardSize: 7, stones: [[1,1,W],[3,1,W],[5,1,W],[5,3,W],[1,5,B]], highlights: [[2,4],[4,4]], label: "比較退路而非只比較大小", caption: "最後再讀對手封鎖時的退路、連接與做活可能。沒有可靠退路時，不因『看起來很大』就深打。" }
      ]
    },
    {
      id: "adv-m02",
      trackId: "middle-game",
      title: "輕重：不是每顆棋都救",
      target: "把局部棋子的價值和救棋成本分開比較。",
      prompt: "一小串棋被攻，若硬救會讓更大的主力棋一起受攻，應至少加入哪一個候選？",
      choices: ["考慮棄掉小棋，換取主力安定或別處先手", "無條件每顆都救", "只看被攻棋有幾顆"],
      answer: 0,
      hint: "比較『救它要再花幾手』和『放棄後能換到什麼』。",
      explanation: "輕重不是棋子顆數的固定換算。小棋若已完成任務、救援成本高，棄掉可能比把全局拖進被動更合理；但是否值得仍須比較補償。",
      takeaway: "把「棋的價值」和「救棋成本」分開算。",
      terms: [
        ["輕棋", "即使部分被棄，也不會造成整體重大損失，較適合靈活處理的棋。"],
        ["重棋", "一旦受損會牽連大量實地、弱棋或全局結構，通常較難輕易放棄。"],
        ["脫先（手拔）", "不在目前局部立即回應，轉到別處下更重要的一手；前提是能承受對方後續。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[1,1,B],[2,1,B],[3,1,W],[1,2,W],[2,2,W],[5,4,B],[5,5,B]], highlights: [[3,2],[4,5]], label: "局部救棋與全局安定兩個候選", caption: "左上小棋被封，右下主力也有壓力。先把兩個候選都放進比較，不預設『被攻就一定救』。" },
        { boardSize: 7, stones: [[1,1,B],[2,1,B],[3,1,W],[1,2,W],[2,2,W],[5,4,B],[5,5,B],[4,5,B]], emphasis: [[4,5],[5,4],[5,5]], reference: [[1,1],[2,1]], label: "先安定主力的交換示意", caption: "藍框小棋暫時放下，黑先補強右下主力。這只示範候選思路；真正是否值得要比較左上損失與全局收益。" },
        { boardSize: 7, stones: [[1,1,B],[2,1,B],[3,1,W],[1,2,W],[2,2,W],[5,4,B],[5,5,B]], highlights: [[2,3],[4,4]], label: "再檢查對方最嚴厲的後續", caption: "決定脫先前，必須先問對方若立刻處理左上，自己是否能承受。能承受才叫候選，不是逃避局部。" }
      ]
    },
    {
      id: "adv-e01",
      trackId: "endgame-judgment",
      title: "先手、後手與逆先手",
      target: "把『點數大小』和『誰走完後還保有下一手』分開。",
      prompt: "比較兩個官子時，只看局部點數仍不夠，還要檢查什麼？",
      choices: ["走完後對手是否必須回應，以及下一手由誰先走", "哪個點在棋盤右邊", "哪一方棋子顏色較多"],
      answer: 0,
      hint: "同樣 4 目的交換，如果一個走完還能先去別處，價值可能不同。",
      explanation: "官子比較要區分局部差額與行棋權。先手、後手、逆先手等名稱只是整理結果的語言；先讀清楚對手若不回應會失去什麼、是否因此通常需要回應，再談分類。",
      takeaway: "先算局部，再問『走完後輪到誰』。",
      terms: [
        ["先手官子", "若對手不回應會承受較大損失，通常需要回應；自己走完後仍有機會先去別處。"],
        ["後手官子", "走完後通常把行棋權交給對方。"],
        ["逆先手", "若自己不走，對方原本有先手收益；自己搶先阻止時常具有額外價值。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[1,2,B],[1,3,B],[5,2,W],[5,3,W]], highlights: [[2,2],[4,2]], label: "兩個局部大小接近的候選", caption: "先不要只看空點數。兩個候選的真正差別，可能在對手是否必須回應。" },
        { boardSize: 7, stones: [[1,2,B],[1,3,B],[2,2,B],[5,2,W],[5,3,W]], emphasis: [[2,2]], highlights: [[2,3]], label: "候選 A：對手可能必須補", caption: "如果黑走後白不補會有更大損失，A 可能具有先手性質；是否真的必須回應仍要由完整棋形確認。" },
        { boardSize: 7, stones: [[1,2,B],[1,3,B],[5,2,W],[5,3,W],[4,2,B]], emphasis: [[4,2]], label: "候選 B：走完可能交出行棋權", caption: "若白可以不理，B 就更接近後手。進階官子先把『點數』與『行棋權』分開，避免只背名稱。" }
      ]
    },
    {
      id: "adv-e02",
      trackId: "endgame-judgment",
      title: "形勢判斷不是猜輸贏",
      target: "把可數的實地、弱棋風險與未定區域分開。",
      prompt: "準備做形勢判斷時，哪個做法最符合可檢查的流程？",
      choices: ["先估較確定的實地，再標弱棋與未定區域，最後比較候選風險", "只看目前誰的模樣最大", "只看 AI 顯示的單一勝率"],
      answer: 0,
      hint: "先把『比較確定』和『還會變』的部分分開。",
      explanation: "形勢判斷不是把所有未定空間都當成地，也不是用單一 AI 數字取代棋盤觀察。先分實地、模樣、弱棋和未定戰場，才能讓後續候選有可檢查理由。",
      takeaway: "先分確定與未定，再決定要冒多少風險。",
      terms: [
        ["形勢判斷", "在棋局尚未結束時，估計雙方較確定的收益、風險與未定區域，為下一步取捨提供依據。"],
        ["實地", "邊界較清楚、較能直接估算的地。"],
        ["未定區域", "歸屬、死活或邊界仍可能因後續著手大幅改變的部分。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[0,0,B],[1,0,B],[0,1,B],[6,6,W],[5,6,W],[6,5,W],[3,2,B],[3,3,W]], highlights: [[1,1],[5,5],[3,4]], label: "把盤面拆成三種問題", caption: "左上與右下較像可估實地；中央接觸處仍是未定戰場。先分類，不急著把所有空點換成總目數。" },
        { boardSize: 7, stones: [[0,0,B],[1,0,B],[0,1,B],[6,6,W],[5,6,W],[6,5,W],[3,2,B],[3,3,W]], emphasis: [[3,2],[3,3]], label: "弱棋風險不能直接算成固定目數", caption: "中央兩子若仍弱，未來戰鬥可能改變兩邊收益。這類風險應另列，不和已確定實地混成一個虛假精確總分。" },
        { boardSize: 7, stones: [[0,0,B],[1,0,B],[0,1,B],[6,6,W],[5,6,W],[6,5,W],[3,2,B],[3,3,W]], highlights: [[2,3],[4,3]], label: "最後才比較候選的風險報酬", caption: "掌握大致形勢後，再比較穩定候選與高風險候選。AI 估算可以輔助比較，但不能取代規則事實或人的判斷理由。" }
      ]
    },
    {
      id: "adv-r09",
      trackId: "reading-tesuji",
      title: "打吃方向：先看對方往哪裡逃",
      target: "當兩邊都能打吃時，先預測對方延長後的位置，再選較能限制逃跑的方向。",
      candidateId: "capture-semeai-track-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      taskFeatures: {
        capturePattern: "atari_direction",
        atariDirectionGoal: "edge_constraint",
        escapeRoute: "toward_edge",
        connectionThreat: false,
        edgeConstraint: true,
        eyeCondition: "none",
        approachMoveRequired: false,
        terminalCaptureResult: "not_asserted"
      },
      prompt: "同一串棋可以從兩邊打吃時，第一個應該比較什麼？",
      choices: ["對方被打吃後會往哪裡延長，以及延長後是否更受限制", "哪個打吃點離上一手比較近", "哪個打吃點比較靠左"],
      answer: 0,
      hint: "先不要急著選點。各想一次：你從這邊打吃，對方唯一的逃路會在哪裡？",
      explanation: "打吃本身只代表把對方壓到一口氣。若有兩個方向都能打吃，還要比較對方延長後的位置：往邊線、往自己的支援，或往更容易被包圍的方向，後續結果可能不同。這裡先練方向判斷，不把局部方向直接寫成全局最佳手。",
      takeaway: "先預測逃路，再決定從哪一邊打吃。",
      terms: [
        ["打吃方向", "有多個打吃候選時，依對方下一步逃路與後續限制比較落子方向。"],
        ["逃路", "被打吃棋串可以延長、連接或轉身脫離立即危險的方向。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[1,2,W],[1,1,B],[2,2,B]], highlights: [[0,2],[1,3]], label: "同一串棋有兩個打吃候選", caption: "白棋目前有兩口氣。黑棋可以從左邊或下方填一口；先別只看『都能打吃』，要比較留下的唯一逃路。" },
        { boardSize: 7, stones: [[1,2,W],[1,1,B],[2,2,B],[1,3,B]], highlights: [[0,2]], label: "從下方打吃，白棋只剩邊線方向", caption: "黑棋填下方後，白棋只剩左邊一口氣。這個示意只說明『方向會改變逃路』，不宣稱黑棋已經一定能吃掉白棋。" },
        { boardSize: 7, stones: [[1,2,W],[0,2,W],[1,1,B],[2,2,B],[1,3,B]], highlights: [[0,1],[0,3]], label: "對方延長後要重新數氣", caption: "白棋沿邊延長後又得到新的氣。下一步仍要重新讀棋；正確方向不能靠一句口訣代替後續計算。" }
      ]
    },
    {
      id: "adv-r10",
      trackId: "reading-tesuji",
      title: "打吃方向：先堵住連接路",
      target: "打吃前先看對方能否順著唯一逃路連到同伴，避免把弱棋趕去接應。",
      candidateId: "capture-semeai-track-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      taskFeatures: {
        capturePattern: "atari_direction",
        atariDirectionGoal: "prevent_connection",
        escapeRoute: "forced_away_from_connection",
        connectionThreat: true,
        edgeConstraint: false,
        eyeCondition: "none",
        approachMoveRequired: false,
        terminalCaptureResult: "not_asserted"
      },
      prompt: "對方弱棋旁邊有同伴可以接應時，選打吃方向前最重要的檢查是什麼？",
      choices: ["哪個方向會堵住連接點，避免把弱棋趕去和同伴連上", "哪個方向能讓自己立刻多一顆棋", "哪個方向最接近棋盤中央"],
      answer: 0,
      hint: "把對方下一手延長真的下在腦中：那一手會不會順便和旁邊的棋連成一串？",
      explanation: "同樣是打吃，留下的唯一一口氣可能正好是對方的連接點。若把弱棋往同伴方向趕，對方一手延長就可能同時連接並增加更多氣。先辨認連接威脅，再比較打吃方向。",
      takeaway: "不要只看這一手有沒有打吃；還要看對方逃一步後會不會連上。",
      terms: [
        ["連接威脅", "對方延長時可能同時和另一串棋連成一串，讓原本的追擊失去效果。"],
        ["切斷", "佔住或控制兩串棋之間的重要連接點，使它們不能直接成為同一串。"]
      ],
      demoSteps: [
        { boardSize: 7, stones: [[2,2,W],[4,2,W],[1,2,B],[2,1,B]], highlights: [[3,2],[2,3]], reference: [[4,2]], label: "先找哪一口氣也是連接路", caption: "左邊白棋有兩口氣；右邊還有一顆白棋。若白下一手走到兩者中間，就會把兩邊連起來。" },
        { boardSize: 7, stones: [[2,2,W],[4,2,W],[1,2,B],[2,1,B],[2,3,B]], highlights: [[3,2]], reference: [[4,2]], label: "錯的方向可能把白棋趕去接應", caption: "黑從下方打吃後，白棋唯一逃路正好是兩串之間。白若走到那裡，就會和右邊同伴連接。" },
        { boardSize: 7, stones: [[2,2,W],[4,2,W],[1,2,B],[2,1,B],[3,2,B]], highlights: [[2,3]], reference: [[4,2]], label: "先堵連接點，再迫使往另一邊逃", caption: "黑先佔兩串之間的連接點，同時形成打吃，白棋只剩往下延長。這仍是局部教學目標；後續能否吃到要繼續讀。" }
      ]
    },
    {
      id: "adv-r11",
      trackId: "reading-tesuji",
      title: "雙打吃：一手同時逼兩串棋",
      target: "辨認雙打吃的棋盤條件：同一手落下後，兩串彼此分開的對方棋都只剩一口氣。",
      candidateId: "capture-patterns-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      sourceReviewId: "capture-pattern-concept-anchors-v1",
      taskFeatures: {
        capturePattern: "double_atari",
        simultaneousAtariTargets: 2,
        targetsSeparate: true,
        immediateCaptureCount: 0,
        terminalCaptureResult: "not_asserted"
      },
      prompt: "哪一個條件才是這題要練的「雙打吃」？",
      choices: ["同一手下完後，兩串彼此分開的白棋都只剩一口氣", "同一手直接提掉兩串白棋", "連續兩手分別去打吃兩串白棋"],
      answer: 0,
      hint: "先看『一手』和『兩串棋』：這手落下後，兩邊是不是同時只剩最後一口氣？",
      explanation: "雙打吃的核心是同一手同時讓兩串彼此分開的對方棋進入打吃。它不等於一手直接提掉兩串，也不是連續兩手各打一邊。在這個局部示意裡，白棋通常只能先處理其中一邊；實戰若有反提、劫、連接或更大的反擊，仍要另外讀，不能把『雙打吃』當成無條件必得其一。",
      takeaway: "先確認：一手落下，兩串分開的棋是否同時只剩一氣。",
      terms: [
        ["雙打吃", "同一手同時讓兩串彼此分開的對方棋各只剩一口氣。"],
        ["一口氣", "一串棋只剩最後一個相鄰空點；對方下一手若能合法填掉，就可能被提走。"]
      ],
      demoSteps: [
        { boardSize: 5, stones: [[1,1,B],[2,0,B],[3,3,B],[2,4,B],[2,1,W],[2,3,W]], highlights: [[2,2]], label: "先找同時碰到兩串白棋的點", caption: "上下兩顆白棋彼此不相連，而且目前各有兩口氣。中央空點同時鄰接兩串白棋。" },
        { boardSize: 5, stones: [[1,1,B],[2,0,B],[3,3,B],[2,4,B],[2,1,W],[2,3,W],[2,2,B]], highlights: [[3,1],[1,3]], label: "黑下中央後，兩串白棋同時只剩一氣", caption: "黑棋下在中央沒有立即提子，但上下兩串白棋分別只剩右上與左下最後一口氣；這就是本題的雙打吃。" },
        { boardSize: 5, stones: [[1,1,B],[2,0,B],[3,3,B],[2,4,B],[2,1,W],[3,1,W],[2,2,B],[1,3,B]], emphasis: [[2,1],[3,1]], label: "白先救一邊，另一邊仍可能被提走", caption: "白棋先往右延長救上方，黑棋再填左下最後一氣，提掉下方白子。這只驗證此局部示意；遇到反提、劫或外援時仍要重新讀。" }
      ]
    },
    {
      id: "adv-r12",
      trackId: "reading-tesuji",
      title: "包圍吃子：先斷援兵，再追最後一氣",
      target: "對方一口氣能連到援兵時，先切斷連接，再確認它延長後是否仍只有一口氣。",
      candidateId: "capture-patterns-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      sourceReviewId: "capture-pattern-concept-anchors-v1",
      taskFeatures: {
        capturePattern: "enclosure_capture",
        sourceTermCandidates: ["門吃", "抱吃"],
        sourceLabelSplit: "unknown",
        connectionCut: true,
        targetLibertiesBefore: 2,
        targetLibertiesAfterCut: 1,
        forcedExtensionRemainsAtari: true,
        nextMoveCapturesTarget: true,
        terminalCaptureResult: "bounded_local_capture"
      },
      prompt: "對方弱棋有兩口氣，其中一口正好能和援兵連上。哪一種讀法最可靠？",
      choices: ["先佔住連接點形成打吃，再確認它延長後是否仍只有一口氣", "只要靠近邊線就直接判定一定能吃", "先追著另一口氣走，不必檢查它能不能和援兵連上"],
      answer: 0,
      hint: "先找哪一口氣同時也是『連接點』。切斷後，再真的把對方延長一步，重新數氣。",
      explanation: "有些中文入門教材會把相近棋形分成「門吃」與「抱吃」。這裡先不要求背名稱，只練兩者共同可驗證的結構：先切斷援兵，讓目標棋進入打吃；對方延長後若仍只有一口氣，下一手才有局部提子的依據。若延長後變成兩口以上，就不能硬套這個手段。",
      takeaway: "先斷連接，再讓對方逃一步；逃完仍一氣，追擊才真的成立。",
      terms: [
        ["包圍吃子", "本課先用這個中性名稱練共同機制：切斷援兵後，讓對方延長仍不能增加到兩口以上的氣。"],
        ["門吃／抱吃", "中文入門教材常用的相近吃子名稱；本課暫不把兩個名稱當成兩種獨立能力。"]
      ],
      demoSteps: [
        { boardSize: 6, stones: [[0,1,B],[1,2,B],[2,0,B],[2,2,B],[1,1,W],[2,1,W],[4,1,W]], highlights: [[3,1],[1,0]], reference: [[4,1]], label: "先找連接點與另一口氣", caption: "左邊兩顆白棋只有兩口氣：右邊的空點能接到白色援兵，上邊的空點是另一條逃路。先分清這兩口氣的作用。" },
        { boardSize: 6, stones: [[0,1,B],[1,2,B],[2,0,B],[2,2,B],[1,1,W],[2,1,W],[4,1,W],[3,1,B]], highlights: [[1,0]], reference: [[4,1]], label: "黑先佔連接點，白棋只剩最後一氣", caption: "黑棋先切斷白棋與右邊援兵，同時形成打吃。現在白棋只能往上延長。" },
        { boardSize: 6, stones: [[0,1,B],[1,2,B],[2,0,B],[2,2,B],[1,1,W],[2,1,W],[4,1,W],[3,1,B],[1,0,W]], highlights: [[0,0]], label: "白延長後仍只有一口氣", caption: "白棋真的逃一步後，整串三顆白棋仍只剩左上角這一口氣。這一步重算是關鍵，不能只靠名稱判斷。" },
        { boardSize: 6, stones: [[0,1,B],[1,2,B],[2,0,B],[2,2,B],[4,1,W],[3,1,B],[0,0,B]], emphasis: [[0,0]], label: "黑填最後一氣，局部提掉三子", caption: "黑棋填掉最後一氣後，左邊三顆白棋被提走。這只證明這個原創局部手順成立，不代表所有相似外形都一定能吃。" }
      ]
    },
    {
      id: "adv-r13",
      trackId: "reading-tesuji",
      title: "對殺：有眼也要重新算",
      target: "把眼形放回外氣、公氣與行棋次序一起判斷，不把「有眼」當成自動勝負。",
      candidateId: "semeai-liberty-structure-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      sourceReviewId: "mwa-module-a-content-gap-v1",
      taskFeatures: {
        semeaiMechanism: "eye_shared_liberty_interaction",
        eyeCondition: "contrast_one_eye_vs_no_eye",
        sharedLibertiesRequired: true,
        universalProverbRule: false,
        terminalResult: "bounded_fixture_only"
      },
      prompt: "對殺時，你有一眼、對方沒有眼。下一步最可靠的判斷方式是什麼？",
      choices: ["仍要把外氣、公氣、眼形和輪到誰走一起重算", "只要有一眼就直接判定自己一定贏", "只比較雙方棋子顆數"],
      answer: 0,
      hint: "眼形會改變對殺結構，但它不是脫離氣與次序的獨立勝負開關。",
      explanation: "「一眼對無眼」可以是很有用的觀察線索，但不能直接當成通用的勝負判定規則。本專案用兩個原創、範圍受限的局面做反證：同樣是一眼對無眼，在不同公氣與氣形下可以得到不同局部結果。因此要回到實際盤面，把眼形、外氣、公氣和先後手一起讀。",
      takeaway: "眼形是條件，不是自動答案；對殺仍要逐手重算。",
      terms: [
        ["對殺結構", "雙方外氣、公氣、眼形、先後手與增氣手段共同形成的局部手數關係。"],
        ["公氣", "同時鄰接雙方相關棋串的共享空點；不能和普通外氣完全等同處理。"]
      ],
      demoSteps: [
        { boardSize: 4, stones: [[1,0,B],[0,1,B],[1,1,B],[2,1,W],[1,3,B]], highlights: [[0,0],[2,0]], label: "有一眼，但先看共享空點", caption: "左上黑棋有一個封閉眼位；黑白仍共享右上附近的關鍵氣。這個局部例子中，即使白先，黑仍可在這個局部讀法下先取得提子結果。" },
        { boardSize: 4, stones: [[1,1,W],[0,2,B],[1,2,B],[1,3,B],[2,3,W]], highlights: [[0,1]], label: "同樣一眼對無眼，結果可以不同", caption: "這個反例中黑也有一眼、白沒有眼，但公氣與外氣配置不同；在同一個局部讀法下，白先可以取得提子結果。" },
        { boardSize: 4, stones: [[1,1,W],[0,2,B],[1,2,B],[1,3,B],[2,3,W]], emphasis: [[0,2],[1,2],[1,3]], label: "不要把口訣升格成勝負規則", caption: "看到眼形後，下一步仍是數外氣、公氣並讀先後手；本題只建立這個判斷習慣，不宣稱完整對殺已被一般化解決。" }
      ]
    },
    {
      id: "adv-r14",
      trackId: "reading-tesuji",
      title: "對殺：有時先增自己的氣",
      target: "比較「直接緊對方氣」與「先讓自己增加氣」兩個候選的局部後果。",
      candidateId: "semeai-liberty-structure-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      sourceReviewId: "mwa-module-a-content-gap-v1",
      taskFeatures: {
        semeaiMechanism: "increase_own_liberties",
        directAttackContrast: true,
        terminalResult: "bounded_fixture_only",
        universalRule: false
      },
      prompt: "自己只有兩口氣、對方有三口氣時，最不該漏掉哪一種候選？",
      choices: ["先找能增加自己氣的合法手，再和直接緊對方氣比較", "一定只能先填掉對方一口氣", "直接看誰的棋子比較多"],
      answer: 0,
      hint: "對殺不只是在減少對方的氣；一手若能讓自己的棋串多出幾口氣，手數關係也會改變。",
      explanation: "原創局面中，黑起初兩氣、白三氣。黑若只緊白的一口氣，白可在這個局部讀法中先得結果；黑若先延長使自己的棋串增加到四氣，局部結果反而改變。這不是「永遠先增氣」的新口訣，而是要求候選手同時包含『增己氣』與『減敵氣』。",
      takeaway: "對殺候選不只找減氣手，也要找增氣手；兩種都走完再比較。",
      terms: [
        ["增氣", "一手落下後，讓自己的相關棋串取得更多可用氣。"],
        ["候選比較", "把兩種合理下法各自走到可判定結果，而不是先用口訣排除其中一種。"]
      ],
      demoSteps: [
        { boardSize: 4, stones: [[0,0,W],[1,0,W],[2,0,B],[1,1,B],[3,1,W],[0,2,W],[0,3,B],[1,3,B],[2,3,W]], highlights: [[2,1],[3,0]], label: "黑有兩個候選", caption: "黑上方棋串只有兩口氣，右側白棋有三口氣。金色兩點分別代表『先增自己的氣』與『直接緊白棋』兩種候選。" },
        { boardSize: 4, stones: [[0,0,W],[1,0,W],[2,0,B],[1,1,B],[2,1,B],[3,1,W],[0,2,W],[0,3,B],[1,3,B],[2,3,W]], emphasis: [[2,1]], label: "先延長後，黑棋增加到四氣", caption: "黑下中間後和原棋連成一串，局部可用氣增加。把後續走完後，這條線由黑先取得局部提子結果。" },
        { boardSize: 4, stones: [[0,0,W],[1,0,W],[2,0,B],[3,0,B],[1,1,B],[3,1,W],[0,2,W],[0,3,B],[1,3,B],[2,3,W]], emphasis: [[3,0]], label: "只緊白棋不一定較快", caption: "另一候選直接填白棋的氣，但沒有改善黑棋自身手數；把同一局部後續走完後，這條線由白先取得提子結果。" }
      ]
    },
    {
      id: "adv-r15",
      trackId: "reading-tesuji",
      title: "送子前先問：它改變了什麼？",
      target: "把倒撲中的送子機制抽象成可遷移檢查：被提後是否真的改變氣、眼形或提子次序。",
      candidateId: "throw-in-transfer-v1",
      candidateStatus: "teaching_candidate",
      kcStatus: "not_promoted",
      sourceReviewId: "mwa-module-a-content-gap-v1",
      taskFeatures: {
        mechanism: "sacrificial_insertion",
        sourceContexts: ["snapback","semeai_liberty_change"],
        falseEyeContextStatus: "research_candidate_not_promoted",
        negativeCaseRequired: true,
        terminalResult: "bounded_fixture_only"
      },
      prompt: "看到一手棋可以故意送給對方吃，什麼條件最重要？",
      choices: ["對方提掉後，盤面的氣、眼形或提子次序要出現可利用的改變", "只要棋子會被吃就算好手筋", "送得越多顆越有效"],
      answer: 0,
      hint: "把對方提子後的盤面當成新局面；如果什麼重要結構都沒變，那通常只是白送。",
      explanation: "倒撲已經教過『故意送一子 → 對方提子 → 重新數氣』。這裡把它抽象成更一般的送子檢查：犧牲本身不是價值，價值來自提子後改變的局面。本輪先用對殺減氣的正例與「提完氣數沒變」的反例檢查；破假眼用途仍停在研究階段，不因教材出現名稱就直接變成可評分題。",
      takeaway: "送子不是目的；對方提完後出現可利用的結構改變，才值得繼續讀。",
      terms: [
        ["送子", "故意讓一顆棋處在可被提的位置，希望藉由提子後的局面改變取得後續利益。"],
        ["結構改變", "提子後的氣、眼形、連接或再提次序出現可驗證差異；若沒有差異，就不能只靠名稱判定手筋成立。"]
      ],
      demoSteps: [
        { boardSize: 4, stones: [[0,0,B],[2,0,W],[3,0,W],[1,1,B],[2,1,W],[3,1,W],[0,2,B],[2,2,W],[3,2,W],[1,3,B]], highlights: [[3,3]], label: "先送一子", caption: "黑可在右下投入一子；它本身會被白棋提掉。先不要因為『會被吃』就判斷好壞。" },
        { boardSize: 4, stones: [[0,0,B],[2,0,W],[3,0,W],[1,1,B],[2,1,W],[3,1,W],[0,2,B],[2,2,W],[3,2,W],[1,3,B],[3,3,B]], highlights: [[2,3]], label: "白若提掉送子，再重算白串的氣", caption: "在這個局部例子中，白從左邊提掉送子後，目標白串的可用氣由四口降成三口；這才是送子的局部作用。" },
        { boardSize: 4, stones: [[0,1,W],[2,1,W],[3,1,B],[2,2,W],[0,3,B]], highlights: [[0,0],[1,0]], label: "反例：被提不代表有用", caption: "另一個原創局面也能送一子並被提，但提完後目標棋串仍維持原本三口氣。若沒有其他可利用改變，就不能把『送子』本身當成成功。" }
      ]
    }
  ];

  const sequenceExperiences = [
    {
      id: "adv-seq-snapback-01",
      version: 1,
      familyId: "snapback",
      variantId: "seed",
      variationAxes: ["baseline"],
      trackId: "reading-tesuji",
      title: "倒撲實走：送一子後重新數氣",
      target: "不用選項，實際走完「我一手 → 對手應手 → 我再一手」的兩段讀棋。",
      boardSize: 5,
      playerColor: B,
      setupStones: [[0,1,W],[1,2,W],[1,3,B],[0,4,W],[1,4,B]],
      decisions: [
        {
          id: "sacrifice",
          prompt: "黑先。第一手下哪裡，能故意送一子，讓白提完後產生新的最後一氣？",
          acceptedMoves: [[0,2]],
          expectedLearnerCapturedCount: 0,
          hint: "看左邊邊線：先找一個下完後只剩一口氣、但仍然合法的黑棋落點。",
          success: "第一手成立。這顆黑棋可以被提，但目的正是讓白棋改變氣的結構。",
          opponentMove: [0,3],
          expectedOpponentCapturedCount: 1,
          opponentText: "白棋依題目中的局部應手，在下方提掉剛才的黑棋。現在不要停，重新數白棋整串的氣。"
        },
        {
          id: "recapture",
          prompt: "白棋提掉送子後，黑下一手在哪裡可以立即提回更多白棋？",
          acceptedMoves: [[0,2]],
          expectedLearnerCapturedCount: 2,
          hint: "回到剛才送子的位置，檢查現在落下去會提掉哪些白棋。",
          success: "讀完了：黑回到原點，這次會提掉兩顆白棋。重點不是記座標，而是能在提子後重新建立局面並再數氣。"
        }
      ],
      takeaway: "多手讀棋要在每次提子後重新建盤；不能沿用上一個局面的氣數。",
      terms: [
        ["倒撲", "先送一子，誘使對方提子後，再利用新的氣形提回更多棋。"],
        ["重建局面", "每走一手、尤其發生提子後，把盤面當成新的狀態重新數氣與檢查合法手。"]
      ]
    },
    {
      id: "adv-seq-snapback-02",
      version: 1,
      familyId: "snapback",
      variantId: "capture-three",
      variationAxes: ["capture-count", "local-shape"],
      trackId: "reading-tesuji",
      title: "倒撲變形：這次提回三子",
      target: "局部形狀改變後仍從提子結果重建局面，而不是記上一題的棋子數。",
      boardSize: 5,
      playerColor: B,
      setupStones: [[1,2,W],[1,3,B],[1,4,W],[0,1,W],[0,4,W],[2,4,B]],
      decisions: [
        {
          id: "sacrifice",
          prompt: "黑先。哪一手可以先送進去，讓白提完後暴露更大的回提？",
          acceptedMoves: [[0,2]],
          expectedLearnerCapturedCount: 0,
          hint: "仍然看左邊邊線，但不要套用上一題的白棋顆數；先讀提子後的盤面。",
          success: "黑棋先送進去，這顆棋本身會被提。",
          opponentMove: [0,3],
          expectedOpponentCapturedCount: 1,
          opponentText: "白棋提掉送子後，左下白棋連成新的低氣棋串；現在重新數氣。"
        },
        {
          id: "recapture",
          prompt: "黑下一手在哪裡可以回提？這次實際會提掉幾顆白棋？",
          acceptedMoves: [[0,2]],
          expectedLearnerCapturedCount: 3,
          hint: "回到送子點前，先確認左下三顆白棋是否已連成同一個無氣棋串。",
          success: "黑回到送子點，規則引擎實際提掉三顆白棋。"
        }
      ],
      expectedFinalEmpty: [[0,3],[0,4],[1,4]],
      takeaway: "倒撲的核心不是固定『提回兩子』；提子後要重新辨認棋串與最後一氣。",
      terms: [
        ["倒撲", "先送一子，讓對方提子改變氣形，再回到關鍵點提回更多棋。"],
        ["棋串", "彼此正交相連、共同分享氣的一組同色棋。"]
      ]
    },
    {
      id: "adv-seq-net-01",
      version: 1,
      familyId: "net",
      variantId: "seed",
      variationAxes: ["baseline"],
      trackId: "reading-tesuji",
      title: "枷實走：不打吃也能封住兩個出口",
      target: "先下不直接打吃的封鎖手，再讀對手兩個逃路都會被提。",
      boardSize: 5,
      playerColor: B,
      setupStones: [[1,1,B],[2,1,B],[0,2,B],[2,2,W],[3,2,B],[3,3,B],[2,4,B]],
      trackedPoint: [2,2],
      trackedColor: W,
      decisions: [
        {
          id: "net",
          prompt: "黑先。哪一手不是直接打吃，卻能把中央白棋兩個出口一起罩住？",
          acceptedMoves: [[1,3]],
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 2,
          hint: "白棋目前有左邊與下方兩個出口；找一手能同時控制兩邊、又不必貼著白棋下。",
          success: "這是枷的封鎖手：白棋仍有兩口氣，所以不是打吃；接下來要真的驗證每個逃路。",
          opponentMove: [1,2],
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 1,
          opponentText: "先驗證左邊逃路：白棋向左延長後，整串只剩下方一口氣。"
        },
        {
          id: "close-net",
          prompt: "白棋走左邊逃路後，黑下一手在哪裡可以把整串提掉？",
          acceptedMoves: [[2,3]],
          expectedLearnerCapturedCount: 2,
          hint: "重新數白棋的最後一口氣；現在不需要再猜枷的形狀。",
          success: "黑補上下方最後一氣，提掉兩顆白棋。枷成立是因為逃路被封，不是因為第一手本身打吃。"
        }
      ],
      verificationBranches: [
        {
          afterDecisionIndex: 0,
          opponentMove: [2,3],
          expectedOpponentCapturedCount: 0,
          learnerReply: [1,2],
          expectedLearnerCapturedCount: 2
        }
      ],
      expectedFinalEmpty: [[1,2],[2,2]],
      takeaway: "枷要驗兩邊：第一手不必打吃，但對方每個主要逃路都要能被下一手收住。",
      terms: [
        ["枷", "不靠連續貼身打吃，而用封鎖位置限制對方逃路的手筋。"],
        ["分支驗證", "不只驗一條示範路線；另一個主要逃路也必須得到一致結果。"]
      ]
    },
    {
      id: "adv-seq-net-02",
      version: 1,
      familyId: "net",
      variantId: "new-escape-geometry",
      variationAxes: ["escape-geometry", "local-shape"],
      trackId: "reading-tesuji",
      title: "枷變形：出口換位置也要兩邊驗",
      target: "換一組局部支援與出口後，仍先找不打吃的封鎖手，再驗兩個逃路。",
      boardSize: 5,
      playerColor: B,
      setupStones: [[3,3,W],[3,4,B],[3,1,B],[4,3,B],[4,2,B],[2,2,B],[1,3,B]],
      trackedPoint: [3,3],
      trackedColor: W,
      decisions: [
        {
          id: "net",
          prompt: "黑先。哪一手不直接打吃，卻能把右下白棋的上方與左方出口一起罩住？",
          acceptedMoves: [[2,4]],
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 2,
          hint: "白棋目前的兩個出口在左邊與上方；找一個位於左下、能同時封住後續逃路的黑點。",
          success: "封鎖手成立，但白棋仍有兩口氣；現在必須真的測逃路。",
          opponentMove: [2,3],
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 1,
          opponentText: "白棋先往左延長，整串只剩上方一口氣。"
        },
        {
          id: "close-net",
          prompt: "白棋往左逃後，黑下一手在哪裡可以提掉整串？",
          acceptedMoves: [[3,2]],
          expectedLearnerCapturedCount: 2,
          hint: "重新數延長後的白串，不要沿用原本兩口氣。",
          success: "黑補掉上方最後一氣，提掉兩顆白棋。"
        }
      ],
      verificationBranches: [
        {
          afterDecisionIndex: 0,
          opponentMove: [3,2],
          expectedOpponentCapturedCount: 0,
          learnerReply: [2,3],
          expectedLearnerCapturedCount: 2
        }
      ],
      expectedFinalEmpty: [[2,3],[3,3]],
      takeaway: "出口位置變了，枷的檢查仍相同：封鎖手本身不必打吃，但兩個主要逃路都必須被後續收住。",
      terms: [
        ["枷", "利用空間與支援封住逃路，而非只靠連續打吃。"],
        ["出口", "弱棋可以延長、連接或衝出的主要空點。"]
      ]
    },
    {
      id: "adv-seq-semeai-01",
      version: 2,
      familyId: "semeai",
      variantId: "seed",
      variationAxes: ["baseline"],
      trackId: "reading-tesuji",
      title: "對殺實走：先壓一口氣，再重算雙方最後一氣",
      target: "把雙方氣數與行棋次序帶進同一條可驗證的三手交換。",
      boardSize: 5,
      playerColor: B,
      setupStones: [[1,1,B],[3,1,W],[4,1,B],[1,2,W],[2,2,B],[3,2,W],[4,2,B],[3,3,B]],
      trackedPoint: [3,2],
      trackedColor: W,
      decisions: [
        {
          id: "reduce",
          prompt: "黑先。白棋右上這串目前有兩口關鍵氣；黑先填哪一口，能迫使白棋只剩另一口延長？",
          acceptedMoves: [[3,0]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          hint: "先只數白棋右上的兩口氣：上方與左上方。找能直接壓到一口氣的黑手。",
          success: "黑填上方後，白棋只剩左上方一口氣；這一步沒有提子，但已改變對殺次序。",
          opponentMove: [2,1],
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 1,
          opponentText: "白棋延長到左上方。現在白串仍只有一口氣；同時中央黑棋也只剩自己的最後一口氣，所以必須算清楚下一手。"
        },
        {
          id: "finish-race",
          prompt: "輪到黑。在哪裡補掉白棋最後一氣，可以先提掉白串？",
          acceptedMoves: [[2,0]],
          expectedLearnerCapturedCount: 3,
          hint: "白棋剛延長後，沿著上邊重新找整串唯一的空交叉點。",
          success: "黑先補掉白棋最後一氣，提掉三顆白棋。這個結果依賴『黑先』與目前氣形，不能抽成所有對殺的固定口訣。"
        }
      ],
      expectedFinalEmpty: [[2,1],[3,1],[3,2]],
      takeaway: "對殺先把氣與輪到誰走寫清楚；每一手後都要重新數，不能只比較起始總氣數。",
      terms: [
        ["對殺", "雙方未安定棋串互相競爭，誰能先填掉對方最後一氣。"],
        ["行棋次序", "同一組氣數，輪到誰先走可能直接改變提子順序與結果。"]
      ]
    },
    {
      id: "adv-seq-semeai-02",
      version: 1,
      familyId: "semeai",
      variantId: "white-to-move",
      variationAxes: ["player-color", "role-reversal"],
      trackId: "reading-tesuji",
      title: "對殺變形：換成白先也要重新算",
      target: "棋形角色對調後，不依賴『黑棋永遠是學習者』，仍從氣與輪到誰走判斷。",
      boardSize: 5,
      playerColor: W,
      setupStones: [[1,1,W],[3,1,B],[4,1,W],[1,2,B],[2,2,W],[3,2,B],[4,2,W],[3,3,W]],
      trackedPoint: [3,2],
      trackedColor: B,
      decisions: [
        {
          id: "reduce",
          prompt: "白先。黑棋右上這串目前有兩口關鍵氣；白先填哪一口，能把黑棋壓成一口氣？",
          acceptedMoves: [[3,0]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          hint: "先忘掉上一題的顏色，直接數右上黑串的兩口氣。",
          success: "白填上方後，黑串只剩左上方一口氣。",
          opponentMove: [2,1],
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 1,
          opponentText: "黑棋延長後仍只剩最後一口氣；現在輪到白重新算。"
        },
        {
          id: "finish-race",
          prompt: "輪到白。在哪裡補掉黑棋最後一氣，可以先提掉黑串？",
          acceptedMoves: [[2,0]],
          expectedLearnerCapturedCount: 3,
          hint: "只看目前盤面；沿上邊找黑串唯一剩下的氣。",
          success: "白先補最後一氣，規則引擎提掉三顆黑棋。"
        }
      ],
      expectedFinalEmpty: [[2,1],[3,1],[3,2]],
      takeaway: "對殺判斷不能綁定棋色；角色交換後仍要用當下氣數與先後手重算。",
      terms: [
        ["對殺", "雙方弱棋彼此競爭，先填掉對方最後一氣的一方取得局部結果。"],
        ["角色交換", "把攻守或黑白角色互換，檢查是否真的理解條件，而非記顏色或座標。"]
      ]
    },
    {
      id: "adv-seq-ladder-01",
      version: 2,
      familyId: "ladder",
      variantId: "seed",
      variationAxes: ["baseline"],
      trackId: "reading-tesuji",
      title: "征子實走：每次都把逃棋壓回一口氣",
      target: "在沒有引征干擾的局部，連續走出強制打吃，確認對手每次只有唯一延長，直到邊線提子。",
      boardSize: 7,
      playerColor: B,
      setupStones: [[2,2,W],[2,3,W],[1,2,B],[2,1,B],[1,3,B],[2,4,B]],
      trackedPoint: [2,2],
      trackedColor: W,
      decisions: [
        {
          id: "ladder-1",
          prompt: "黑先。白棋目前有兩口氣；第一手從哪裡開始，能把白棋壓成只剩唯一延長？",
          acceptedMoves: [[3,2]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          opponentMove: [3,3],
          opponentMoveMustBeUniqueLiberty: true,
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 2,
          hint: "先數白棋右側與右下方的兩口氣；征子每個攻擊手都要把它壓回一口氣。",
          success: "第一個打吃成立；白棋只剩右下方唯一延長。",
          opponentText: "白棋只能沿唯一一口氣延長。延長後又有兩口氣，黑必須繼續選正確方向。"
        },
        {
          id: "ladder-2",
          prompt: "第二次打吃要下在哪裡，才能讓白棋再次只剩唯一出口？",
          acceptedMoves: [[4,3]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          opponentMove: [3,4],
          opponentMoveMustBeUniqueLiberty: true,
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 2,
          hint: "不要照固定方向連下；每次都重新找整串目前的兩口氣。",
          success: "第二個打吃成立，白棋再次只有唯一延長。",
          opponentText: "白棋延長後，路線開始折向右下；黑仍要保持『兩口變一口』。"
        },
        {
          id: "ladder-3",
          prompt: "第三次，哪一手能維持征子的強制性？",
          acceptedMoves: [[3,5]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          opponentMove: [4,4],
          opponentMoveMustBeUniqueLiberty: true,
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 2,
          hint: "看目前兩口氣，不看上一手方向；其中一點下完後會讓白棋只剩另一點。",
          success: "第三個打吃仍維持唯一逃路。",
          opponentText: "白棋只能再延長。若路線上有白棋接應，這裡之後可能改變；本題目前沒有引征。"
        },
        {
          id: "ladder-4",
          prompt: "第四次，繼續把白棋壓成一口氣。",
          acceptedMoves: [[5,4]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          opponentMove: [4,5],
          opponentMoveMustBeUniqueLiberty: true,
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 2,
          hint: "重新數白棋整串：找能填掉其中一口、又不讓它變成三口氣的手。",
          success: "第四個打吃成立。",
          opponentText: "白棋再次唯一延長；征子不是口訣，是每一步都可重算的強制序列。"
        },
        {
          id: "ladder-5",
          prompt: "第五次，哪裡是正確的打吃方向？",
          acceptedMoves: [[4,6]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          opponentMove: [5,5],
          opponentMoveMustBeUniqueLiberty: true,
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 2,
          hint: "接近下邊線後仍先數氣；不要因快到邊線就跳過合法性。",
          success: "第五個打吃成立，白棋繼續被迫往右下延長。",
          opponentText: "白棋延長後仍有兩口氣，但空間已接近棋盤邊界。"
        },
        {
          id: "ladder-6",
          prompt: "第六次，先把兩口氣壓成一口。",
          acceptedMoves: [[6,5]],
          expectedTrackedLibertiesBeforeLearner: 2,
          expectedLearnerCapturedCount: 0,
          expectedTrackedLibertiesAfterLearner: 1,
          opponentMove: [5,6],
          opponentMoveMustBeUniqueLiberty: true,
          expectedOpponentCapturedCount: 0,
          expectedTrackedLibertiesAfterOpponent: 1,
          hint: "邊線會減少可用方向；確認白棋被打吃後唯一延長是哪一點。",
          success: "第六個打吃成立。",
          opponentText: "白棋被迫延長到下邊線；延長後仍只有最後一口氣，所以黑下一手可直接提。"
        },
        {
          id: "ladder-finish",
          prompt: "最後，在哪裡補掉白棋唯一一口氣，完成征子？",
          acceptedMoves: [[6,6]],
          expectedTrackedLibertiesBeforeLearner: 1,
          expectedLearnerCapturedCount: 8,
          hint: "現在不需要再找方向：整串白棋只剩右下角這一口氣。",
          success: "征子完成：黑提掉整串八顆白棋。這個結論只對本題沒有引征干擾的局部成立。"
        }
      ],
      expectedFinalEmpty: [[2,2],[2,3],[3,3],[3,4],[4,4],[4,5],[5,5],[5,6]],
      takeaway: "征子要逐手維持『打吃 → 對手唯一延長 → 再打吃』；任何一步若讓對方多出第三口氣或接上引征，都要停止重算。",
      terms: [
        ["征子", "用連續打吃把一串棋沿斜向追趕，讓對方每次只能延長，最後在邊線或角落被提。"],
        ["引征", "位在征子路線上的接應棋；一旦逃棋能連上或產生反擊，原本成立的征子可能失效。"],
        ["強制序列", "每一步都把對手限制到唯一能維持該目標的應手；不是只背一串座標。"]
      ]
    },
    {
      id: "adv-seq-ladder-02",
      version: 1,
      familyId: "ladder",
      variantId: "eight-by-eight-longer",
      variationAxes: ["board-size", "path-length", "edge-distance"],
      trackId: "reading-tesuji",
      title: "征子變形：路線拉長後仍逐手驗證",
      target: "把同一強制條件帶到 8×8、更長的追逐路線；不能靠記住 7×7 的終點。",
      boardSize: 8,
      playerColor: B,
      setupStones: [[2,2,W],[2,3,W],[1,2,B],[2,1,B],[1,3,B],[2,4,B]],
      trackedPoint: [2,2],
      trackedColor: W,
      decisions: [
        {
          id: "ladder-1", prompt: "黑先。第一個打吃在哪裡？", acceptedMoves: [[3,2]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [3,3], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "仍從兩口氣中選一口，讓白棋只剩唯一延長。", success: "第一個打吃成立。", opponentText: "白棋唯一延長後回到兩口氣。"
        },
        {
          id: "ladder-2", prompt: "第二個打吃在哪裡？", acceptedMoves: [[4,3]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [3,4], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "每一步重新數氣。", success: "第二個打吃成立。", opponentText: "白棋再次只能延長。"
        },
        {
          id: "ladder-3", prompt: "第三個打吃在哪裡？", acceptedMoves: [[3,5]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [4,4], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "不要照上一手方向猜。", success: "第三個打吃成立。", opponentText: "白棋唯一延長。"
        },
        {
          id: "ladder-4", prompt: "第四個打吃在哪裡？", acceptedMoves: [[5,4]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [4,5], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "維持『兩口變一口』。", success: "第四個打吃成立。", opponentText: "白棋唯一延長。"
        },
        {
          id: "ladder-5", prompt: "第五個打吃在哪裡？", acceptedMoves: [[4,6]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [5,5], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "盤面變大後仍只看當下氣。", success: "第五個打吃成立。", opponentText: "白棋還沒有到邊線。"
        },
        {
          id: "ladder-6", prompt: "第六個打吃在哪裡？", acceptedMoves: [[6,5]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [5,6], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "7×7 題在這附近已接近終點；8×8 還要繼續讀。", success: "第六個打吃成立。", opponentText: "白棋延長後仍有兩口氣。"
        },
        {
          id: "ladder-7", prompt: "第七個打吃在哪裡？", acceptedMoves: [[5,7]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [6,6], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "繼續找能壓成一口氣的點。", success: "第七個打吃成立。", opponentText: "白棋再次唯一延長。"
        },
        {
          id: "ladder-8", prompt: "第八個打吃在哪裡？", acceptedMoves: [[6,7]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [7,6], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 2, hint: "已靠近右下邊界，但仍不能跳步。", success: "第八個打吃成立。", opponentText: "白棋往右側延長。"
        },
        {
          id: "ladder-9", prompt: "第九個打吃在哪裡？", acceptedMoves: [[7,7]], expectedTrackedLibertiesBeforeLearner: 2, expectedLearnerCapturedCount: 0, expectedTrackedLibertiesAfterLearner: 1, opponentMove: [7,5], opponentMoveMustBeUniqueLiberty: true, expectedOpponentCapturedCount: 0, expectedTrackedLibertiesAfterOpponent: 1, hint: "邊線改變了逃路；先確認唯一一口氣。", success: "第九個打吃把白棋壓到最後一口氣。", opponentText: "白棋被迫沿右邊線延長，延長後仍只剩最後一氣。"
        },
        {
          id: "ladder-finish", prompt: "最後在哪裡補掉白棋最後一氣？", acceptedMoves: [[7,4]], expectedTrackedLibertiesBeforeLearner: 1, expectedLearnerCapturedCount: 11, hint: "整串已貼右邊線，直接找唯一剩下的氣。", success: "黑提掉十一顆白棋，較長征子完成。"
        }
      ],
      expectedFinalEmpty: [[2,2],[2,3],[3,3],[3,4],[4,4],[4,5],[5,5],[5,6],[6,6],[7,6],[7,5]],
      takeaway: "盤面變大、路線拉長後，征子的判斷規則沒有變：逐手證明唯一延長，而不是記原題終點。",
      terms: [
        ["征子", "逐手打吃並迫使對方沿唯一逃路延長的強制追逐。"],
        ["路線長度", "棋盤大小與起始位置會改變需要讀的手數；不能把某一題的終點當固定答案。"],
        ["引征", "路線上的接應可能打破強制性，因此更長路線更需要檢查前方。"]
      ]
    }
  ];

  const api = {
    version: 10,
    scoringContractVersion: "advanced-choice-v1",
    tracks,
    experiences,
    sequenceScoringContractVersion: "advanced-sequence-v1",
    sequenceExperiences
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedContent = api;
})(typeof window !== "undefined" ? window : globalThis);

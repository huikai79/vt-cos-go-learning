const tabs = [...document.querySelectorAll('[role="tab"][data-view]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function selectView(viewId, moveFocus = false) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.view === viewId;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) tab.focus();
  });
  panels.forEach((panel) => {
    const selected = panel.id === viewId;
    panel.hidden = !selected;
    panel.classList.toggle('is-active', selected);
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectView(tab.dataset.view));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectView(tabs[nextIndex].dataset.view, true);
  });
});

const evidenceCopy = {
  confirmed: {
    status: '確證 · CONFIRMED', symbol: '●', claim: '132 年已有 17 路石棋盤。',
    boundary: '可直接對應墓葬年代與出土棋盤；不等於已知最早，也不解釋改盤原因。'
  },
  strong: {
    status: '高度可信 · STRONG', symbol: '◐', claim: '若干技術分類在後世文本再次出現。',
    boundary: '多條材料收斂，但不足以證明一條不中斷的完整傳承鏈。'
  },
  debated: {
    status: '有爭議 · DEBATED', symbol: '◇', claim: '《敦煌棋經》的精確年代。',
    boundary: '手稿存在可查；作品形成與現存抄本年代不能混為一談。'
  },
  legend: {
    status: '傳說 · LEGEND', symbol: '✦', claim: '堯造圍棋，以教丹朱。',
    boundary: '可證明傳說流傳，不能倒推成堯時代的同期事件紀錄。'
  },
  hypothesis: {
    status: '研究假說 · HYPOTHESIS', symbol: '△', claim: '星位配置可能留下文化傳播痕跡。',
    boundary: '能解釋部分材料，中間考古節點仍不足以封閉因果鏈。'
  },
  unknown: {
    status: '未知 · UNKNOWN', symbol: '?', claim: '19 路第一次出現在哪一年？',
    boundary: '現有材料不足以把單一日期鎖死；不知道本身也是目前結論。'
  }
};

const evidenceButtons = [...document.querySelectorAll('[data-evidence]')];
function setEvidence(key) {
  const copy = evidenceCopy[key];
  evidenceButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.evidence === key)));
  document.querySelector('#history-lens-status').textContent = copy.status;
  document.querySelector('#history-lens-symbol').textContent = copy.symbol;
  document.querySelector('#history-lens-claim').textContent = copy.claim;
  document.querySelector('#history-lens-boundary').textContent = copy.boundary;
}
evidenceButtons.forEach((button) => button.addEventListener('click', () => setEvidence(button.dataset.evidence)));

const causalDemo = document.querySelector('#history-causal-demo');
const causalToggle = document.querySelector('#causal-toggle');
causalToggle.addEventListener('click', () => {
  const shown = causalDemo.classList.toggle('show-barrier');
  causalToggle.setAttribute('aria-pressed', String(shown));
});

const relationButtons = [...document.querySelectorAll('[data-relation]')].filter((node) => node.tagName === 'BUTTON');
const relationPanels = [...document.querySelectorAll('[data-relation-panel]')];
function setRelation(key) {
  relationButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.relation === key)));
  relationPanels.forEach((panel) => { panel.hidden = panel.dataset.relationPanel !== key; });
  document.querySelector('.relation-stage').dataset.relation = key;
}
relationButtons.forEach((button) => button.addEventListener('click', () => setRelation(button.dataset.relation)));

const studyCards = [...document.querySelectorAll('[data-study-arm]')];
studyCards.forEach((card) => card.addEventListener('click', () => {
  studyCards.forEach((candidate) => {
    const selected = candidate === card;
    candidate.classList.toggle('selected', selected);
    candidate.setAttribute('aria-pressed', String(selected));
  });
}));

const transferDemo = document.querySelector('#transfer-demo');
const criteriaToggle = document.querySelector('#criteria-toggle');
criteriaToggle.addEventListener('click', () => {
  const shown = transferDemo.classList.toggle('show-criteria');
  criteriaToggle.setAttribute('aria-pressed', String(shown));
});

const metricCopy = {
  g2: {
    code: 'G2 · LEARNING TRACK', title: '每年新學或接受系統訓練的人',
    copy: '各來源的「學棋」定義、年份與涵蓋機構不同；目前不能拼成共享世界榜。',
    stamp: 'SEPARATE PROFILES\nNO SHARED RANKING'
  },
  g3: {
    code: 'G3 · PARTICIPATION TRACK', title: '一年內至少下過一次圍棋的人',
    copy: '年度參與不等於正在上課，也不等於協會會員；不同調查設計需分開閱讀。',
    stamp: 'SURVEY DEFINITIONS\nMUST MATCH'
  },
  g4: {
    code: 'G4 · REGISTRATION TRACK', title: '協會會員、持證棋手或段級位名錄',
    copy: '行政紀錄制度清楚，但會漏掉非會員玩家；不能代替全部參與人口。',
    stamp: 'ADMIN RECORDS\nNOT TOTAL PLAYERS'
  },
  g5: {
    code: 'G5 · COMPARABLE TRACK', title: '2025 歐洲 EGD 年度活躍棋手',
    copy: '同一資料庫、同一年度、同一 Active players 定義，因此可直接比較；不是各國全部圍棋人口。',
    stamp: 'EUROPE · 2025\nNOT A WORLD RANKING'
  }
};

const metricDemo = document.querySelector('#metric-demo');
const metricButtons = [...document.querySelectorAll('[data-metric]')];
function setMetric(key) {
  const copy = metricCopy[key];
  metricDemo.dataset.activeMetric = key;
  metricButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.metric === key)));
  document.querySelector('#metric-code').textContent = copy.code;
  document.querySelector('#metric-title').textContent = copy.title;
  document.querySelector('#metric-copy').textContent = copy.copy;
  document.querySelector('.scope-stamp').innerText = copy.stamp;
}
metricButtons.forEach((button) => button.addEventListener('click', () => setMetric(button.dataset.metric)));

const filterButtons = [...document.querySelectorAll('[data-source-filter]')];
const profileCards = [...document.querySelectorAll('[data-source-type]')];
function setSourceFilter(key) {
  filterButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.sourceFilter === key)));
  profileCards.forEach((card) => { card.hidden = key !== 'all' && card.dataset.sourceType !== key; });
  document.querySelector('#profile-demo').dataset.filter = key;
  const visibleCount = key === 'all' ? profileCards.length : profileCards.filter((card) => card.dataset.sourceType === key).length;
  const label = key === 'all' ? '全部' : filterButtons.find((button) => button.dataset.sourceFilter === key).textContent.trim();
  document.querySelector('#filter-scope').textContent = `目前顯示${label} ${visibleCount} 張資料卡；不是排名。`;
}
filterButtons.forEach((button) => button.addEventListener('click', () => setSourceFilter(button.dataset.sourceFilter)));

function pulse(node) {
  node.classList.remove('demo-pulse');
  requestAnimationFrame(() => node.classList.add('demo-pulse'));
  setTimeout(() => node.classList.remove('demo-pulse'), 760);
}

document.querySelector('#motion-demo').addEventListener('click', () => {
  const active = panels.find((panel) => !panel.hidden)?.id;
  if (active === 'w1') { setEvidence('legend'); pulse(document.querySelector('.lens-stage')); }
  if (active === 'w2') { if (!causalDemo.classList.contains('show-barrier')) causalToggle.click(); pulse(document.querySelector('.seventy-two-test')); }
  if (active === 'w3') { setRelation('unknown'); pulse(document.querySelector('.relation-stage')); }
  if (active === 'w4') { if (!transferDemo.classList.contains('show-criteria')) criteriaToggle.click(); pulse(document.querySelector('.study-grid')); }
  if (active === 'w5') { setMetric(metricDemo.dataset.activeMetric === 'g5' ? 'g2' : 'g5'); pulse(document.querySelector('.metric-selector')); }
  if (active === 'w6') { setSourceFilter('unknown'); pulse(document.querySelector('.profile-phone')); }
});

selectView('w1');

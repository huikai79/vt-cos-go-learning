const tabs = [...document.querySelectorAll('[role="tab"][data-view]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function setTitleLines(id, lines, emphasized = []) {
  const heading = document.querySelector(`#${id}`);
  if (!heading) return;
  heading.replaceChildren(...lines.map((line, index) => {
    const node = document.createElement(emphasized.includes(index) ? 'em' : 'span');
    node.className = 'title-line';
    node.textContent = line;
    return node;
  }));
}

const freshTitle = document.querySelector('#w1-title');
if (freshTitle) {
  freshTitle.innerHTML = '<span class="title-line"><span class="preview-before">先做一手，</span><span class="preview-after">這一手沒有消失。</span></span><em class="title-line"><span class="preview-before">再看懂為什麼。</span><span class="preview-after">它留下可比較的證據。</span></em>';
}
setTitleLines('w2-title', ['上次停在', '「兩眼與急所」。'], [1]);
setTitleLines('w3-title', ['選一個看得懂的起點。', '之後可以隨時更換。'], [1]);
setTitleLines('w4-title', ['十五個單元，', '是一張內容地圖。', '不是能力階梯。'], [2]);
setTitleLines('w5-title', ['方法說清楚，', '限制也不藏起來。'], [1]);
setTitleLines('w6-title', ['先做一手，', '再決定要不要開始。']);

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

function bindPreview(toggle, surface) {
  toggle.addEventListener('click', () => {
    const isResult = surface.classList.toggle('show-result');
    toggle.setAttribute('aria-pressed', String(isResult));
  });
}

const freshToggle = document.querySelector('#fresh-preview-toggle');
const freshPreview = document.querySelector('#fresh-preview');
const mobileToggle = document.querySelector('#mobile-preview-toggle');
const mobilePreview = document.querySelector('#mobile-home-demo');
bindPreview(freshToggle, freshPreview);
bindPreview(mobileToggle, mobilePreview);

const pathCards = [...document.querySelectorAll('.path-card')];
pathCards.forEach((card) => {
  const button = card.querySelector('button');
  button.setAttribute('aria-pressed', String(card.classList.contains('selected')));
  button.addEventListener('click', () => {
    pathCards.forEach((candidate) => {
      const selected = candidate === card;
      candidate.classList.toggle('selected', selected);
      candidate.querySelector('button').setAttribute('aria-pressed', String(selected));
    });
  });
});

const unitButtons = [...document.querySelectorAll('.unit-grid button[data-unit-index]')];
unitButtons.forEach((button) => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    unitButtons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle('selected', selected);
      candidate.setAttribute('aria-pressed', String(selected));
    });
  });
});

document.querySelector('#motion-demo').addEventListener('click', () => {
  selectView('w1');
  freshPreview.classList.remove('show-result');
  freshToggle.setAttribute('aria-pressed', 'false');
  requestAnimationFrame(() => requestAnimationFrame(() => freshToggle.click()));
});

selectView('w1');

"use strict";

const tabs = Array.from(document.querySelectorAll("[data-view]"));
const views = Array.from(document.querySelectorAll(".review-view"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const semanticTitleLines = {
  "w2-title": ["哪一手能做出", "第二個眼？"],
  "w3-title": ["哪一手能做出", "第二個眼？"],
  "w4-title": ["一局複盤發現很多問題。", "下一局最有效的", "練習安排是？"],
  "w5-title": ["這串黑棋現在", "是否還有兩口氣？"],
  "w6-title": ["同一個局面，", "不離開上下文。"]
};

const signatureTitle = document.querySelector("#w1-title");
if (signatureTitle) {
  signatureTitle.innerHTML = '<span class="title-line"><span class="signature-before">先做一手。</span><span class="signature-after">這一手沒有消失。</span></span><em class="title-line"><span class="signature-before">再看懂後果。</span><span class="signature-after">它留下可比較的證據。</span></em>';
}

Object.entries(semanticTitleLines).forEach(([id, lines]) => {
  const heading = document.querySelector(`#${id}`);
  if (!heading) return;
  heading.replaceChildren(...lines.map((line) => {
    const span = document.createElement("span");
    span.className = "title-line";
    span.textContent = line;
    return span;
  }));
});

function selectView(viewId, options = {}) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.view === viewId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  views.forEach((view) => {
    const selected = view.id === viewId;
    view.hidden = !selected;
    view.classList.toggle("is-active", selected);
  });
  if (options.focusHeading) document.querySelector(`#${viewId} [data-view-title]`)?.focus({ preventScroll: true });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectView(tab.dataset.view));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    tabs[next].focus();
    selectView(tabs[next].dataset.view);
  });
});

function toggleSignature(force) {
  const demo = document.querySelector("#signature-demo");
  const button = document.querySelector("#signature-toggle");
  const next = typeof force === "boolean" ? force : !demo.classList.contains("show-consequence");
  demo.classList.toggle("show-consequence", next);
  button.setAttribute("aria-pressed", String(next));
}

document.querySelector("#signature-toggle")?.addEventListener("click", () => toggleSignature());

function playBoardTransition() {
  selectView("w2");
  const source = document.querySelector("#w2 .experience-frame");
  source.classList.remove("is-playing");
  void source.offsetWidth;
  source.classList.add("is-playing");
  window.setTimeout(() => {
    selectView("w3");
    document.querySelector("#w3 .experience-frame")?.classList.add("is-revealed");
  }, reducedMotion.matches ? 0 : 520);
}

document.querySelector("#board-answer-action")?.addEventListener("click", playBoardTransition);
document.querySelector("#motion-demo")?.addEventListener("click", playBoardTransition);

document.querySelector("[data-mobile-toggle]")?.addEventListener("click", (event) => {
  const demo = document.querySelector("#mobile-demo");
  const revealed = demo.classList.toggle("show-result");
  event.currentTarget.textContent = revealed ? "回到作答前" : "模擬落下第一手";
  event.currentTarget.setAttribute("aria-pressed", String(revealed));
});

const choiceRadios = Array.from(document.querySelectorAll("#w4 [role='radio']"));
const choiceConfirm = document.querySelector("#w4 .choice-footer .primary-action");

function chooseOption(index, moveFocus = false) {
  choiceRadios.forEach((radio, radioIndex) => {
    const selected = radioIndex === index;
    radio.setAttribute("aria-checked", String(selected));
    radio.tabIndex = selected ? 0 : -1;
  });
  choiceConfirm.disabled = false;
  if (moveFocus) choiceRadios[index].focus();
}

choiceRadios.forEach((radio, index) => {
  radio.tabIndex = index === 0 ? 0 : -1;
  radio.addEventListener("click", () => chooseOption(index));
  radio.addEventListener("keydown", (event) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const delta = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
    chooseOption((index + delta + choiceRadios.length) % choiceRadios.length, true);
  });
});

selectView("w1");

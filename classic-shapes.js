(function () {
  "use strict";

  const stageIds = ["u4-m01", "u4-m02", "u4-m03", "u4-m05"];
  const stageMeta = [
    { tag: "先不要看名稱", title: "自己找第一個急所", goal: "先看眼空結構，再決定第一手。", reveal: true },
    { tag: "名稱已拿掉", title: "換個方向再找", goal: "不要靠方向記座標；找相同的結構關係。", reveal: true },
    { tag: "角色交換", title: "換成攻方找急所", goal: "同一個急所，守方想佔、攻方也想搶。", reveal: true },
    { tag: "相似但不同", title: "不要看到眼形就硬套", goal: "這題不是直三；先判斷第二眼真正缺的是哪一面。", reveal: false }
  ];

  const problems = stageIds.map((id) => window.GoContent.problems.find((problem) => problem.id === id));
  if (problems.some((problem) => !problem)) throw new Error("Classic shape practice source problem missing.");

  let stage = 0;
  let cursor = [4, 4];
  let solved = false;
  let hintShown = false;

  const $ = (id) => document.getElementById(id);

  function pointKey(x, y) { return x + "," + y; }

  function renderBoard() {
    const problem = problems[stage];
    const size = 9;
    const pad = 5;
    const step = 100 / (size - 1);
    const stoneByPoint = new Map(problem.stones.map(([x, y, color]) => [pointKey(x, y), color]));
    const lines = [];
    for (let i = 0; i < size; i += 1) {
      const p = pad + i * (90 / (size - 1));
      lines.push('<line x1="' + pad + '" y1="' + p + '" x2="95" y2="' + p + '" stroke="#70502c" stroke-width=".45"/>');
      lines.push('<line x1="' + p + '" y1="' + pad + '" x2="' + p + '" y2="95" stroke="#70502c" stroke-width=".45"/>');
    }
    const nodes = [];
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const cx = pad + x * (90 / (size - 1));
      const cy = pad + y * (90 / (size - 1));
      const color = stoneByPoint.get(pointKey(x, y));
      if (color === 1) nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="4.2" class="stone-black"/>');
      if (color === 2) nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="4.2" class="stone-white"/>');
      if (!color) nodes.push('<circle data-x="' + x + '" data-y="' + y + '" cx="' + cx + '" cy="' + cy + '" r="5.2" class="classic-hit"/>');
    }
    const [cx0, cy0] = cursor;
    const cx = pad + cx0 * (90 / (size - 1));
    const cy = pad + cy0 * (90 / (size - 1));
    nodes.push('<circle cx="' + cx + '" cy="' + cy + '" r="5.4" class="classic-cursor-ring"/>');
    $("classic-board").innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + lines.join("") + nodes.join("") + "</svg>";
    $("classic-cursor-status").textContent = "游標：第 " + (cy0 + 1) + " 行，第 " + (cx0 + 1) + " 列";
  }

  function render() {
    const problem = problems[stage];
    const meta = stageMeta[stage];
    solved = false;
    hintShown = false;
    cursor = [4, 4];
    $("classic-tag").textContent = meta.tag;
    $("classic-title").textContent = meta.title;
    $("classic-prompt").textContent = problem.prompt;
    $("classic-goal").textContent = meta.goal;
    $("classic-feedback").className = "feedback";
    $("classic-feedback").textContent = "";
    $("classic-reveal").hidden = true;
    $("classic-hint").disabled = false;
    $("classic-next").disabled = true;
    $("classic-next").textContent = stage === problems.length - 1 ? "完成探索" : "下一層 →";
    $("classic-side").textContent = (problem.playerColor || 1) === 1 ? "● 黑棋" : "○ 白棋";
    document.querySelectorAll("#classic-stage-list li").forEach((item, index) => {
      item.classList.toggle("active", index === stage);
      item.classList.toggle("done", index < stage);
    });
    renderBoard();
    $("classic-title").focus();
  }

  function attempt(x, y) {
    if (solved) return;
    const problem = problems[stage];
    const occupied = problem.stones.some(([sx, sy]) => sx === x && sy === y);
    if (occupied) {
      $("classic-feedback").className = "feedback error";
      $("classic-feedback").textContent = "這裡已有棋子。先找眼空或邊界中的可落子點。";
      return;
    }
    if (problem.answer[0] === x && problem.answer[1] === y) {
      solved = true;
      $("classic-feedback").className = "feedback success";
      $("classic-feedback").innerHTML = "找到急所。<span class=\"answer-explanation\">" + problem.explanation + "</span>";
      if (stageMeta[stage].reveal) {
        $("classic-reveal").hidden = false;
        $("classic-name").textContent = "直三";
        $("classic-story").textContent = "三個眼空連成一直線，因此常稱「直三」。名稱是記憶鉤子；真正要記的是中央急所與先後手。";
      } else {
        $("classic-reveal").hidden = false;
        $("classic-name").textContent = "先判斷，再套名型";
        $("classic-story").textContent = "這題刻意換成第二眼缺口，提醒你不要只靠輪廓反射作答。";
      }
      $("classic-next").disabled = false;
      $("classic-hint").disabled = true;
      return;
    }
    $("classic-feedback").className = "feedback error";
    $("classic-feedback").textContent = hintShown ? "還不是。沿著提示重新檢查哪一點真正改變兩眼結構。" : "這一手沒有達成本層目標。先不要看名稱，再比較其他候選點。";
  }

  $("classic-board").addEventListener("click", (event) => {
    const hit = event.target.closest("[data-x][data-y]");
    if (!hit) return;
    cursor = [Number(hit.dataset.x), Number(hit.dataset.y)];
    renderBoard();
    attempt(cursor[0], cursor[1]);
  });

  $("classic-board").addEventListener("keydown", (event) => {
    let [x, y] = cursor;
    if (event.key === "ArrowLeft") x = Math.max(0, x - 1);
    else if (event.key === "ArrowRight") x = Math.min(8, x + 1);
    else if (event.key === "ArrowUp") y = Math.max(0, y - 1);
    else if (event.key === "ArrowDown") y = Math.min(8, y + 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      attempt(x, y);
      return;
    } else return;
    event.preventDefault();
    cursor = [x, y];
    renderBoard();
  });

  $("classic-hint").addEventListener("click", () => {
    hintShown = true;
    $("classic-feedback").className = "feedback";
    $("classic-feedback").textContent = problems[stage].hint;
  });

  $("classic-next").addEventListener("click", () => {
    if (!solved) return;
    if (stage < problems.length - 1) {
      stage += 1;
      render();
    } else {
      $("classic-feedback").className = "feedback success";
      $("classic-feedback").textContent = "探索完成。回到第 4 單元後，名稱會繼續退到背景；正式課程仍以無提示首答與後續新棋形為準。";
      $("classic-next").disabled = true;
    }
  });

  render();
})();

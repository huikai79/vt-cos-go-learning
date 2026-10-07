(() => {
  const tabs = [...document.querySelectorAll('[role="tab"][data-view]')];
  const views = [...document.querySelectorAll('.review-view')];

  function openView(id, focus = true) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.view === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    views.forEach((view) => { view.hidden = view.id !== id; });
    if (focus) document.querySelector(`#${id} [data-view-title]`)?.focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => openView(tab.dataset.view));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      openView(tabs[next].dataset.view, false);
    });
  });

  const trackData = {
    reading: ['讀棋與手筋', '在棋盤上走完多手變化，練習先看逃路、氣與次序。', '選擇題 + 8 個 rules-backed sequence'],
    middle: ['中盤攻防', '比較打入、侵消、輕重與手抜き的條件，不把名稱當答案。', '概念比較 + 局部反例'],
    endgame: ['官子與全局', '比較先後手、逆先手與形勢判斷，保留不確定性。', '候選比較 + 全局取捨']
  };
  document.querySelectorAll('#w1 button[data-track]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('#w1 button[data-track]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      const [title, copy, meta] = trackData[button.dataset.track];
      document.querySelector('#track-map-title').textContent = title;
      document.querySelector('#track-map-copy').textContent = copy;
      document.querySelector('#track-map-meta').textContent = meta;
    });
  });

  let firstSequenceResponse = null;
  let sequenceAttempts = 0;
  function answerSequence(move) {
    sequenceAttempts += 1;
    const correct = move === 'D5';
    const ledger = document.querySelector('#first-response-ledger');
    const feedback = document.querySelector('#sequence-feedback');
    const state = document.querySelector('#w2-state');
    if (!firstSequenceResponse) {
      firstSequenceResponse = move;
      ledger.querySelector('strong').textContent = `${move} · 已固定保存`;
      ledger.querySelector('small').textContent = '後續只會新增 retry';
    }
    document.querySelectorAll('#w2 [data-sequence-move]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.sequenceMove === move));
    });
    document.querySelectorAll('#w2 [data-board-move]').forEach((point) => {
      const selected = point.dataset.boardMove === move;
      if (selected && sequenceAttempts === 1) point.classList.add('first-mark');
      if (selected && sequenceAttempts > 1) point.classList.add('retry-mark');
      if (selected && correct) point.classList.add('correct-mark');
    });
    feedback.hidden = false;
    feedback.classList.toggle('correct', correct);
    if (correct) {
      feedback.innerHTML = firstSequenceResponse === move
        ? '<strong>符合本題條件。</strong> 這一手同時收緊兩個出口；先比較理由，再進下一題。'
        : `<strong>完成修正。</strong> ${move} 符合本題條件；第一反應 ${firstSequenceResponse} 仍獨立保留。`;
      state.textContent = firstSequenceResponse === move ? '比較理由 · 首答已記錄' : '完成修正 · 首答與重試分開';
      document.querySelector('#sequence-next').disabled = false;
      document.querySelector('#sequence-takeaway').hidden = false;
      document.querySelector('#board-family').textContent = 'FAMILY REVEALED · 枷';
    } else {
      feedback.innerHTML = `<strong>還沒同時限制兩個出口。</strong> ${move} 是合法候選，但盤面不推進；請重新數白棋的連接路徑。`;
      state.textContent = '修正重算 · 第一反應已保留';
    }
  }
  document.querySelectorAll('#w2 [data-sequence-move]').forEach((button) => button.addEventListener('click', () => answerSequence(button.dataset.sequenceMove)));
  document.querySelectorAll('#w2 [data-board-move]').forEach((button) => button.addEventListener('click', () => answerSequence(button.dataset.boardMove)));
  document.querySelector('#sequence-hint').addEventListener('click', (event) => {
    document.querySelector('#sequence-hint-copy').hidden = false;
    event.currentTarget.disabled = true;
    if (!firstSequenceResponse) document.querySelector('#w2-state').textContent = '提示後待作答 · 尚未記錄首答';
  });

  const reviewStudio = document.querySelector('#review-studio');
  document.querySelector('#place-review-candidate').addEventListener('click', (event) => {
    reviewStudio.dataset.reviewState = 'candidate';
    event.currentTarget.disabled = true;
    document.querySelector('#reveal-original').disabled = false;
    document.querySelector('#review-verdict').innerHTML = '<span>FIRST CANDIDATE SAVED</span><strong>Q10 已獨立記錄</strong><p>原著仍遮蔽；現在可以主動揭露並比較。</p>';
  });
  document.querySelector('#reveal-original').addEventListener('click', (event) => {
    reviewStudio.dataset.reviewState = 'revealed';
    event.currentTarget.disabled = true;
    const verdict = document.querySelector('#review-verdict');
    verdict.classList.add('revealed');
    verdict.innerHTML = '<span>HISTORICAL COMPARISON</span><strong>你的 Q10 · 原著 R12</strong><p>兩手不同不等於你的候選錯；請比較方向與後續條件。</p>';
    document.querySelector('#engine-demo').disabled = false;
  });
  document.querySelector('#engine-demo').addEventListener('click', () => { document.querySelector('#engine-result').hidden = false; });

  const sizeData = {
    5: ['5×5 · BASIC APERTURE', '練連斷、氣與眼形的直接結果', '只作 basic practice；不進 live T3。'],
    7: ['7×7 · TRANSITION APERTURE', '把局部攻防放進較大的連續局面', '只作 transitional practice；不進 live T3。'],
    9: ['9×9 · COMPLETE SMALL BOARD', '練完整開局、中盤到終局', '可形成少數 bounded 9×9 live opportunity；一盤勝負仍不代表棋力。'],
    19: ['19×19 · FULL-BOARD APERTURE', '練全盤整合與保存完整棋譜', '19×19 只寫 unscored practice observation；不取得 T3 authority。']
  };
  document.querySelectorAll('#w4 [data-board-size]').forEach((button) => {
    button.addEventListener('click', () => {
      const size = button.dataset.boardSize;
      document.querySelector('#live-setup-demo').dataset.size = size;
      document.querySelectorAll('#w4 [data-board-size]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelector('#setup-size-label').textContent = sizeData[size][0];
      document.querySelector('#setup-purpose').textContent = sizeData[size][1];
      document.querySelector('#setup-boundary').textContent = sizeData[size][2];
      document.querySelector('#w4 .setup-board-visual > span').textContent = `${size} × ${size}`;
      document.querySelector('#w4 .setup-panel > .primary-action').innerHTML = `開始 ${size}×${size} 新局 <span aria-hidden="true">→</span>`;
    });
  });
  document.querySelectorAll('#w4 [data-opponent]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('#w4 [data-opponent]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      const local = button.dataset.opponent === 'local';
      document.querySelector('#computer-boundary').textContent = local
        ? '雙人同機只保存這盤棋的手順與操作；系統不推測哪一位是學習者。'
        : '內建電腦只從規則合法手中作 bounded heuristic 選擇，不是 KataGo，也不宣稱最佳手。';
      document.querySelector('#w4 .provider-disclosure').hidden = local;
    });
  });
  document.querySelectorAll('#w4 [data-color]').forEach((button) => {
    button.addEventListener('click', () => document.querySelectorAll('#w4 [data-color]').forEach((item) => item.setAttribute('aria-pressed', String(item === button))));
  });

  document.querySelector('#play-demo-move').addEventListener('click', (event) => {
    const frame = document.querySelector('#live-game-demo');
    if (frame.dataset.movePlayed === 'true') return;
    frame.dataset.movePlayed = 'true';
    event.currentTarget.setAttribute('aria-label', '黑棋第 19 手 F6，最後一手');
    document.querySelector('#demo-turn').textContent = '電腦思考中';
    document.querySelector('#demo-moves').textContent = '19';
    document.querySelector('#live-demo-feedback').textContent = '黑棋已在 F6 落子。規則驗證通過；等待電腦候選。';
    document.querySelector('#decision-title').textContent = '第 19 手已保存';
    document.querySelector('#decision-copy').textContent = '這是可觀察的練習操作；不是全局好壞評分。';
    const item = document.createElement('li');
    item.innerHTML = '<span>19</span><i class="black-dot"></i><strong>F6</strong>';
    document.querySelector('#demo-move-log').append(item);
  });
  let demoPasses = 0;
  document.querySelector('#demo-pass').addEventListener('click', () => {
    demoPasses += 1;
    document.querySelector('#live-demo-feedback').textContent = demoPasses === 1
      ? '黑棋停一手。輪到白棋；連續兩次 Pass 才進入終局確認。'
      : '雙方連續 Pass；下一步是人工死子與結果確認。';
  });

  const endgame = document.querySelector('#endgame-demo');
  document.querySelector('#dead-group-toggle').addEventListener('click', (event) => {
    const marked = endgame.dataset.deadMarked !== 'true';
    endgame.dataset.deadMarked = String(marked);
    event.currentTarget.setAttribute('aria-pressed', String(marked));
    document.querySelector('#mobile-score-state').textContent = marked ? '白棋兩子已標記為死子' : '尚未標記死子';
    document.querySelector('#black-score').textContent = marked ? '39' : '35';
    document.querySelector('#score-lead').textContent = marked ? '暫計黑勝 10.5 目 · 尚待雙方確認' : '暫計黑勝 6.5 目 · 尚待雙方確認';
    document.querySelector('#mobile-result').hidden = true;
  });
  document.querySelector('#confirm-demo-score').addEventListener('click', () => {
    const result = document.querySelector('#mobile-result');
    result.hidden = false;
    result.querySelector('strong').textContent = endgame.dataset.deadMarked === 'true' ? '黑棋勝 10.5 目' : '黑棋勝 6.5 目';
  });
  document.querySelector('#resume-demo-play').addEventListener('click', () => {
    document.querySelector('#mobile-result').hidden = true;
    document.querySelector('#mobile-score-state').textContent = '爭議保留 · 回棋盤繼續下';
  });

  document.querySelector('#motion-demo').addEventListener('click', () => {
    const active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.view;
    const targets = {
      w1: document.querySelector('#w1 .capability-center'),
      w2: document.querySelector('#w2 .first-response-ledger'),
      w3: document.querySelector('#w3 .original-veil'),
      w4: document.querySelector('#w4 .setup-board-visual'),
      w5: document.querySelector('#w5 .go-board'),
      w6: document.querySelector('#w6 .score-sheet')
    };
    const target = targets[active];
    if (!target) return;
    target.classList.remove('is-demo-pulsing');
    requestAnimationFrame(() => target.classList.add('is-demo-pulsing'));
  });
})();

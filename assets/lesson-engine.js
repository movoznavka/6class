/* =========================================================
   LessonEngine — спільний рушій для уроків класної роботи:
   кроки (розігрів → теорія → читання → практика → тест →
   підсумок), навігація крапками, і набір готових ігор.
   Кожен файл уроку визначає свій html{} / attach{} / дані
   і викликає LessonEngine.init({...}) в кінці.
   ========================================================= */
(function (global) {
  const LessonEngine = {};

  const STEPS = [
    { key: 'warmup',   title: 'Розігрів',  icon: 'clock'  },
    { key: 'theory',   title: 'Теорія',    icon: 'book'   },
    { key: 'reading',  title: 'Читання',   icon: 'bubble' },
    { key: 'practice', title: 'Практика',  icon: 'pencil' },
    { key: 'quiz',     title: 'Тест',      icon: 'check'  },
    { key: 'reflect',  title: 'Підсумок',  icon: 'bulb'   },
  ];
  const ICONS = {
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
    book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5v-13Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    bubble: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    pencil: '<path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19 4 20Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 7 17 10.5" stroke="currentColor" stroke-width="2"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    bulb: '<path d="M9 18h6M10 21h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2.1h5.2c0-.9.3-1.6.9-2.1A6 6 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };
  LessonEngine.iconSvg = function (name, cls) {
    return `<span class="${cls || 'panel-icon'}"><svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg></span>`;
  };

  let currentStep = 0;
  let CFG = null;

  LessonEngine.init = function (config) {
    CFG = config; // { themeClass, title, topic, html:{}, attach:{}, lessonId, onQuizDone }
    currentStep = 0;
    const shell = document.getElementById('lesson-shell');
    shell.innerHTML = `
      <div class="lesson-content ${config.themeClass || ''}">
        <div class="lesson-header">
          <div class="eyebrow">${config.topic || ''}</div>
          <h2>${config.title || ''}</h2>
          <div class="progress-track" style="margin-top:14px;"><div class="progress-fill" id="lesson-progress-fill"></div></div>
          <div class="dot-nav" id="dot-nav"></div>
        </div>
        <div id="step-panel" style="padding:0 32px;"></div>
      </div>
    `;
    renderDotNav();
    renderStepPanel();
  };

  function renderDotNav() {
    const nav = document.getElementById('dot-nav');
    nav.innerHTML = '';
    STEPS.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'dot-item' + (i === currentStep ? ' active' : '') + (i < currentStep ? ' done' : '');
      el.innerHTML = `<span class="dot-num">${i < currentStep ? '✓' : i + 1}</span> ${s.title}`;
      el.onclick = () => { currentStep = i; renderDotNav(); renderStepPanel(); };
      nav.appendChild(el);
    });
  }

  LessonEngine.goStep = function (delta) {
    currentStep = Math.max(0, Math.min(STEPS.length - 1, currentStep + delta));
    renderDotNav();
    renderStepPanel();
    document.getElementById('lesson-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function renderStepPanel() {
    const panel = document.getElementById('step-panel');
    document.getElementById('lesson-progress-fill').style.width = (currentStep / (STEPS.length - 1) * 100) + '%';
    const key = STEPS[currentStep].key;
    let html = (CFG.html[key] || (() => ''))();
    html += `
      <div class="nav-row">
        <button class="nav-btn secondary" onclick="LessonEngine.goStep(-1)" ${currentStep === 0 ? 'disabled' : ''}>← Назад</button>
        <button class="nav-btn" onclick="LessonEngine.goStep(1)" ${currentStep === STEPS.length - 1 ? 'disabled' : ''}>Далі →</button>
      </div>
    `;
    panel.innerHTML = html;
    if (CFG.attach[key]) CFG.attach[key]();
  }

  /* ---------------- generic game helpers ---------------- */
  LessonEngine.genQuickfire = function (containerId, items, scoreId, yesLabel, noLabel) {
    const list = document.getElementById(containerId);
    if (!list) return;
    let score = 0;
    list.innerHTML = items.map((it, i) => `
      <div class="qf-row" data-i="${i}">
        <span class="qf-text">${it.t}</span>
        <span class="qf-badge"></span>
        <div class="qf-btns">
          <button class="qf-btn pick-yes">${yesLabel || 'Так'}</button>
          <button class="qf-btn pick-no">${noLabel || 'Ні'}</button>
        </div>
      </div>`).join('');
    list.querySelectorAll('.qf-row').forEach((row, i) => {
      row.querySelectorAll('.qf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (row.classList.contains('answered')) return;
          const picked = btn.classList.contains('pick-yes');
          const isRight = picked === items[i].answer;
          row.classList.add('answered', isRight ? 'right' : 'wrong');
          row.querySelector('.qf-badge').textContent = isRight ? '✓' : '✕';
          row.querySelectorAll('.qf-btn').forEach(b => b.disabled = true);
          if (isRight) score++;
          const scoreEl = document.getElementById(scoreId);
          if (scoreEl) scoreEl.textContent = `Рахунок: ${score}/${items.length}`;
        });
      });
    });
  };

  LessonEngine.genChoiceRows = function (containerId, items) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = items.map((it, i) => `
      <div class="punct-row" data-i="${i}">
        <span class="punct-sentence">${it.s}</span>
        <div class="punct-opts">
          ${it.opts.map((o, oi) => `<button class="qf-btn" data-oi="${oi}" style="border-radius:999px;">${o}</button>`).join('')}
        </div>
      </div>`).join('');
    wrap.querySelectorAll('.punct-row').forEach((row, i) => {
      row.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          if (row.dataset.done) return;
          const oi = parseInt(btn.dataset.oi);
          const isRight = oi === items[i].correct;
          btn.style.borderColor = isRight ? 'var(--correct)' : 'var(--incorrect)';
          btn.style.background = isRight ? 'var(--correct-bg)' : 'var(--incorrect-bg)';
          if (isRight) row.dataset.done = '1';
        });
      });
    });
  };

  LessonEngine.genFlipGrid = function (containerId, items) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = items.map((it, i) => `
      <div class="flip-card" data-i="${i}">
        <div class="flip-inner">
          <div class="flip-face flip-front">${it.front}</div>
          <div class="flip-face flip-back">${it.back}</div>
        </div>
      </div>`).join('');
    grid.querySelectorAll('.flip-card').forEach(card => card.addEventListener('click', () => card.classList.toggle('flipped')));
  };

  LessonEngine.genMatchGame = function (leftId, rightId, scoreId, pairs) {
    let leftPicked = null, found = 0;
    const leftWrap = document.getElementById(leftId), rightWrap = document.getElementById(rightId);
    if (!leftWrap || !rightWrap) return;
    leftWrap.innerHTML = pairs.map((p, i) => `<div class="match-card" data-idx="${i}" data-side="left">${p.left}</div>`).join('');
    const shuffled = pairs.map((p, i) => ({ ...p, i })).sort(() => Math.random() - 0.5);
    rightWrap.innerHTML = shuffled.map(p => `<div class="match-card" data-idx="${p.i}" data-side="right">${p.right}</div>`).join('');
    function onClick(card) {
      if (card.classList.contains('locked')) return;
      if (card.dataset.side === 'left') {
        leftWrap.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        leftPicked = card;
      } else {
        if (!leftPicked) return;
        const isMatch = leftPicked.dataset.idx === card.dataset.idx;
        if (isMatch) {
          leftPicked.classList.add('locked'); leftPicked.classList.remove('selected');
          card.classList.add('locked'); found++; leftPicked = null;
          const el = document.getElementById(scoreId);
          if (el) el.textContent = `Знайдено пар: ${found}/${pairs.length}`;
        } else {
          card.classList.add('shake'); leftPicked.classList.add('shake');
          const bad = leftPicked;
          setTimeout(() => { card.classList.remove('shake'); bad.classList.remove('shake', 'selected'); }, 380);
          leftPicked = null;
        }
      }
    }
    document.querySelectorAll(`#${leftId} .match-card, #${rightId} .match-card`).forEach(card => card.addEventListener('click', () => onClick(card)));
  };

  LessonEngine.genBasketGame = function (poolId, baskets, items, scoreId) {
    let selected = null, score = 0;
    const state = items.map((it, i) => ({ ...it, i, placed: false }));
    function renderPool() {
      const pool = document.getElementById(poolId);
      pool.innerHTML = state.filter(it => !it.placed).map(it => `<span class="basket-item" data-i="${it.i}">${it.t}</span>`).join('');
      pool.querySelectorAll('.basket-item').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          pool.querySelectorAll('.basket-item').forEach(x => x.style.outline = '');
          el.style.outline = '2px solid var(--sky)';
          selected = parseInt(el.dataset.i);
        });
      });
    }
    baskets.forEach(b => { document.getElementById(b.elId).innerHTML = ''; });
    renderPool();
    document.querySelectorAll(`[data-basket-for="${poolId}"]`).forEach(basketEl => {
      basketEl.addEventListener('click', () => {
        if (selected === null) return;
        const item = state.find(it => it.i === selected);
        if (!item || item.placed) return;
        item.placed = true;
        const type = basketEl.dataset.type;
        const isRight = type === item.correctType;
        const wrapId = baskets.find(b => b.type === type).elId;
        const span = document.createElement('span');
        span.className = 'basket-item ' + (isRight ? 'placed-correct' : 'placed-wrong');
        span.textContent = item.t + (isRight ? ' ✓' : ' ✕');
        document.getElementById(wrapId).appendChild(span);
        score += isRight ? 1 : 0;
        selected = null;
        renderPool();
        const scoreEl = document.getElementById(scoreId);
        if (scoreEl) scoreEl.textContent = `Рахунок: ${score}/${state.length}`;
      });
    });
  };

  LessonEngine.genBuilder = function (targetId, poolId, words) {
    let built = [], pool = shuffleArray(words);
    function render() {
      const target = document.getElementById(targetId), poolEl = document.getElementById(poolId);
      if (!target || !poolEl) return;
      target.innerHTML = built.length
        ? built.map((w, i) => `<span class="basket-item" data-i="${i}" style="cursor:pointer;">${w}</span>`).join(' ')
        : '<span class="subtle">Тут з\u2019явиться ваше речення…</span>';
      poolEl.innerHTML = pool.map((w, i) => `<span class="basket-item" data-i="${i}">${w}</span>`).join('');
      target.querySelectorAll('.basket-item').forEach(el => {
        el.addEventListener('click', () => { const i = parseInt(el.dataset.i); pool.push(built[i]); built.splice(i, 1); render(); });
      });
      poolEl.querySelectorAll('.basket-item').forEach(el => {
        el.addEventListener('click', () => { const i = parseInt(el.dataset.i); built.push(pool[i]); pool.splice(i, 1); render(); });
      });
    }
    render();
    return {
      check(feedbackId, correctSentence) {
        const fb = document.getElementById(feedbackId);
        const isRight = JSON.stringify(built) === JSON.stringify(words);
        fb.className = 'feedback ' + (isRight ? 'ok' : 'bad');
        fb.textContent = isRight
          ? `Чудово! Речення складене правильно: «${correctSentence}»`
          : (built.length < words.length ? 'Спершу розкладіть усі слова.' : 'Ще не той порядок — спробуйте ще раз.');
      },
      shuffle() { built = []; pool = shuffleArray(words); render(); }
    };
  };

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  LessonEngine.shuffleArray = shuffleArray;

  /* ---------------- quiz engine ---------------- */
  let QUIZ_ACTIVE = [];
  LessonEngine.quizHTML = function (bank) {
    QUIZ_ACTIVE = bank.map(item => {
      const order = shuffleArray(item.opts.map((_, i) => i));
      return { q: item.q, opts: order.map(i => item.opts[i]), correct: order.indexOf(item.correct) };
    });
    let html = `<div class="panel" style="background:none;border:none;padding:0;" id="quiz-result-slot"></div><div class="panel"><div class="panel-head">${LessonEngine.iconSvg('check')}<h3 style="margin-bottom:0;">Перевіримо себе</h3></div>`;
    QUIZ_ACTIVE.forEach((item, qi) => {
      html += `
        <div class="quiz-q">
          <div class="task-q"><span class="q-num">${qi + 1}.</span> ${item.q}</div>
          <div class="opt-list" data-qi="${qi}">
            ${item.opts.map((o, oi) => `
              <label class="opt" data-oi="${oi}">
                <input type="radio" name="quiz-${qi}" value="${oi}">
                <span>${o}</span>
              </label>`).join('')}
          </div>
        </div>`;
    });
    html += `<button class="check-btn" onclick="LessonEngine.submitQuiz()">Перевірити тест</button></div>`;
    return html;
  };
  let quizAnswers = {}, quizChecked = false;
  LessonEngine.attachQuizHandlers = function () {
    quizChecked = false; quizAnswers = {};
    document.querySelectorAll('#step-panel .opt-list[data-qi]').forEach(list => {
      const qi = list.dataset.qi;
      list.querySelectorAll('.opt').forEach(opt => {
        opt.addEventListener('click', () => {
          if (quizChecked) return;
          quizAnswers[qi] = parseInt(opt.dataset.oi);
          list.querySelectorAll('.opt').forEach(o => o.querySelector('input').checked = false);
          opt.querySelector('input').checked = true;
        });
      });
    });
  };
  LessonEngine.submitQuiz = function () {
    let score = 0;
    QUIZ_ACTIVE.forEach((item, qi) => {
      const list = document.querySelector(`#step-panel .opt-list[data-qi="${qi}"]`);
      const chosen = quizAnswers[qi];
      list.querySelectorAll('.opt').forEach((opt, oi) => {
        if (oi === item.correct) opt.classList.add('correct');
        else if (oi === chosen) opt.classList.add('incorrect');
      });
      if (chosen === item.correct) score++;
    });
    quizChecked = true;
    const total = QUIZ_ACTIVE.length;
    const pct = Math.round(score / total * 100);
    let tier = 'retry', msg = 'Варто повернутися до теорії й спробувати ще раз.', emoji = '💪';
    if (pct >= 85) { tier = 'great'; msg = 'Чудовий результат — тему засвоєно міцно!'; emoji = '🏆'; }
    else if (pct >= 60) { tier = 'ok'; msg = 'Непогано! Погляньте ще раз питання, де були помилки.'; emoji = '👍'; }
    document.getElementById('quiz-result-slot').innerHTML = `
      <div class="score-banner ${tier}" id="score-banner">
        <div class="score-num">${score}/${total}</div>
        <div><div style="font-weight:700;">${emoji} ${msg}</div><div class="subtle">Правильні відповіді підсвічено зеленим, помилкові — червоним.</div></div>
      </div>`;
    if (tier === 'great') {
      const banner = document.getElementById('score-banner');
      const bits = ['🎉', '✨', '⭐', '🎊', '💚'];
      for (let i = 0; i < 14; i++) {
        const span = document.createElement('span');
        span.className = 'confetti-emoji';
        span.textContent = bits[i % bits.length];
        span.style.left = (Math.random() * 90 + 2) + '%';
        span.style.animationDelay = (Math.random() * 0.4) + 's';
        banner.appendChild(span);
      }
    }
    if (CFG && CFG.onQuizDone) CFG.onQuizDone(score, total);
  };

  /* ---------------- mood / recap ---------------- */
  const MOODS = [
    { emoji: '🤩', label: 'Було чудово', response: 'Супер! Візьми цю впевненість на наступний урок.' },
    { emoji: '🙂', label: 'Нормально', response: 'Добре. Погляньте ще раз на картки з теорії, якщо є сумніви.' },
    { emoji: '😐', label: 'Так собі', response: 'Нічого страшного — поверніться до розділу «Теорія» і спробуйте гру ще раз.' },
    { emoji: '😵\u200d💫', label: 'Було складно', response: 'Це нормально для нової теми. Попроси вчительку пояснити ще раз.' },
  ];
  LessonEngine.moodRow = function () {
    return MOODS.map((m, i) => `<button class="mood-btn" data-i="${i}" title="${m.label}">${m.emoji}</button>`).join('');
  };
  LessonEngine.attachMoodPicker = function () {
    const row = document.getElementById('mood-row');
    if (!row) return;
    row.querySelectorAll('.mood-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('picked'));
        btn.classList.add('picked');
        document.getElementById('mood-response').textContent = MOODS[i].response;
        if (CFG && CFG.onMood) CFG.onMood(MOODS[i].label);
      });
    });
  };

  global.LessonEngine = LessonEngine;
})(window);

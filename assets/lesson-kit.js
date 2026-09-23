/* =========================================================
   LessonKit — маленькі інтерактивні "конструктори" вправ,
   спільні для сторінок домашніх завдань. Підключай на сторінці
   після style.css і викликай потрібні функції з даними уроку.
   ========================================================= */
(function (global) {
  const LessonKit = {};

  LessonKit.progress = { earned: 0, total: 0 };

  LessonKit.setTotalStars = function (n) {
    LessonKit.progress.total = n;
    LessonKit.renderProgress();
  };

  LessonKit.renderProgress = function () {
    const fill = document.querySelector('.progress-fill');
    const starsEl = document.querySelector('.progress-bar .stars');
    const { earned, total } = LessonKit.progress;
    if (fill) fill.style.width = total ? Math.round((earned / total) * 100) + '%' : '0%';
    if (starsEl) starsEl.textContent = '★'.repeat(earned) + '☆'.repeat(Math.max(total - earned, 0));
  };

  LessonKit.addStar = function (x, y) {
    LessonKit.progress.earned += 1;
    LessonKit.renderProgress();
    if (x !== undefined) LessonKit.burst(x, y);
  };

  LessonKit.burst = function (x, y) {
    const el = document.createElement('div');
    el.className = 'burst';
    el.textContent = '⭐';
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = 999;
    el.style.fontSize = '2rem';
    el.style.animation = 'pop-burst .7s ease forwards';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  };

  LessonKit.initChoice = function (container, options, okMsg, noMsg) {
    const choicesEl = container.querySelector('.choices');
    const feedback = container.querySelector('.feedback');
    let answered = false;
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', (e) => {
        if (answered) return;
        answered = true;
        Array.from(choicesEl.children).forEach(b => b.disabled = true);
        if (opt.correct) {
          btn.classList.add('correct');
          feedback.textContent = okMsg || '✓ Правильно!';
          feedback.className = 'feedback ok';
          LessonKit.addStar(e.clientX, e.clientY);
        } else {
          btn.classList.add('wrong');
          feedback.textContent = noMsg || '✗ Не зовсім. Спробуй наступного разу уважніше.';
          feedback.className = 'feedback bad';
          const correctBtn = Array.from(choicesEl.children).find((b, i) => options[i].correct);
          if (correctBtn) correctBtn.classList.add('correct');
        }
      });
      choicesEl.appendChild(btn);
    });
  };

  LessonKit.initOrderBuilder = function (container, correctWords, onSolved) {
    const pool = container.querySelector('.order-pool');
    const answer = container.querySelector('.order-answer');
    const feedback = container.querySelector('.feedback');
    const shuffled = [...correctWords].sort(() => Math.random() - 0.5);
    const chosen = [];

    function renderPool() {
      pool.innerHTML = '';
      shuffled.forEach((w, i) => {
        const btn = document.createElement('button');
        btn.className = 'order-word';
        btn.textContent = w;
        btn.disabled = chosen.includes(i);
        btn.addEventListener('click', () => { chosen.push(i); renderPool(); renderAnswer(); });
        pool.appendChild(btn);
      });
    }
    function renderAnswer() {
      answer.innerHTML = '';
      chosen.forEach(i => {
        const span = document.createElement('button');
        span.className = 'order-word';
        span.textContent = shuffled[i];
        span.title = 'Прибрати слово';
        span.addEventListener('click', () => { chosen.splice(chosen.indexOf(i), 1); renderPool(); renderAnswer(); });
        answer.appendChild(span);
      });
      if (chosen.length === correctWords.length) {
        const built = chosen.map(i => shuffled[i]).join(' ');
        const target = correctWords.join(' ');
        if (built.toLowerCase() === target.toLowerCase()) {
          feedback.textContent = '✓ Так! Речення побудовано правильно.';
          feedback.className = 'feedback ok';
          const rect = answer.getBoundingClientRect();
          LessonKit.addStar(rect.left + rect.width / 2, rect.top);
          onSolved && onSolved(true);
        } else {
          feedback.textContent = '✗ Порядок слів ще не той. Прибери слово і постав інакше.';
          feedback.className = 'feedback bad';
          onSolved && onSolved(false);
        }
      } else {
        feedback.textContent = '';
      }
    }
    renderPool();
    renderAnswer();
  };

  LessonKit.initChecklist = function (containerSel) {
    document.querySelectorAll(containerSel + ' input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => cb.closest('li').classList.toggle('done', cb.checked));
    });
  };

  global.LessonKit = LessonKit;
})(window);

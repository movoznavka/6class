/* =========================================================
   Platform — облік учнів 5–7 класів, вхід без пароля за іменем,
   збереження прогресу й ДЗ у Firestore, дані для вчительської
   панелі. Урок = { id, title, topic, file, dzFile }.
   ========================================================= */
(function (global) {
  const Platform = {};
  const KEY = 'slovesnist_current_student';

  /* Реєстр уроків по класах. Додайте сюди новий урок, коли
     створите для нього файл(и) у lessons-N/. */
  Platform.LESSONS = {
    '5': [],
    '6': [
      { id: 'l6-01', title: 'Урок 1. Словосполучення і речення. Головні й другорядні члени речення', topic: 'Синтаксис · §4–5', file: 'lessons-6/lesson-01.html', dzFile: 'lessons-6/lesson-01-dz.html' },
      { id: 'l6-02', title: 'Урок 2. Звертання. Вставні слова. Однорідні члени речення', topic: 'Синтаксис · §6', file: 'lessons-6/lesson-02.html', dzFile: 'lessons-6/lesson-02-dz.html' },
      { id: 'l6-03', title: 'Урок 3. Складне речення. Пряма мова. Діалог', topic: 'Синтаксис · §7', file: 'lessons-6/lesson-03.html', dzFile: 'lessons-6/lesson-03-dz.html' },
    ],
    '7': [],
  };

  Platform.GRADES = ['5', '6', '7'];

  /* Список учнів живе у Firestore (колекція "roster") — вчителька
     додає/видаляє учнів прямо в панелі /teacher/, без правок коду.
     Поки Firebase не налаштовано (або немає інтернету), сайт показує
     запасний список із assets/students.js, щоб можна було все побачити. */
  Platform.getStudentsAsync = function (grade) {
    if (!window.db) {
      const demo = (global.PLATFORM_STUDENTS || []).slice();
      return Promise.resolve(grade ? demo.filter(s => String(s.grade) === String(grade)) : demo);
    }
    return window.db.collection('roster').get().then(snap => {
      const all = [];
      snap.forEach(doc => all.push({ name: doc.id, grade: doc.data().grade }));
      all.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
      return grade ? all.filter(s => String(s.grade) === String(grade)) : all;
    }).catch(() => (global.PLATFORM_STUDENTS || []));
  };

  Platform.addStudent = function (name, grade) {
    if (!window.db) return Promise.reject('Firebase не налаштовано — див. README.md');
    return window.db.collection('roster').doc(name).set({ grade: String(grade), createdAt: new Date().toISOString() });
  };

  Platform.removeStudent = function (name) {
    if (!window.db) return Promise.reject('Firebase не налаштовано');
    return window.db.collection('roster').doc(name).delete();
  };

  /* Синхронна версія лишається для сумісності там, де Firestore недоступний */
  Platform.getStudents = function (grade) {
    const all = (global.PLATFORM_STUDENTS || []).slice();
    return grade ? all.filter(s => String(s.grade) === String(grade)) : all;
  };

  Platform.getCurrentStudent = function () {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null; // {name, grade}
  };

  Platform.setCurrentStudent = function (name, grade) {
    localStorage.setItem(KEY, JSON.stringify({ name, grade }));
  };

  Platform.logout = function () {
    localStorage.removeItem(KEY);
    location.href = Platform.rootPath() + 'login.html';
  };

  Platform.rootPath = function () {
    const p = location.pathname;
    return (p.includes('/lessons-5/') || p.includes('/lessons-6/') || p.includes('/lessons-7/') || p.includes('/teacher/')) ? '../' : '';
  };

  Platform.guard = function () {
    if (!Platform.getCurrentStudent()) {
      location.href = Platform.rootPath() + 'login.html?next=' + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  };

  function studentRef(name) { return window.db.collection('students').doc(name); }
  function lessonRef(name, lessonId) { return studentRef(name).collection('lessons').doc(lessonId); }

  Platform.saveProgress = function (lessonId, data) {
    const student = Platform.getCurrentStudent();
    if (!student || !window.db) return;
    lessonRef(student.name, lessonId).set(Object.assign({
      studentName: student.name, grade: student.grade, lessonId: lessonId,
      updatedAt: new Date().toISOString()
    }, data), { merge: true }).catch(e => console.warn('Не вдалося зберегти прогрес онлайн:', e));
  };

  Platform.getProgress = function (lessonId) {
    const student = Platform.getCurrentStudent();
    if (!student || !window.db) return Promise.resolve(null);
    return lessonRef(student.name, lessonId).get().then(doc => doc.exists ? doc.data() : null).catch(() => null);
  };

  /* Прогрес усіх учнів по всіх їхніх уроках (для вчительської панелі).
     students — масив {name, grade}, отриманий через getStudentsAsync(). */
  Platform.getAllProgress = function (students) {
    if (!window.db) return Promise.resolve({});
    const jobs = []; const result = {};
    students.forEach(s => {
      result[s.name] = {};
      const lessons = Platform.LESSONS[s.grade] || [];
      lessons.forEach(l => {
        jobs.push(lessonRef(s.name, l.id).get().then(doc => { result[s.name][l.id] = doc.exists ? doc.data() : null; }).catch(() => { result[s.name][l.id] = null; }));
      });
    });
    return Promise.all(jobs).then(() => result);
  };

  function studentBadge() {
    const student = Platform.getCurrentStudent();
    if (!student) return;
    const bar = document.querySelector('.progress-bar');
    if (!bar) return;
    const badge = document.createElement('span');
    badge.className = 'student-badge';
    badge.innerHTML = '👤 ' + student.name + ' · <a href="#" id="platform-logout" class="back-link" style="opacity:1">Вийти</a>';
    bar.appendChild(badge);
    const lo = document.getElementById('platform-logout');
    if (lo) lo.addEventListener('click', e => { e.preventDefault(); Platform.logout(); });
  }

  /* Підключити сторінку класної роботи (LessonEngine) до платформи */
  Platform.initLessonPage = function (lessonId, lessonTitle) {
    if (!Platform.getCurrentStudent()) return;
    studentBadge();
    Platform.getProgress(lessonId).then(data => {
      // майбутнє: відновлення прогресу кроків, якщо знадобиться
    });
    return {
      onQuizDone(score, total) {
        Platform.saveProgress(lessonId, { quizScore: score, quizTotal: total, lessonTitle: lessonTitle });
      }
    };
  };

  /* Підключити сторінку ДЗ (LessonKit) до платформи */
  Platform.initHomeworkPage = function (lessonId, lessonTitle) {
    if (!Platform.getCurrentStudent()) return;
    studentBadge();
    if (global.LessonKit) {
      const originalAddStar = LessonKit.addStar;
      LessonKit.addStar = function (x, y) {
        originalAddStar(x, y);
        Platform.saveProgress(lessonId, { hwStars: LessonKit.progress.earned, hwTotalStars: LessonKit.progress.total, lessonTitle: lessonTitle });
      };
    }
    const hwList = document.getElementById('hw-list');
    if (hwList) {
      const boxes = Array.from(hwList.querySelectorAll('input[type=checkbox]'));
      function saveHomework() {
        const done = boxes.filter(b => b.checked).length;
        Platform.saveProgress(lessonId, {
          homeworkDone: done, homeworkTotal: boxes.length,
          homeworkComplete: done === boxes.length && boxes.length > 0, lessonTitle: lessonTitle
        });
      }
      boxes.forEach(cb => cb.addEventListener('change', saveHomework));
    }
    Platform.getProgress(lessonId).then(data => {
      if (data && typeof data.hwStars === 'number' && global.LessonKit) {
        LessonKit.progress.earned = data.hwStars;
        LessonKit.renderProgress();
      }
    });
  };

  global.Platform = Platform;
})(window);

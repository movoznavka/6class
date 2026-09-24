/* =========================================================
   Налаштування Firebase.
   1. Створіть безкоштовний проєкт на https://console.firebase.google.com
   2. Додайте веб-застосунок (Web app) — Firebase покаже об'єкт
      firebaseConfig приблизно такого вигляду. Скопіюйте свої значення
      і вставте їх сюди замість прикладу.
   3. У розділі Build → Firestore Database натисніть "Create database"
      (режим "test mode" достатньо для старту).
   Детальна інструкція — у README.md цього проєкту.
   ========================================================= */
const firebaseConfig = {
  apiKey: "ВАШ_apiKey",
  authDomain: "ВАШ_authDomain",
  projectId: "ВАШ_projectId",
  storageBucket: "ВАШ_storageBucket",
  messagingSenderId: "ВАШ_messagingSenderId",
  appId: "ВАШ_appId"
};

/* Пароль (код доступу) вчительської панелі /teacher/.
   Змініть на власний — будь-яке слово чи цифри. */
window.TEACHER_PASSCODE = "12345";

// --- нижче нічого міняти не потрібно ---
try {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
} catch (e) {
  console.warn("Firebase не налаштовано — прогрес не буде зберігатися онлайн.", e);
}

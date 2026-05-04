📦 ФАЙЛИ ДЛЯ GITHUB PAGES
════════════════════════════════════════════════════════════════

✅ ГОТОВО! Усе в папці `github/`

Структура:
```
github/
├── index.html              ← Форма входу/реєстрації
├── entrance.html           ← Панель з QR для адміна
├── dashboard.html          ← Панель студента
├── css/
│   └── style.css          ← Всі стилі
└── js/
    ├── firebase-config.js  ← Firebase конфіг (з твоїми credentials)
    ├── qr-handler.js       ← QR генерація/сканування
    ├── features.js         ← Ремонти, платежі, логи
    └── admin-advanced.js   ← Адміністраторські функції
```

════════════════════════════════════════════════════════════════

🚀 ЯК ГРУЗИТИ НА GITHUB

КРОК 1: Вибери де будуть файли
─────────────────────────────────
Всі файли в папці `github/` - це те що потрібно грузити.
Скопіюй ВСЮ ПАПКУ або ВСІ файли з неї.

КРОК 2: Завантаж на GitHub Pages
──────────────────────────────────

ВАРІАНТ A: Через браузер (найпростіше)
1. Перейди на https://github.com/new
2. Назва: smartdorm
3. Натисни "Create repository"
4. Натисни "uploading an existing file"
   (або перейди на вкладку "Add file" → "Upload files")
5. Перетягни всі файли з папки `github/` сюди
6. Натисни "Commit changes"
7. В репозиторії перейди Settings → Pages
8. Branch: main, folder: /
9. Готово! URL: https://твійюзер.github.io/smartdorm

ВАРІАНТ B: Через GitHub Desktop
1. Встанови https://desktop.github.com/
2. File → Clone Repository
3. Введи: https://github.com/твійюзер/smartdorm.git
4. Скопіюй всі файли з `github/` папки в клоновану папку
5. GitHub Desktop → Commit to main
6. Push origin
7. Готово!

ВАРІАНТ C: Через Git команди
1. git clone https://github.com/твійюзер/smartdorm.git
2. cd smartdorm
3. Скопіюй всі файли з `github/` сюди
4. git add .
5. git commit -m "Initial SmartDorm system"
6. git push origin main

════════════════════════════════════════════════════════════════

❗ ВАЖЛИВО!

✅ firebase-config.js уже має твої Firebase credentials
   Не потрібно нічого додавати!

✅ Не потрібні ці файли:
   - server.py (локальний сервер)
   - package.json (npm - не потрібен)
   - firebase.json (Firebase Hosting - не потрібен)
   - .firebaserc (Firebase CLI - не потрібен)

✅ Firebase SDK завантажується з CDN
   Не потрібно встановлювати npm модулі

════════════════════════════════════════════════════════════════

✨ ПІСЛЯ ЗАГРУЗКИ

1. Чекай 2-3 хвилини на розгортання
2. Перейди на: https://твійюзер.github.io/smartdorm
3. Натисни на вкладці браузера F5 (перезавантаж)
4. Повинна виконати форма входу!
5. Спробуй реєструватися

════════════════════════════════════════════════════════════════

🔗 ОНОВЛЕННЯ QR КОДУ

Тепер QR код буде вказувати на GitHub Pages!
Просто відкрий entrance.html з ПК - QR буде генеруватися автоматично.

════════════════════════════════════════════════════════════════

❓ ЯКЩО ЧО-НЕБУДЬ НЕ ПРАЦЮЄ

✅ Перевір чи всі файли в main гілці
✅ Settings → Pages → Branch main, folder /
✅ Очисти кеш браузера (Ctrl+Shift+Delete)
✅ Чекай 5 хвилин - іноді GitHub Pages повільно розгортається
✅ Перевір console браузера (F12 → Console) на помилки

════════════════════════════════════════════════════════════════

# NBB Mobile Prototype Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkboxes track progress.

**Goal:** Prototipe mobile mandiri New Baby Born (foto → OCR simulasi → review penuh → draft → Kirim semua) dengan web presentasi + jalur APK Flutter WebView.

**Architecture:** HTML/CSS/JS mirip Falcon SFA; `NbbStore` (localStorage); `NbbApi` stub; Flutter WebView wrapper.

**Tech Stack:** Vanilla HTML/CSS/JS, Bootstrap 5 CDN, Font Awesome, Flutter + webview_flutter.

## Global Constraints

- Source of truth: `Views/Mobile/` + `wwwroot/` (jangan edit hanya di assets Flutter).
- OCR = simulasi saja (tidak panggil engine OCR).
- Branding: Falcon colors + aksen label NBB.
- Path root: `D:\Work\Source\Comsup\New Baby Born`

---

### Task 1: Core CSS + Store + API + master data

- [ ] `wwwroot/css/mobile.css` — wrapper, header, nav, form, wizard, badges NBB
- [ ] `wwwroot/js/nbb-store.js` — session, masters, CRUD submissions, OCR simulate
- [ ] `wwwroot/js/nbb-api.js` — submitBatch mock/stub
- [ ] `wwwroot/data/masters.json` — cabang, rayon, submission, BR, RS, produk, dll.

### Task 2: Screens

- [ ] `login.html`, `home.html`, `capture.html`, `review.html`, `history.html`, `profil.html`

### Task 3: APK path

- [ ] `scripts/create-flutter-wrapper.js`, `build-apk.bat`
- [ ] `Mobile/MobileApp/lib/main.dart`, `pubspec.yaml`, README setup Flutter
- [ ] Root `README.md` cara presentasi + build APK

### Task 4: Smoke check

- [ ] Buka login di browser; alur foto → simpan → kirim semua berjalan

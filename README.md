# New Baby Born (NBB) — Mobile Prototype

Prototipe mandiri untuk BR Kalbe Nutritionals: **foto buku baby born → OCR list → verifikasi baris → kirim 1 foto**.

Visual: **Falcon shell** + aksen modul **New Baby Born**. Siap presentasi web dan jalur build **APK** (Flutter WebView).

## Presentasi (web)

**Cara termudah:** double-click **`start-web.bat`** di folder project (server + browser terbuka).

Atau manual:

```bat
node scripts\static-server.js "D:\Work\Source\Comsup\New Baby Born" 5503
```

Lalu buka: http://127.0.0.1:5503/Views/Mobile/login.html

> Jendela terminal/server **harus tetap terbuka**. Kalau ditutup → `ERR_CONNECTION_REFUSED`.

**Alur demo:** Login → Foto → List hasil OCR → klik baris → Verifikasi → ulang sampai semua verified → **Kirim data foto ini**.

Login: `br01` / `demo`

## Struktur

```
Views/Mobile/     # UI (source of truth)
wwwroot/          # css, js, data
Mobile/MobileApp/ # Flutter WebView (dibuat via flutter create / build-apk.bat)
scripts/          # sync aset ke Flutter
docs/superpowers/ # design + plan
build-apk.bat     # build APK release
```

## Build APK

Prasyarat: Flutter SDK + Android toolchain (`flutter doctor`).

```bat
build-apk.bat
```

Script akan:
1. `flutter create` jika project belum ada
2. Sync `Views/Mobile` + `wwwroot` → `Mobile/MobileApp/assets/www`
3. Pasang `main.dart` WebView
4. `flutter build apk --release` → `app-release.apk` di root

## Dokumen

- **Dokumentasi proyek:** [`Documentation/`](Documentation/README.md) (overview, **master data**, alur data)
- Master data target: https://masterdata.kalbenutritionals.com/ — lihat [`Documentation/02-master-data.md`](Documentation/02-master-data.md)
- Spec: `docs/superpowers/specs/2026-07-17-nbb-mobile-prototype-design.md`
- Plan: `docs/superpowers/plans/2026-07-17-nbb-mobile-prototype.md`
- Referensi field Octo: `List View or SP Octo.xlsx`
- Latar belakang: `project NBB(new baby born).txt`

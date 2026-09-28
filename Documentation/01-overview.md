# 01 — Overview proyek NBB

## Tujuan bisnis

BR / MAE mengunjungi RS, merekam data newborn dari buku baby born ke CRM. Alur lama (foto → admin → input desktop Octo) sering menghasilkan data fiktif. NBB mendemokan captura di mobile: foto + OCR (simulasi) atau **input manual**, verifikasi baris, lalu submit batch.

## Fitur prototipe

1. **Foto buku** → OCR simulasi menghasilkan **list** baris → verifikasi per detail → kirim 1 foto (banyak baris).
2. **Input manual** → tanpa foto, tambah baris tanpa batas → verifikasi → kirim.
3. Konteks shared per batch (cabang, BR, sumber data/RS, dll.).
4. Produk Prospek di level **detail baris**.
5. Offline-first ringan via `localStorage` (`NbbStore`).

## Stack

| Layer | Teknologi |
|-------|-----------|
| UI | HTML / CSS / JS, Bootstrap 5, Font Awesome |
| State | `localStorage` — `NbbStore` |
| API submit | Stub `NbbApi` (`useMock: true`) |
| Master data (demo) | `wwwroot/data/masters.json` |
| Master data (target) | https://masterdata.kalbenutritionals.com/ |
| APK | Flutter WebView membungkus aset HTML |

## Struktur folder (source of truth)

```
Views/Mobile/          # Halaman UI (edit di sini, bukan di Flutter assets)
wwwroot/css|js|data    # Style, NbbStore, NbbApi, masters stub
Mobile/MobileApp/      # Flutter wrapper → sync via scripts/create-flutter-wrapper.js
scripts/               # static-server, sync Flutter
Documentation/         # Dokumentasi proyek (folder ini)
docs/superpowers/      # Spec & plan desain awal
```

## Cara menjalankan (web)

```bat
start-web.bat
```

atau:

```bat
node scripts\static-server.js "D:\Work\Source\Comsup\New Baby Born" 5503
```

URL: http://127.0.0.1:5503/Views/Mobile/login.html  

Demo login: `br01` / `demo` (atau `br02` / `demo`)

## Build APK

```bat
build-apk.bat
```

Output: `app-release.apk` di root proyek.

## Referensi terkait

- Spec desain: `docs/superpowers/specs/2026-07-17-nbb-mobile-prototype-design.md`
- Field Octo (Excel): `List View or SP Octo.xlsx`
- Latar belakang bisnis: `project NBB(new baby born).txt`
- Master data: [02-master-data.md](02-master-data.md)

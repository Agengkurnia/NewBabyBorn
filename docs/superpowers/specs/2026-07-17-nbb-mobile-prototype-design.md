# NBB Mobile Prototype — Design Spec

**Date:** 2026-07-17 (updated 2026-09-22: list + verifikasi per baris)  
**Project:** New Baby Born (NBB) — Kalbe Nutritionals BR field capture  
**Status:** Approved for implementation

## Problem

BR cabang regional memfoto buku baby born di RS lalu data masuk CRM. Alur lama: BR → admin → input desktop Octo. Sering muncul data fiktif (HP tidak valid / bukan newborn). Solusi: menu mobile di Falcon — BR foto + OCR, kurangi input manual palsu.

## Goals (prototype)

1. Demo hybrid: foto → OCR **simulasi list** → verifikasi baris satu-satu → **kirim 1 foto** (banyak baris).
2. Presentasi via **web view** (browser, container mobile).
3. Siap bungkus **APK** (Flutter WebView), pola sama Falcon Prototype.
4. Offline-first ringan + **stub API** (ganti endpoint nyata nanti).
5. Aplikasi **mandiri** (login NBB sendiri); visual **Falcon shell + aksen NBB**.

## Non-goals (v1)

- OCR engine nyata (Tesseract/API).
- Role admin/tele.
- Integrasi live ke `spOctoSimpanData` / CRM.
- Merge fisik ke repo Falcon (hanya pola yang selaras).

## Architecture

```
Views/Mobile/*.html     → UI source of truth
wwwroot/css|js|data     → styles, NbbStore, NbbApi stub, master JSON
Mobile/MobileApp        → Flutter WebView → APK
scripts + build-apk.bat → sync assets + flutter build apk
```

**Data:** `localStorage` via `NbbStore` — unit antrean = **batch foto** + `items[]`.  
**OCR:** delay + seed beberapa baris dari `ocrSamples` (bukan baca gambar).  
**Submit:** `NbbApi.submitBatch(batchId)` — mock HTTP; config `apiBaseUrl` + `useMock`.

## Screens

| Screen | Path | Role |
|--------|------|------|
| Login | `login.html` | Demo BR session |
| Home | `home.html` | CTA ambil data, ringkasan draft/terkirim **batch** |
| Capture | `capture.html` | Foto/pilih gambar → Proses OCR (sim) |
| List | `list.html` | Konteks shared + daftar baris + progress verified + kirim foto |
| Review | `review.html` | Wizard per baris → Tandai terverifikasi |
| History | `history.html` | Card per batch foto; buka ulang draft; kirim ulang |
| Profil | `profil.html` | Session, logout, tip API mock |

### Review wizard steps (per baris)

1. **Status & produk** — Produk Prospek, Pakai, Jml Pakai, Kemasan, Status Saat Ini, Sample, Status Hasil Call, Produk Kompetitor  
2. **PIC** — Nama, JK, tgl lahir, alamat/wilayah, HP (wajib), telp, email  
3. **Pelanggan** — PIC adalah pelanggan, nama/JK/tgl lahir, hub dgn PIC, medical record  
4. **Konfirmasi** → **Tandai terverifikasi**

Konteks shared (cabang, BR, RS, jenis submission) diisi di **list**. Produk Prospek diisi per baris di **review**.

## Save / submit flow

1. OCR → draft batch di `nbb_draft_capture_v1` (belum di history).  
2. Verifikasi tiap item (`verified: true`).  
3. **Simpan draft foto** → `nbb_batches_v1` status `draft`.  
4. **Kirim data foto ini** — hanya jika semua item verified + validasi lolos → stub API → `submitted` / `failed`.

## Data model (batch)

```
Batch {
  id, photoDataUrl, status (draft|submitted|failed),
  cabangId, rayonId, jenisSubmissionId, namaProjectId, brId, sumberDataId,
  items: [{ id, verified, produkProspekId, /* field per-baris PIC/produk/pelanggan */ }]
}
```

Payload submit: `{ batchId, context, items[] }` (map mirip `spOctoSimpanData` per item).

## Branding

- Primary Falcon: `#005D41`, accent `#78B500`, bg light `#F1F7E5`
- Aksen NBB: label “New Baby Born”, chip/badge modul di home/header
- Mobile wrapper max-width 450px (presentasi desktop)

## Demo credentials

- User: `br01` / `demo` atau `br02` / `demo`

## Error handling

- Validasi konteks batch + validasi tiap item sebelum verifikasi/submit
- Kirim disabled sampai semua baris verified
- Submit gagal (mock random opsional off by default): status `failed`, tombol kirim ulang di History
- Tanpa foto: block proses OCR

## Testing (manual presentasi)

1. Login → home 0 draft.  
2. Ambil foto → list ≥3 baris.  
3. Isi konteks → buka baris → tandai terverifikasi → ulang sampai semua.  
4. Kirim data foto ini → History Terkirim.  
5. Buka di HP browser / APK WebView.

## APK

- Sync `Views/Mobile` + `wwwroot` → `Mobile/MobileApp/assets/www`
- `flutter build apk --release` → `app-release.apk` di root NBB

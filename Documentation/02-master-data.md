# 02 — Master Data

## Sumber resmi

**Base URL (wajib untuk produksi / integrasi):**

```
https://masterdata.kalbenutritionals.com/
```

Seluruh **master data** yang dipakai modul New Baby Born (dropdown, filter, relasi cabang–rayon, RS/sumber data, produk, wilayah, dll.) **tidak boleh hardcode permanen** di client. Prototipe saat ini memakai file lokal hanya untuk demo.

| Lingkungan | Sumber master |
|------------|---------------|
| Prototipe / presentasi | `wwwroot/data/masters.json` (stub) |
| Staging / Production | **https://masterdata.kalbenutritionals.com/** (+ cache lokal bila offline) |

> Portal Master Data Kalbe Nutritionals adalah sistem pusat referensi data. Endpoint path, auth, dan schema detail mengikuti dokumentasi / kontrak API di portal tersebut (koordinasikan dengan tim Master Data / Integration).

---

## Status integrasi di proyek ini

| Item | Saat ini | Target |
|------|----------|--------|
| Load master | `NbbStore.ensureMasters()` → `fetch('../../wwwroot/data/masters.json')` | `fetch` / client SDK ke Master Data Kalbe |
| Cache | `localStorage` key `nbb_masters_v2` | Cache hasil API + TTL / version / ETag |
| Auth | Tidak ada | Token / API key sesuai standar portal |
| Fallback offline | Stub JSON | Cache terakhir yang sukses + indikator “data mungkin usang” |

File terkait:

- Stub: [`wwwroot/data/masters.json`](../wwwroot/data/masters.json)
- Loader: [`wwwroot/js/nbb-store.js`](../wwwroot/js/nbb-store.js) → `ensureMasters()`
- Konfigurasi API submit (terpisah dari master): `NbbStore.getConfig()` → `apiBaseUrl`, `useMock`

---

## Entitas master yang dipakai NBB

Mapping ke struktur stub lokal. Nama koleksi / resource di Master Data Kalbe **harus diselaraskan** dengan tim pemilik portal (nama di kolom “Resource target” bersifat usulan hingga dikonfirmasi).

### 1. Organisasi & wilayah kerja

| Koleksi lokal | Dipakai di | Relasi | Field minimal | Resource target (usulan) |
|---------------|------------|--------|---------------|---------------------------|
| `cabang` | List (konteks batch), session BR | — | `id`, `nama` | Cabang / Branch |
| `rayon` | List | `cabangId` → cabang | `id`, `cabangId`, `nama` | Rayon |
| `brList` | List (Nama BR / MAE) | `cabangId` → cabang | `id`, `cabangId`, `nama` | BR / MAE (user / salesman) |
| `sumberData` | List (RS / sumber) | `cabangId` → cabang | `id`, `cabangId`, `nama` | Sumber data / Rumah sakit |

### 2. Submission & produk

| Koleksi lokal | Dipakai di | Relasi | Field minimal | Resource target (usulan) |
|---------------|------------|--------|---------------|---------------------------|
| `jenisSubmission` | List | — | `id`, `nama`, `statusSaatIni`, `statusHasilCall` | Jenis submission |
| `namaProject` | List | `jenisSubmissionId` | `id`, `jenisSubmissionId`, `nama` | Nama project / campaign |
| `produkProspek` | **Detail baris** (review) | `jenisSubmissionId` | `id`, `jenisSubmissionId`, `nama` | Produk prospek |
| `produkKompetitor` | Detail baris | — | `id`, `nama` | Produk kompetitor |

### 3. Referensi PIC / pelanggan

| Koleksi lokal | Dipakai di | Field minimal | Resource target (usulan) |
|---------------|------------|---------------|---------------------------|
| `hubunganPic` | Detail (hubungan dgn PIC) | `id`, `nama` | Hubungan PIC |

### 4. Wilayah administratif

| Koleksi lokal | Dipakai di | Relasi | Field minimal | Resource target (usulan) |
|---------------|------------|--------|---------------|---------------------------|
| `propinsi` | Detail PIC | — | `id`, `nama` | Provinsi |
| `kota` | Detail PIC | `propinsiId` | `id`, `propinsiId`, `nama` | Kota / Kabupaten |
| `kecamatan` | Detail PIC | `kotaId` | `id`, `kotaId`, `nama` | Kecamatan |
| `kelurahan` | Detail PIC | `kecamatanId` | `id`, `kecamatanId`, `nama` | Kelurahan |

### 5. Bukan master produksi

| Koleksi lokal | Keterangan |
|---------------|------------|
| `ocrSamples` | **Hanya prototipe** — seed simulasi OCR. Tidak diambil dari Master Data. |

---

## Cascade / filter di UI

Dropdown saling bergantung. Saat integrasi API, endpoint sebaiknya mendukung filter query yang sama:

```
cabangId
  → rayon (cabangId)
  → brList (cabangId)
  → sumberData (cabangId)

jenisSubmissionId
  → namaProject (jenisSubmissionId)
  → produkProspek (jenisSubmissionId)   // di form detail baris

propinsiId → kota → kecamatan → kelurahan
```

Implementasi filter saat ini ada di:

- [`Views/Mobile/list.html`](../Views/Mobile/list.html) — konteks shared
- [`Views/Mobile/review.html`](../Views/Mobile/review.html) — produk & wilayah

---

## Shape data lokal (kontrak minimal client)

Contoh shape yang diharapkan client setelah mapping dari Master Data:

```json
{
  "cabang": [{ "id": "…", "nama": "…" }],
  "rayon": [{ "id": "…", "cabangId": "…", "nama": "…" }],
  "jenisSubmission": [{
    "id": "…",
    "nama": "…",
    "statusSaatIni": "…",
    "statusHasilCall": "…"
  }],
  "namaProject": [{ "id": "…", "jenisSubmissionId": "…", "nama": "…" }],
  "brList": [{ "id": "…", "cabangId": "…", "nama": "…" }],
  "sumberData": [{ "id": "…", "cabangId": "…", "nama": "…" }],
  "produkProspek": [{ "id": "…", "jenisSubmissionId": "…", "nama": "…" }],
  "produkKompetitor": [{ "id": "…", "nama": "…" }],
  "hubunganPic": [{ "id": "…", "nama": "…" }],
  "propinsi": [{ "id": "…", "nama": "…" }],
  "kota": [{ "id": "…", "propinsiId": "…", "nama": "…" }],
  "kecamatan": [{ "id": "…", "kotaId": "…", "nama": "…" }],
  "kelurahan": [{ "id": "…", "kecamatanId": "…", "nama": "…" }]
}
```

**Catatan ID:** di produksi, `id` harus memakai kode resmi Master Data / Octo (bukan `C-JKT1` demo), agar submit ke CRM konsisten.

---

## Rencana integrasi (disarankan)

### Fase A — Discovery

1. Akses portal https://masterdata.kalbenutritionals.com/
2. Inventarisasi API / feed per entitas di atas (path, method, auth, paging).
3. Mapping field portal → shape client (tabel di atas).
4. Konfirmasi kode Cabang, BR, RS, Produk yang dipakai Octo / Falcon.

### Fase B — Adapter di client

1. Tambah config, contoh:

```js
{
  masterDataBaseUrl: 'https://masterdata.kalbenutritionals.com',
  useLocalMasters: false,   // true hanya untuk demo offline
  mastersCacheTtlMs: 86400000
}
```

2. Ubah `ensureMasters()`:
   - Jika `useLocalMasters` → tetap `masters.json`
   - Else → panggil API Master Data (satu bundle atau per resource), normalisasi ke shape di atas, simpan cache
3. Handle error jaringan: pakai cache lama + pesan ke user.
4. Jangan kirim `ocrSamples` dari server produksi.

### Fase C — Hardening

1. Refresh master saat login / pull-to-refresh di Profil.
2. Versioning cache (`mastersVersion` dari server).
3. Uji cascade dropdown dengan data real per cabang.
4. Sinkron ulang aset Flutter setelah perubahan JS (`scripts/create-flutter-wrapper.js` / `build-apk.bat`).

---

## Checklist tim Master Data / Integration

Salin dan isi saat kickoff integrasi:

- [ ] Base URL & environment (dev / uat / prod) dikonfirmasi
- [ ] Skema auth (header, token lifetime, refresh)
- [ ] Endpoint untuk setiap entitas di tabel di atas
- [ ] Contoh response JSON (1–2 baris per entitas)
- [ ] Aturan filter by `cabangId` / `jenisSubmissionId`
- [ ] Kode ID sama dengan Octo / Falcon
- [ ] CORS / akses dari web prototype & WebView APK
- [ ] SLA / frekuensi update master
- [ ] Kontak on-call pemilik API

---

## Konfigurasi terkait (bukan master)

Submit batch tetap melalui backend NBB / Octo (stub: `NbbApi.submitBatch`), **terpisah** dari portal Master Data.

| Config | Default prototipe | Tujuan |
|--------|-------------------|--------|
| `useMock` | `true` | Mock submit lokal |
| `apiBaseUrl` | `/api/nbb` | Endpoint submit batch (bukan master) |
| `mockFailRate` | `0` | Simulasi gagal jaringan |

Diatur di layar **Profil** (`Views/Mobile/profil.html`).

---

## Ringkasan

1. **Sumber resmi master:** https://masterdata.kalbenutritionals.com/
2. **Sekarang:** stub `masters.json` untuk demo.
3. **Nanti:** semua dropdown & relasi master dari portal tersebut, dengan cache lokal.
4. **OCR samples & data transaksi** bukan master data portal.

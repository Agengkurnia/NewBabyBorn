# Documentation — New Baby Born (NBB)

Dokumentasi proyek prototipe mobile **New Baby Born** untuk BR / MAE Kalbe Nutritionals.

## Isi folder

| Dokumen | Isi |
|---------|-----|
| [01-overview.md](01-overview.md) | Ringkasan produk, stack, struktur repo, cara menjalankan |
| [02-master-data.md](02-master-data.md) | **Master data** — sumber resmi, entitas, mapping, rencana integrasi |
| [03-data-flow.md](03-data-flow.md) | Alur captura foto / input manual → verifikasi → submit |

## Sumber master data (target produksi)

Semua master data aplikasi NBB **harus diambil dari**:

**https://masterdata.kalbenutritionals.com/**

Detail kontrak, daftar entitas, dan langkah integrasi ada di [02-master-data.md](02-master-data.md).

## Status saat ini

| Area | Status |
|------|--------|
| UI / alur foto + OCR simulasi + list + verifikasi | Prototipe |
| Input manual (tanpa foto, add row) | Prototipe |
| Master data lokal (`wwwroot/data/masters.json`) | **Stub / demo only** |
| Integrasi live ke Master Data Kalbe | **Belum** — lihat dokumen 02 |
| Submit CRM / `spOctoSimpanData` | Stub mock di `NbbApi` |

## Kontak teknis (isi tim)

| Peran | Catatan |
|-------|---------|
| Owner modul NBB | — |
| API Master Data | Portal: https://masterdata.kalbenutritionals.com/ |
| Integrasi Falcon / Octo | — |

/**
 * NbbApi — stub submit one photo-batch. Switch useMock=false + apiBaseUrl for real backend later.
 */
const NbbApi = (() => {
  async function submitBatch(batchId) {
    const cfg = NbbStore.getConfig();
    let batch = NbbStore.getBatch(batchId) || NbbStore.getDraftCapture();
    if (!batch || batch.id !== batchId) {
      batch = NbbStore.getBatch(batchId);
    }
    if (!batch) return { ok: false, message: 'Batch tidak ditemukan' };

    const check = NbbStore.canSubmitBatch(batch);
    if (!check.ok) {
      return { ok: false, message: check.errors[0] || 'Belum siap dikirim', errors: check.errors };
    }

    // Ensure persisted in history before submit
    NbbStore.upsertBatch({ ...batch, status: batch.status === 'submitted' ? 'draft' : (batch.status || 'draft') });

    const payload = {
      batchId: batch.id,
      photoAttached: !!batch.photoDataUrl,
      context: {
        txtCabangID: batch.cabangId,
        txtJenisSubmissionID: batch.jenisSubmissionId,
        txtBRID: batch.brId,
        txtSumberDataID: batch.sumberDataId,
        namaProjectId: batch.namaProjectId,
        rayonId: batch.rayonId
      },
      items: (batch.items || []).map((s) => ({
        id: s.id,
        txtProdukProspekID: s.produkProspekId,
        txtStatusSaatIni: s.statusSaatIni,
        txtProdukKompetitorID: s.produkKompetitorId || null,
        txtNamaDepanPIC: s.namaDepanPic,
        TglLahirPIC: s.tglLahirPic || null,
        txtJnsKelaminPIC: s.jnsKelaminPic,
        txtNoHP: s.noHp,
        bolBeli: !!s.pakai,
        intJumlahBeli: s.pakai ? Number(s.intJumlahBeli || 0) : null,
        bitPicAdalahPelanggan: !!s.bitPicAdalahPelanggan,
        txtNamaDepanPelanggan: s.namaDepanPelanggan || null,
        txtHubungandgnPIC: s.hubunganDgnPic || null,
        TglLahirPelanggan: s.tglLahirPelanggan || null,
        txtJnsKelaminPlgn: s.jnsKelaminPelanggan || null
      }))
    };

    if (cfg.useMock) {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
      const fail = Math.random() < (cfg.mockFailRate || 0);
      if (fail) {
        NbbStore.markBatchStatus(batchId, 'failed', { lastError: 'Mock network error' });
        return { ok: false, message: 'Gagal mengirim (simulasi). Coba lagi.' };
      }
      NbbStore.markBatchStatus(batchId, 'submitted', {
        submittedAt: new Date().toISOString(),
        lastError: null,
        serverAck: 1
      });
      NbbStore.clearDraftCapture();
      return {
        ok: true,
        message: payload.items.length + ' baris berhasil dikirim (simulasi)',
        count: payload.items.length
      };
    }

    try {
      const res = await fetch(cfg.apiBaseUrl.replace(/\/$/, '') + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json().catch(() => ({}));
      NbbStore.markBatchStatus(batchId, 'submitted', {
        submittedAt: new Date().toISOString(),
        lastError: null,
        serverAck: data
      });
      NbbStore.clearDraftCapture();
      return { ok: true, message: 'Berhasil dikirim', count: payload.items.length, data };
    } catch (err) {
      NbbStore.markBatchStatus(batchId, 'failed', { lastError: String(err.message || err) });
      return { ok: false, message: 'Gagal kirim: ' + (err.message || err) };
    }
  }

  return { submitBatch };
})();

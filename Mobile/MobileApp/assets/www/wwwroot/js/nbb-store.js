/**
 * NbbStore — session + photo batches (list items) + OCR simulation
 */
const NbbStore = (() => {
  const KEYS = {
    session: 'nbb_session_v1',
    batches: 'nbb_batches_v1',
    masters: 'nbb_masters_v2',
    draftCapture: 'nbb_draft_capture_v1',
    config: 'nbb_config_v1',
    legacySubmissions: 'nbb_submissions_v1'
  };

  const DEMO_USERS = [
    { username: 'br01', password: 'demo', nama: 'M. Mohan Fadillah', brId: 'BR-01', cabangId: 'C-JKT1' },
    { username: 'br02', password: 'demo', nama: 'Siti Rahma', brId: 'BR-02', cabangId: 'C-JKT1' }
  ];

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    const json = JSON.stringify(value);
    try {
      localStorage.setItem(key, json);
      return true;
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        try {
          const list = read(KEYS.batches, []);
          list.forEach((item, idx) => {
            if (idx > 1 && item.photoDataUrl) item.photoDataUrl = '';
          });
          localStorage.setItem(KEYS.batches, JSON.stringify(list));
          localStorage.setItem(key, json);
          return true;
        } catch {
          throw new Error('Penyimpanan penuh. Hapus beberapa riwayat atau gunakan foto lebih kecil.');
        }
      }
      throw e;
    }
  }

  function compressImage(dataUrl, maxEdge, quality) {
    maxEdge = maxEdge || 960;
    quality = quality == null ? 0.65 : quality;
    return new Promise((resolve, reject) => {
      if (!dataUrl) return resolve('');
      if (dataUrl.length < 200000) return resolve(dataUrl);
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxEdge || h > maxEdge) {
          if (w >= h) {
            h = Math.round((h * maxEdge) / w);
            w = maxEdge;
          } else {
            w = Math.round((w * maxEdge) / h);
            h = maxEdge;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        let out = canvas.toDataURL('image/jpeg', quality);
        if (out.length > 450000) {
          out = canvas.toDataURL('image/jpeg', 0.45);
        }
        resolve(out);
      };
      img.onerror = () => reject(new Error('Gagal memproses foto'));
      img.src = dataUrl;
    });
  }

  async function ensureMasters() {
    let m = read(KEYS.masters, null);
    if (m && Array.isArray(m.ocrSamples) && m.ocrSamples.length >= 5) return m;
    const res = await fetch('../../wwwroot/data/masters.json');
    m = await res.json();
    write(KEYS.masters, m);
    return m;
  }

  function getConfig() {
    return read(KEYS.config, {
      useMock: true,
      apiBaseUrl: '/api/nbb',
      mockFailRate: 0
    });
  }

  function setConfig(partial) {
    write(KEYS.config, { ...getConfig(), ...partial });
  }

  function getSession() {
    return read(KEYS.session, null);
  }

  function requireSession() {
    const s = getSession();
    if (!s) {
      location.href = 'login.html';
      return null;
    }
    return s;
  }

  function login(username, password) {
    const u = DEMO_USERS.find(
      (x) => x.username.toLowerCase() === String(username).trim().toLowerCase() && x.password === password
    );
    if (!u) return { ok: false, message: 'Username atau password salah' };
    const session = {
      username: u.username,
      nama: u.nama,
      brId: u.brId,
      cabangId: u.cabangId,
      loginAt: new Date().toISOString()
    };
    write(KEYS.session, session);
    // Drop legacy flat submissions key once
    try { localStorage.removeItem(KEYS.legacySubmissions); } catch (_) { /* ignore */ }
    return { ok: true, session };
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
  }

  function listBatches() {
    return read(KEYS.batches, []);
  }

  function saveBatches(list) {
    write(KEYS.batches, list);
  }

  function getBatch(id) {
    return listBatches().find((x) => x.id === id) || null;
  }

  function upsertBatch(batch) {
    const list = listBatches();
    const i = list.findIndex((x) => x.id === batch.id);
    const next = { ...batch, updatedAt: new Date().toISOString() };
    if (i >= 0) list[i] = next;
    else list.unshift(next);
    saveBatches(list);
    return next;
  }

  function verifiedCounts(batch) {
    const items = (batch && batch.items) || [];
    const verified = items.filter((x) => x.verified).length;
    return { verified, total: items.length };
  }

  function counts() {
    const list = listBatches();
    return {
      draft: list.filter((x) => x.status === 'draft').length,
      submitted: list.filter((x) => x.status === 'submitted').length,
      failed: list.filter((x) => x.status === 'failed').length
    };
  }

  function setDraftCapture(payload) {
    write(KEYS.draftCapture, payload);
  }

  function getDraftCapture() {
    return read(KEYS.draftCapture, null);
  }

  function clearDraftCapture() {
    localStorage.removeItem(KEYS.draftCapture);
  }

  function freeStorage() {
    localStorage.removeItem(KEYS.draftCapture);
    const list = listBatches().map((item, idx) => {
      if (idx >= 3) return { ...item, photoDataUrl: '' };
      return item;
    });
    write(KEYS.batches, list);
  }

  function calcUsia(tgl) {
    if (!tgl) return null;
    const d = new Date(tgl);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildItemFromSample(sample, js) {
    const ocrFieldKeys = Object.keys(sample || {});
    return {
      id: uid('ITEM'),
      verified: false,
      ocrFieldKeys,
      produkProspekId: sample.produkProspekId || '',
      pakai: false,
      intJumlahBeli: null,
      kemasan: '',
      statusSaatIni: js ? js.statusSaatIni : 'PRO NC',
      sample: false,
      statusHasilCall: js ? js.statusHasilCall : 'PRE NC',
      produkKompetitorId: '',
      namaDepanPic: sample.namaDepanPic || '',
      namaBelakangPic: sample.namaBelakangPic || '',
      jnsKelaminPic: sample.jnsKelaminPic || '',
      tglLahirPic: sample.tglLahirPic || '',
      usia: calcUsia(sample.tglLahirPic),
      usiaHamilMinggu: sample.usiaHamilMinggu || 0,
      tglPrediksiLahir: '',
      alamat: sample.alamat || '',
      rt: sample.rt || '',
      rw: sample.rw || '',
      propinsiId: sample.propinsiId || '',
      kotaId: sample.kotaId || '',
      kecamatanId: sample.kecamatanId || '',
      kelurahanId: sample.kelurahanId || '',
      noHp: sample.noHp || '',
      telpRumah: '',
      telpKantor: '',
      telpExt: '',
      email: '',
      tanggalTerimaData: new Date().toISOString().slice(0, 10),
      bitPicAdalahPelanggan: !!sample.bitPicAdalahPelanggan,
      namaDepanPelanggan: sample.namaDepanPelanggan || '',
      namaBelakangPelanggan: sample.namaBelakangPelanggan || '',
      jnsKelaminPelanggan: sample.jnsKelaminPelanggan || '',
      tglLahirPelanggan: sample.tglLahirPelanggan || '',
      hubunganDgnPic: sample.hubunganDgnPic || '',
      medicalRecord: sample.medicalRecord || ''
    };
  }

  function createEmptyItem(js) {
    return buildItemFromSample({}, js);
  }

  async function createManualBatch() {
    const masters = await ensureMasters();
    const session = getSession() || {};
    const js = (masters.jenisSubmission || []).find((x) => x.id === 'JS-NBB') || (masters.jenisSubmission || [])[0];
    const batch = {
      id: uid('BATCH'),
      photoDataUrl: '',
      inputMode: 'manual',
      ocrSource: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cabangId: session.cabangId || 'C-JKT1',
      rayonId: '',
      jenisSubmissionId: js ? js.id : 'JS-NBB',
      namaProjectId: 'PRJ-NBB26',
      brId: session.brId || 'BR-01',
      sumberDataId: '',
      items: []
    };
    setDraftCapture(batch);
    return batch;
  }

  function addManualItem() {
    const draft = getDraftCapture();
    if (!draft) return { ok: false, errors: ['Draft tidak ditemukan'] };
    const masters = read(KEYS.masters, null);
    const jsId = draft.jenisSubmissionId || 'JS-NBB';
    const js = masters
      ? (masters.jenisSubmission || []).find((x) => x.id === jsId)
      : null;
    const item = createEmptyItem(js);
    draft.items = draft.items || [];
    draft.items.push(item);
    draft.updatedAt = new Date().toISOString();
    setDraftCapture(draft);
    return { ok: true, item, batch: draft };
  }

  async function simulateOcr(photoDataUrl) {
    const masters = await ensureMasters();
    const samples = masters.ocrSamples || [];
    const session = getSession() || {};
    const count = Math.min(samples.length, 3 + Math.floor(Math.random() * 3)); // 3–5
    const picked = shuffle(samples).slice(0, Math.max(3, count));
    const first = picked[0] || {};
    const js = (masters.jenisSubmission || []).find((x) => x.id === (first.jenisSubmissionId || 'JS-NBB'));

    const compressed = await compressImage(photoDataUrl, 960, 0.65);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const items = picked.map((s) => {
      const rowJs = (masters.jenisSubmission || []).find((x) => x.id === (s.jenisSubmissionId || 'JS-NBB')) || js;
      return buildItemFromSample(s, rowJs);
    });

    const batch = {
      id: uid('BATCH'),
      photoDataUrl: compressed,
      inputMode: 'photo',
      ocrSource: true,
      ocrAt: new Date().toISOString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cabangId: first.cabangId || session.cabangId || 'C-JKT1',
      rayonId: first.rayonId || '',
      jenisSubmissionId: first.jenisSubmissionId || 'JS-NBB',
      namaProjectId: 'PRJ-NBB26',
      brId: session.brId || 'BR-01',
      sumberDataId: first.sumberDataId || '',
      items
    };
    setDraftCapture(batch);
    return batch;
  }

  function validateBatchContext(batch) {
    const errors = [];
    const need = [
      ['cabangId', 'Cabang'],
      ['jenisSubmissionId', 'Jenis Submission'],
      ['brId', 'Nama BR / MAE'],
      ['sumberDataId', 'Sumber Data']
    ];
    need.forEach(([k, label]) => {
      if (!batch[k] && batch[k] !== 0) errors.push(label + ' wajib diisi');
    });
    return errors;
  }

  function validateItem(item) {
    const errors = [];
    const need = [
      ['produkProspekId', 'Produk Prospek'],
      ['statusSaatIni', 'Status Saat Ini'],
      ['statusHasilCall', 'Status Hasil Call'],
      ['namaDepanPic', 'Nama Depan PIC'],
      ['jnsKelaminPic', 'Jenis Kelamin PIC'],
      ['noHp', 'No Handphone']
    ];
    need.forEach(([k, label]) => {
      if (!item[k] && item[k] !== 0) errors.push(label + ' wajib diisi');
    });
    if (item.noHp && !/^\d{10,15}$/.test(String(item.noHp).replace(/\D/g, ''))) {
      errors.push('No Handphone harus numerik 10–15 digit');
    }
    if (item.pakai && (item.intJumlahBeli == null || item.intJumlahBeli === '' || Number(item.intJumlahBeli) < 1)) {
      errors.push('Jumlah Pakai wajib jika Pakai dicentang');
    }
    if (item.bitPicAdalahPelanggan) {
      if (!item.namaDepanPelanggan) errors.push('Nama Depan Pelanggan wajib');
      if (!item.jnsKelaminPelanggan) errors.push('Jenis Kelamin Pelanggan wajib');
      if (!item.hubunganDgnPic) errors.push('Hubungan dgn PIC wajib');
    }
    return errors;
  }

  function canSubmitBatch(batch) {
    if (!batch || !batch.items || !batch.items.length) {
      return { ok: false, errors: ['Tidak ada baris data'] };
    }
    const errors = validateBatchContext(batch);
    const unverified = batch.items.filter((x) => !x.verified);
    if (unverified.length) {
      errors.push(unverified.length + ' baris belum diverifikasi');
    }
    batch.items.forEach((it, idx) => {
      validateItem(it).forEach((e) => errors.push('Baris ' + (idx + 1) + ': ' + e));
    });
    return { ok: !errors.length, errors };
  }

  function updateDraftContext(partial) {
    const draft = getDraftCapture();
    if (!draft) return null;
    const next = { ...draft, ...partial, updatedAt: new Date().toISOString() };
    setDraftCapture(next);
    return next;
  }

  function getDraftItem(itemId) {
    const draft = getDraftCapture();
    if (!draft || !draft.items) return null;
    return draft.items.find((x) => x.id === itemId) || null;
  }

  function updateDraftItem(itemId, fields) {
    const draft = getDraftCapture();
    if (!draft || !draft.items) return { ok: false, errors: ['Draft tidak ditemukan'] };
    const i = draft.items.findIndex((x) => x.id === itemId);
    if (i < 0) return { ok: false, errors: ['Baris tidak ditemukan'] };
    draft.items[i] = { ...draft.items[i], ...fields, updatedAt: new Date().toISOString() };
    draft.updatedAt = new Date().toISOString();
    setDraftCapture(draft);
    return { ok: true, item: draft.items[i], batch: draft };
  }

  function markItemVerified(itemId, fields) {
    const merged = { ...(fields || {}), verified: true };
    const itemCheck = validateItem(merged);
    if (itemCheck.length) return { ok: false, errors: itemCheck };
    return updateDraftItem(itemId, merged);
  }

  function saveDraftBatch(batch) {
    const errors = validateBatchContext(batch);
    if (errors.length) return { ok: false, errors };
    const item = {
      ...batch,
      status: batch.status === 'failed' ? 'draft' : (batch.status === 'submitted' ? 'draft' : (batch.status || 'draft')),
      updatedAt: new Date().toISOString(),
      createdAt: batch.createdAt || new Date().toISOString()
    };
    if (item.status === 'submitted') item.status = 'draft';
    upsertBatch(item);
    clearDraftCapture();
    return { ok: true, item };
  }

  /** Persist current draft into history without clearing (used before submit from list). */
  function persistDraftBatch() {
    const draft = getDraftCapture();
    if (!draft) return { ok: false, errors: ['Tidak ada draft'] };
    const errors = validateBatchContext(draft);
    if (errors.length) return { ok: false, errors };
    const saved = upsertBatch({
      ...draft,
      status: draft.status === 'submitted' ? 'draft' : (draft.status || 'draft'),
      createdAt: draft.createdAt || new Date().toISOString()
    });
    setDraftCapture(saved);
    return { ok: true, item: saved };
  }

  function markBatchStatus(id, status, extra) {
    const list = listBatches();
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return null;
    list[i] = {
      ...list[i],
      status,
      updatedAt: new Date().toISOString(),
      ...(extra || {})
    };
    saveBatches(list);
    return list[i];
  }

  function openBatchForEdit(batchId) {
    const batch = getBatch(batchId);
    if (!batch) return null;
    setDraftCapture({ ...batch });
    return batch;
  }

  function labelOf(masters, collection, id, nameKey) {
    const arr = masters[collection] || [];
    const row = arr.find((x) => x.id === id);
    return row ? row[nameKey || 'nama'] : id || '—';
  }

  return {
    KEYS,
    DEMO_USERS,
    ensureMasters,
    getConfig,
    setConfig,
    getSession,
    requireSession,
    login,
    logout,
    listBatches,
    getBatch,
    upsertBatch,
    verifiedCounts,
    counts,
    setDraftCapture,
    getDraftCapture,
    clearDraftCapture,
    freeStorage,
    compressImage,
    simulateOcr,
    createManualBatch,
    addManualItem,
    createEmptyItem,
    validateBatchContext,
    validateItem,
    canSubmitBatch,
    updateDraftContext,
    getDraftItem,
    updateDraftItem,
    markItemVerified,
    saveDraftBatch,
    persistDraftBatch,
    markBatchStatus,
    openBatchForEdit,
    labelOf,
    calcUsia,
    uid
  };
})();

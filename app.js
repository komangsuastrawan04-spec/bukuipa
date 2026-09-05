/* =========================================================================
   BUKU KELAS — Absensi & Nilai IPA
   Semua data disimpan di localStorage peramban. Backup otomatis dikirim
   ke Google Spreadsheet lewat Google Apps Script (lihat TUTORIAL.md).
   ========================================================================= */

const STORAGE_KEY = 'bukukelas_v1';
const KKM_DEFAULT = 70;

const DEFAULT_STATE = {
  classes: [],
  students: [],
  attendance: [],        // {id, classId, studentId, date, status, note}
  activityCategories: ['Menjawab pertanyaan', 'Bertanya'],
  activityPoints: [],     // {id, classId, studentId, date, category, points}
  grades: [],             // {id, classId, studentId, type, name, score, date}
  praktikum: [],          // {id, classId, date, judul, alat, k3}
  jurnalMengajar: [],     // {id, classId, date, jamKe, materi, catatan}
  settings: {
    weights: { tugas: 20, uh: 25, ulisan: 0, uts: 20, uas: 20, praktikum: 15 },
    enableUlisan: false,
    sheetsUrl: '',
    autoSync: false,
    lastSync: null,
    lastPull: null,
    syncedSnapshot: null
  }
};

/* Jenis penilaian yang dikenal aplikasi. 'ulisan' (Ulangan Lisan) bersifat
   opsional — hanya muncul di dropdown/rekap jika diaktifkan di Pengaturan. */
const GRADE_TYPES = [
  { id: 'tugas', label: 'Tugas' },
  { id: 'uh', label: 'Ulangan Harian' },
  { id: 'ulisan', label: 'Ulangan Lisan' },
  { id: 'uts', label: 'UTS' },
  { id: 'uas', label: 'UAS' },
  { id: 'praktikum', label: 'Praktikum' }
];
function jenisLabel(type) { return (GRADE_TYPES.find(t => t.id === type) || {}).label || type; }
function activeGradeTypes() { return GRADE_TYPES.filter(t => t.id !== 'ulisan' || state.settings.enableUlisan); }

let state = loadState();

/* ---------------------------- util dasar ---------------------------- */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // gabungkan supaya field baru tetap ada saat update aplikasi
    return Object.assign(structuredClone(DEFAULT_STATE), parsed, {
      settings: Object.assign({}, DEFAULT_STATE.settings, parsed.settings || {})
    });
  } catch (e) {
    console.error('Gagal memuat data lokal', e);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.settings.autoSync && state.settings.sheetsUrl) {
    syncToSheets(true);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* Ringkasan (hash sederhana) dari seluruh data inti — dipakai untuk mendeteksi
   apakah ada perubahan lokal yang BELUM dikirim ke Spreadsheet, supaya
   aplikasi tidak diam-diam menimpa perubahan itu saat mengambil data terbaru. */
function coreSnapshotStr() {
  return JSON.stringify({
    classes: state.classes, students: state.students, attendance: state.attendance,
    activityPoints: state.activityPoints, grades: state.grades,
    praktikum: state.praktikum, jurnalMengajar: state.jurnalMengajar,
    activityCategories: state.activityCategories,
    weights: state.settings.weights, enableUlisan: state.settings.enableUlisan
  });
}
function hasUnsyncedChanges() {
  return state.settings.sheetsUrl && state.settings.syncedSnapshot !== coreSnapshotStr();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateID(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('is-show'), 2600);
}

function studentsOf(classId) {
  return state.students.filter(s => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

function classById(id) { return state.classes.find(c => c.id === id); }
function studentById(id) { return state.students.find(s => s.id === id); }

/* ---------------------------- konteks global ---------------------------- */

const globalKelasSelect = document.getElementById('globalKelasSelect');
const globalDate = document.getElementById('globalDate');
globalDate.value = todayStr();

function getCtx() {
  return { classId: globalKelasSelect.value, date: globalDate.value };
}

function refreshKelasOptions() {
  const opts = ['<option value="">— pilih kelas —</option>']
    .concat(state.classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`));
  const prevGlobal = globalKelasSelect.value;
  globalKelasSelect.innerHTML = opts.join('');
  if (state.classes.some(c => c.id === prevGlobal)) globalKelasSelect.value = prevGlobal;
  else if (state.classes.length) globalKelasSelect.value = state.classes[0].id;

  const filt = document.getElementById('siswaKelasFilter');
  const prevFilt = filt.value;
  filt.innerHTML = '<option value="">Semua kelas</option>' + opts.slice(1).join('');
  filt.value = prevFilt;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------------------- navigasi antar view ---------------------------- */

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => { switchView(btn.dataset.view); closeMobileNav(); });
});

function switchView(view) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v.id === 'view-' + view));
  renderAll();
}

/* ---------------------------- menu mobile (hamburger) ---------------------------- */

function openMobileNav() {
  document.getElementById('sideNav').classList.add('is-open');
  document.getElementById('mobileNavBackdrop').classList.add('is-open');
  document.body.classList.add('no-scroll');
}
function closeMobileNav() {
  document.getElementById('sideNav').classList.remove('is-open');
  document.getElementById('mobileNavBackdrop').classList.remove('is-open');
  document.body.classList.remove('no-scroll');
}
document.getElementById('mobileMenuBtn').addEventListener('click', openMobileNav);
document.getElementById('mobileNavClose').addEventListener('click', closeMobileNav);
document.getElementById('mobileNavBackdrop').addEventListener('click', closeMobileNav);

globalKelasSelect.addEventListener('change', renderAll);
globalDate.addEventListener('change', renderAll);

/* =========================================================================
   MODAL sederhana (dipakai untuk tambah/edit kelas & siswa)
   ========================================================================= */

const modalBackdrop = document.getElementById('modalBackdrop');
const modalBox = document.getElementById('modalBox');

function openModal(html, onMount) {
  modalBox.innerHTML = html;
  modalBackdrop.classList.add('is-open');
  if (onMount) onMount(modalBox);
}
function closeModal() {
  modalBackdrop.classList.remove('is-open');
  modalBox.innerHTML = '';
}
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });

/* =========================================================================
   KELAS & SISWA
   ========================================================================= */

document.getElementById('addKelasBtn').addEventListener('click', () => openKelasModal());

function openKelasModal(existing) {
  const isEdit = !!existing;
  openModal(`
    <h3>${isEdit ? 'Edit kelas' : 'Tambah kelas'}</h3>
    <div class="form-row">
      <label class="ctx-field"><span>Nama kelas</span><input id="mKelasNama" type="text" placeholder="Misal: IX-A" value="${escapeHtml(existing?.name || '')}"></label>
    </div>
    <div class="form-row">
      <label class="ctx-field"><span>Mata pelajaran</span><input id="mKelasMapel" type="text" placeholder="IPA" value="${escapeHtml(existing?.subject || 'IPA')}"></label>
      <label class="ctx-field"><span>Tahun ajaran</span><input id="mKelasTahun" type="text" placeholder="2026/2027" value="${escapeHtml(existing?.year || '')}"></label>
    </div>
    <div class="modal-actions">
      <button class="btn btn-line" id="mCancel">Batal</button>
      <button class="btn btn-primary" id="mSave">Simpan</button>
    </div>
  `, box => {
    box.querySelector('#mCancel').onclick = closeModal;
    box.querySelector('#mSave').onclick = () => {
      const name = box.querySelector('#mKelasNama').value.trim();
      if (!name) { toast('Nama kelas wajib diisi'); return; }
      if (isEdit) {
        existing.name = name;
        existing.subject = box.querySelector('#mKelasMapel').value.trim();
        existing.year = box.querySelector('#mKelasTahun').value.trim();
      } else {
        state.classes.push({ id: uid(), name, subject: box.querySelector('#mKelasMapel').value.trim(), year: box.querySelector('#mKelasTahun').value.trim() });
      }
      saveState(); closeModal(); refreshKelasOptions(); renderAll();
      toast('Kelas disimpan');
    };
  });
}

function renderKelasTable() {
  const tbody = document.querySelector('#kelasTable tbody');
  if (!state.classes.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Belum ada kelas. Tambahkan kelas pertama Anda.</td></tr>';
    return;
  }
  tbody.innerHTML = state.classes.map(c => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.subject)}</td>
      <td>${escapeHtml(c.year)}</td>
      <td class="numcell">${studentsOf(c.id).length}</td>
      <td>
        <button class="btn btn-line" data-edit-kelas="${c.id}">Edit</button>
        <button class="btn btn-line" data-del-kelas="${c.id}" style="color:#E1547A">Hapus</button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-edit-kelas]').forEach(b => b.onclick = () => openKelasModal(classById(b.dataset.editKelas)));
  tbody.querySelectorAll('[data-del-kelas]').forEach(b => b.onclick = () => {
    if (!confirm('Hapus kelas ini beserta seluruh data siswa, absensi, dan nilainya?')) return;
    const id = b.dataset.delKelas;
    state.classes = state.classes.filter(c => c.id !== id);
    state.students = state.students.filter(s => s.classId !== id);
    state.attendance = state.attendance.filter(a => a.classId !== id);
    state.activityPoints = state.activityPoints.filter(a => a.classId !== id);
    state.grades = state.grades.filter(a => a.classId !== id);
    state.praktikum = state.praktikum.filter(a => a.classId !== id);
    state.jurnalMengajar = state.jurnalMengajar.filter(a => a.classId !== id);
    saveState(); refreshKelasOptions(); renderAll();
    toast('Kelas dihapus');
  });
}

document.getElementById('addSiswaBtn').addEventListener('click', () => openSiswaModal());

function openSiswaModal(existing) {
  const isEdit = !!existing;
  const kelasOpts = state.classes.map(c => `<option value="${c.id}" ${existing?.classId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  openModal(`
    <h3>${isEdit ? 'Edit siswa' : 'Tambah siswa'}</h3>
    <div class="form-row">
      <label class="ctx-field"><span>Kelas</span><select id="mSiswaKelas">${kelasOpts || '<option value="">Buat kelas dahulu</option>'}</select></label>
    </div>
    <div class="form-row">
      <label class="ctx-field"><span>Nama</span><input id="mSiswaNama" type="text" value="${escapeHtml(existing?.name || '')}"></label>
    </div>
    <div class="form-row">
      <label class="ctx-field"><span>NIS/NISN</span><input id="mSiswaNis" type="text" value="${escapeHtml(existing?.nis || '')}"></label>
      <label class="ctx-field"><span>Jenis kelamin</span>
        <select id="mSiswaJk">
          <option value="L" ${existing?.gender === 'L' ? 'selected' : ''}>L</option>
          <option value="P" ${existing?.gender === 'P' ? 'selected' : ''}>P</option>
        </select>
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn btn-line" id="mCancel">Batal</button>
      <button class="btn btn-primary" id="mSave">Simpan</button>
    </div>
  `, box => {
    box.querySelector('#mCancel').onclick = closeModal;
    box.querySelector('#mSave').onclick = () => {
      const name = box.querySelector('#mSiswaNama').value.trim();
      const classId = box.querySelector('#mSiswaKelas').value;
      if (!name || !classId) { toast('Nama dan kelas wajib diisi'); return; }
      if (isEdit) {
        Object.assign(existing, { name, classId, nis: box.querySelector('#mSiswaNis').value.trim(), gender: box.querySelector('#mSiswaJk').value });
      } else {
        state.students.push({ id: uid(), name, classId, nis: box.querySelector('#mSiswaNis').value.trim(), gender: box.querySelector('#mSiswaJk').value });
      }
      saveState(); closeModal(); renderAll();
      toast('Siswa disimpan');
    };
  });
}

function renderSiswaTable() {
  const filterKelas = document.getElementById('siswaKelasFilter').value;
  const q = document.getElementById('siswaSearch').value.trim().toLowerCase();
  let list = state.students.slice();
  if (filterKelas) list = list.filter(s => s.classId === filterKelas);
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || (s.nis || '').toLowerCase().includes(q));
  list.sort((a, b) => a.name.localeCompare(b.name, 'id'));

  const tbody = document.querySelector('#siswaTable tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Belum ada siswa yang cocok.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td class="numcell">${escapeHtml(s.nis || '—')}</td>
      <td>${escapeHtml(s.gender || '—')}</td>
      <td>${escapeHtml(classById(s.classId)?.name || '—')}</td>
      <td>
        <button class="btn btn-line" data-edit-siswa="${s.id}">Edit</button>
        <button class="btn btn-line" data-del-siswa="${s.id}" style="color:#E1547A">Hapus</button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-edit-siswa]').forEach(b => b.onclick = () => openSiswaModal(studentById(b.dataset.editSiswa)));
  tbody.querySelectorAll('[data-del-siswa]').forEach(b => b.onclick = () => {
    if (!confirm('Hapus siswa ini beserta riwayat absensi, poin, dan nilainya?')) return;
    const id = b.dataset.delSiswa;
    state.students = state.students.filter(s => s.id !== id);
    state.attendance = state.attendance.filter(a => a.studentId !== id);
    state.activityPoints = state.activityPoints.filter(a => a.studentId !== id);
    state.grades = state.grades.filter(a => a.studentId !== id);
    saveState(); renderAll();
    toast('Siswa dihapus');
  });
}

document.getElementById('siswaKelasFilter').addEventListener('change', renderSiswaTable);
document.getElementById('siswaSearch').addEventListener('input', renderSiswaTable);

/* ---- Template import & import file siswa ---- */

document.getElementById('downloadTemplateBtn').addEventListener('click', () => {
  const ws = XLSX.utils.aoa_to_sheet([['Nama', 'NIS', 'JK'], ['Contoh Siswa', '1234567890', 'L']]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
  XLSX.writeFile(wb, 'template-import-siswa.xlsx');
});

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const targetClass = document.getElementById('siswaKelasFilter').value || globalKelasSelect.value;
  if (!targetClass) { toast('Pilih kelas tujuan import terlebih dahulu (filter kelas di atas tabel)'); e.target.value = ''; return; }
  try {
    const rows = await parseSheetFile(file);
    const header = rows[0].map(h => String(h || '').toLowerCase().trim());
    const idxNama = header.findIndex(h => h.includes('nama'));
    const idxNis = header.findIndex(h => h.includes('nis'));
    const idxJk = header.findIndex(h => h.includes('jk') || h.includes('kelamin'));
    if (idxNama === -1) { toast('Kolom "Nama" tidak ditemukan pada file'); e.target.value = ''; return; }

    const preview = rows.slice(1).filter(r => r[idxNama]).map(r => ({
      name: String(r[idxNama]).trim(),
      nis: idxNis > -1 ? String(r[idxNis] ?? '').trim() : '',
      gender: idxJk > -1 ? String(r[idxJk] ?? '').trim().toUpperCase().slice(0, 1) : ''
    }));
    showImportPreview(preview, targetClass);
  } catch (err) {
    console.error(err);
    toast('Gagal membaca file. Pastikan formatnya .xlsx/.xls/.csv');
  }
  e.target.value = '';
});

function parseSheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function showImportPreview(rows, classId) {
  const rowsHtml = rows.slice(0, 200).map((r, i) => `
    <tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.nis)}</td><td>${escapeHtml(r.gender)}</td></tr>
  `).join('');
  openModal(`
    <h3>Pratinjau import (${rows.length} siswa)</h3>
    <div style="max-height:300px; overflow:auto; border:1px solid var(--line); border-radius:3px;">
      <table class="tbl"><thead><tr><th>#</th><th>Nama</th><th>NIS</th><th>JK</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    </div>
    <div class="modal-actions">
      <button class="btn btn-line" id="mCancel">Batal</button>
      <button class="btn btn-primary" id="mSave">Import ke ${escapeHtml(classById(classId)?.name || '')}</button>
    </div>
  `, box => {
    box.querySelector('#mCancel').onclick = closeModal;
    box.querySelector('#mSave').onclick = () => {
      rows.forEach(r => {
        state.students.push({ id: uid(), classId, name: r.name, nis: r.nis, gender: r.gender });
      });
      saveState(); closeModal(); renderAll();
      toast(`${rows.length} siswa berhasil diimport`);
    };
  });
}

/* =========================================================================
   ABSENSI
   ========================================================================= */

const STATUS_LIST = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat'];

function getAttendance(classId, studentId, date) {
  return state.attendance.find(a => a.classId === classId && a.studentId === studentId && a.date === date);
}

function renderAbsensiView() {
  const { classId, date } = getCtx();
  const tbody = document.querySelector('#absensiTable tbody');
  const lockNote = document.getElementById('absensiLockNote');
  if (!classId) { tbody.innerHTML = '<tr><td colspan="3" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>'; lockNote.textContent = ''; return; }
  const list = studentsOf(classId);
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty">Kelas ini belum punya siswa.</td></tr>'; return; }

  const already = list.some(s => getAttendance(classId, s.id, date));
  lockNote.textContent = already ? 'Absensi tanggal ini sudah pernah disimpan — menyimpan lagi akan memperbarui data.' : '';

  tbody.innerHTML = list.map(s => {
    const rec = getAttendance(classId, s.id, date);
    const status = rec?.status || 'Hadir';
    const note = rec?.note || '';
    return `
      <tr data-student="${s.id}">
        <td>${escapeHtml(s.name)}</td>
        <td>
          <div class="status-group">
            ${STATUS_LIST.map(st => `<button type="button" class="status-btn ${st === status ? 'is-on' : ''}" data-s="${st}">${st}</button>`).join('')}
          </div>
        </td>
        <td><input type="text" class="noteInput" placeholder="Catatan (opsional)" value="${escapeHtml(note)}"></td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr').forEach(row => {
    row.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.status-btn').forEach(b => b.classList.remove('is-on'));
        btn.classList.add('is-on');
      });
    });
  });
}

document.getElementById('markAllHadirBtn').addEventListener('click', () => {
  document.querySelectorAll('#absensiTable tbody tr').forEach(row => {
    row.querySelectorAll('.status-btn').forEach(b => b.classList.toggle('is-on', b.dataset.s === 'Hadir'));
  });
});

document.getElementById('saveAbsensiBtn').addEventListener('click', () => {
  const { classId, date } = getCtx();
  if (!classId) { toast('Pilih kelas terlebih dahulu'); return; }
  document.querySelectorAll('#absensiTable tbody tr').forEach(row => {
    const studentId = row.dataset.student;
    const activeBtn = row.querySelector('.status-btn.is-on');
    const status = activeBtn ? activeBtn.dataset.s : 'Hadir';
    const note = row.querySelector('.noteInput').value.trim();
    let rec = getAttendance(classId, studentId, date);
    if (rec) { rec.status = status; rec.note = note; }
    else state.attendance.push({ id: uid(), classId, studentId, date, status, note });
  });
  saveState();
  toast('Absensi tersimpan');
  renderAll();
});

/* =========================================================================
   KEAKTIFAN
   ========================================================================= */

document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategoryInput');
  const val = input.value.trim();
  if (!val) return;
  if (state.activityCategories.includes(val)) { toast('Kategori sudah ada'); return; }
  state.activityCategories.push(val);
  saveState(); input.value = ''; renderKeaktifanView();
});

function renderKeaktifanView() {
  const { classId, date } = getCtx();
  const headRow = document.getElementById('keaktifanHeadRow');
  const tbody = document.querySelector('#keaktifanTable tbody');
  headRow.innerHTML = '<th>Siswa</th>' + state.activityCategories.map(c => `<th>${escapeHtml(c)}</th>`).join('') + '<th>Total hari ini</th>';

  if (!classId) { tbody.innerHTML = `<tr><td colspan="${state.activityCategories.length + 2}" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>`; return; }
  const list = studentsOf(classId);
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="${state.activityCategories.length + 2}" class="empty">Kelas ini belum punya siswa.</td></tr>`; return; }

  tbody.innerHTML = list.map(s => {
    const cells = state.activityCategories.map(cat => {
      const entry = state.activityPoints.find(a => a.classId === classId && a.studentId === s.id && a.date === date && a.category === cat);
      return `<td><input type="number" min="0" class="ptInput" data-cat="${escapeHtml(cat)}" value="${entry ? entry.points : ''}" placeholder="0"></td>`;
    }).join('');
    return `<tr data-student="${s.id}"><td>${escapeHtml(s.name)}</td>${cells}<td class="numcell totalCell">0</td></tr>`;
  }).join('');

  tbody.querySelectorAll('tr').forEach(row => {
    const updateTotal = () => {
      let total = 0;
      row.querySelectorAll('.ptInput').forEach(inp => total += Number(inp.value) || 0);
      row.querySelector('.totalCell').textContent = total;
    };
    row.querySelectorAll('.ptInput').forEach(inp => inp.addEventListener('input', updateTotal));
    updateTotal();
  });
}

document.getElementById('saveKeaktifanBtn').addEventListener('click', () => {
  const { classId, date } = getCtx();
  if (!classId) { toast('Pilih kelas terlebih dahulu'); return; }
  document.querySelectorAll('#keaktifanTable tbody tr').forEach(row => {
    const studentId = row.dataset.student;
    row.querySelectorAll('.ptInput').forEach(inp => {
      const cat = inp.dataset.cat;
      const points = Number(inp.value) || 0;
      state.activityPoints = state.activityPoints.filter(a => !(a.classId === classId && a.studentId === studentId && a.date === date && a.category === cat));
      if (points > 0) state.activityPoints.push({ id: uid(), classId, studentId, date, category: cat, points });
    });
  });
  saveState();
  toast('Poin keaktifan tersimpan');
  renderAll();
});

/* =========================================================================
   NILAI
   ========================================================================= */

function naturalNameSort(a, b) {
  return a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });
}

/* Daftar nama penilaian (mis. "Tugas 1", "Tugas 2") yang sudah pernah dibuat
   untuk kombinasi kelas + jenis tertentu, diurutkan secara alami. */
function assessmentNamesFor(classId, type) {
  const names = new Set();
  state.grades.filter(g => g.classId === classId && g.type === type).forEach(g => names.add(g.name));
  return [...names].sort(naturalNameSort);
}

/* Menyarankan nama penilaian berikutnya, mis. jika sudah ada "Tugas 1" dan
   "Tugas 2", akan menyarankan "Tugas 3". */
function suggestNextName(classId, type) {
  const label = jenisLabel(type);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + escaped + '\\s*(\\d+)$', 'i');
  let max = 0;
  assessmentNamesFor(classId, type).forEach(n => {
    const m = n.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${label} ${max + 1}`;
}

function refreshNilaiJenisOptions() {
  const sel = document.getElementById('nilaiJenis');
  const prev = sel.value;
  sel.innerHTML = activeGradeTypes().map(t => `<option value="${t.id}">${t.label}</option>`).join('');
  if (activeGradeTypes().some(t => t.id === prev)) sel.value = prev;
}

function renderNilaiChips() {
  const { classId } = getCtx();
  const jenis = document.getElementById('nilaiJenis').value;
  const wrap = document.getElementById('nilaiChipRow');
  const activeName = document.getElementById('nilaiNama').value.trim();
  if (!classId) { wrap.innerHTML = ''; return; }
  const names = assessmentNamesFor(classId, jenis);
  const chips = names.map(n => `
    <button type="button" class="chip ${n === activeName ? 'is-active' : ''}" data-chip="${escapeHtml(n)}">
      ${escapeHtml(n)}<span class="chip-x" data-chip-del="${escapeHtml(n)}" title="Hapus penilaian ini">×</span>
    </button>`).join('');
  const addLabel = names.length ? `+ ${jenisLabel(jenis)} baru` : `+ Tambah ${jenisLabel(jenis)} pertama`;
  wrap.innerHTML = chips + `<button type="button" class="chip chip-add" id="nilaiChipAdd">${addLabel}</button>`;

  wrap.querySelectorAll('[data-chip]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.closest('[data-chip-del]')) return;
      document.getElementById('nilaiNama').value = btn.dataset.chip;
      renderNilaiInputTable();
      renderNilaiChips();
    });
  });
  wrap.querySelectorAll('[data-chip-del]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.chipDel;
      if (!confirm(`Hapus penilaian "${name}" beserta seluruh nilai siswa di dalamnya?`)) return;
      state.grades = state.grades.filter(g => !(g.classId === classId && g.type === jenis && g.name === name));
      if (document.getElementById('nilaiNama').value.trim() === name) document.getElementById('nilaiNama').value = '';
      saveState(); renderNilaiChips(); renderNilaiInputTable(); renderNilaiRekap();
      toast('Penilaian dihapus');
    });
  });
  const addBtn = document.getElementById('nilaiChipAdd');
  if (addBtn) addBtn.addEventListener('click', () => {
    const suggestion = suggestNextName(classId, jenis);
    const nameInput = document.getElementById('nilaiNama');
    nameInput.value = suggestion;
    nameInput.focus();
    nameInput.select();
    renderNilaiInputTable();
    renderNilaiChips();
  });
}

function renderNilaiInputTable() {
  const { classId, date } = getCtx();
  const tbody = document.querySelector('#nilaiInputTable tbody');
  const nama = document.getElementById('nilaiNama').value.trim();
  const jenis = document.getElementById('nilaiJenis').value;
  document.getElementById('nilaiItemLabel').textContent = nama ? `${jenisLabel(jenis)} — ${nama}` : jenisLabel(jenis);
  if (!classId) { tbody.innerHTML = '<tr><td colspan="2" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>'; return; }
  const list = studentsOf(classId);
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="2" class="empty">Kelas ini belum punya siswa.</td></tr>'; return; }
  if (!nama) { tbody.innerHTML = '<tr><td colspan="2" class="empty">Pilih penilaian di atas, atau klik salah satu tombol "+ Tambah baru".</td></tr>'; return; }

  tbody.innerHTML = list.map(s => {
    const existing = state.grades.find(g => g.classId === classId && g.studentId === s.id && g.type === jenis && g.name === nama);
    return `<tr data-student="${s.id}"><td>${escapeHtml(s.name)}</td><td><input type="number" min="0" max="100" class="scoreInput" value="${existing ? existing.score : ''}" placeholder="—"></td></tr>`;
  }).join('');
}

document.getElementById('nilaiJenis').addEventListener('change', () => {
  document.getElementById('nilaiNama').value = '';
  renderNilaiChips();
  renderNilaiInputTable();
});
document.getElementById('nilaiNama').addEventListener('input', () => { renderNilaiInputTable(); renderNilaiChips(); });

document.getElementById('saveNilaiBtn').addEventListener('click', () => {
  const { classId, date } = getCtx();
  const jenis = document.getElementById('nilaiJenis').value;
  const nama = document.getElementById('nilaiNama').value.trim();
  if (!classId) { toast('Pilih kelas terlebih dahulu'); return; }
  if (!nama) { toast('Isi/pilih nama penilaian terlebih dahulu (misal: Tugas 1)'); return; }
  let count = 0;
  document.querySelectorAll('#nilaiInputTable tbody tr').forEach(row => {
    const studentId = row.dataset.student;
    const val = row.querySelector('.scoreInput').value;
    if (val === '') return;
    const score = Math.max(0, Math.min(100, Number(val)));
    let rec = state.grades.find(g => g.classId === classId && g.studentId === studentId && g.type === jenis && g.name === nama);
    if (rec) { rec.score = score; rec.date = date; }
    else state.grades.push({ id: uid(), classId, studentId, type: jenis, name: nama, score, date });
    count++;
  });
  saveState();
  toast(`Nilai "${nama}" tersimpan untuk ${count} siswa`);
  renderNilaiChips();
  renderAll();
});

document.getElementById('importNilaiFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const { classId } = getCtx();
  const jenis = document.getElementById('nilaiJenis').value;
  const nama = document.getElementById('nilaiNama').value.trim();
  if (!classId) { toast('Pilih kelas terlebih dahulu'); e.target.value = ''; return; }
  if (!nama) { toast('Isi nama penilaian terlebih dahulu sebelum import'); e.target.value = ''; return; }
  try {
    const rows = await parseSheetFile(file);
    const header = rows[0].map(h => String(h || '').toLowerCase().trim());
    const idxNama = header.findIndex(h => h.includes('nama'));
    const idxNis = header.findIndex(h => h.includes('nis'));
    const idxNilai = header.findIndex(h => h.includes('nilai') || h.includes('skor') || h.includes('score'));
    if (idxNilai === -1 || (idxNama === -1 && idxNis === -1)) { toast('File harus punya kolom Nama/NIS dan Nilai'); e.target.value = ''; return; }

    let matched = 0, unmatched = 0;
    rows.slice(1).forEach(r => {
      const rowName = idxNama > -1 ? String(r[idxNama] || '').trim().toLowerCase() : '';
      const rowNis = idxNis > -1 ? String(r[idxNis] || '').trim() : '';
      const student = studentsOf(classId).find(s =>
        (rowNis && s.nis && s.nis === rowNis) || (rowName && s.name.toLowerCase() === rowName)
      );
      if (!student) { unmatched++; return; }
      const score = Math.max(0, Math.min(100, Number(r[idxNilai]) || 0));
      let rec = state.grades.find(g => g.classId === classId && g.studentId === student.id && g.type === jenis && g.name === nama);
      if (rec) rec.score = score;
      else state.grades.push({ id: uid(), classId, studentId: student.id, type: jenis, name: nama, score, date: todayStr() });
      matched++;
    });
    saveState(); renderAll();
    toast(`Import selesai: ${matched} cocok, ${unmatched} tidak ditemukan namanya di kelas ini`);
  } catch (err) {
    console.error(err);
    toast('Gagal membaca file nilai');
  }
  e.target.value = '';
});

function avgGrade(studentId, classId, type) {
  const list = state.grades.filter(g => g.classId === classId && g.studentId === studentId && g.type === type);
  if (!list.length) return null;
  return list.reduce((a, g) => a + g.score, 0) / list.length;
}

function computeFinalGrade(studentId, classId) {
  const w = state.settings.weights;
  const types = activeGradeTypes().map(t => t.id);
  const present = types.map(t => ({ t, avg: avgGrade(studentId, classId, t), w: w[t] || 0 })).filter(x => x.avg !== null);
  if (!present.length) return null;
  const totalW = present.reduce((a, x) => a + x.w, 0) || 1;
  return present.reduce((a, x) => a + x.avg * (x.w / totalW), 0);
}

let chartNilaiInst = null;
function renderNilaiRekap() {
  const { classId } = getCtx();
  const tbody = document.querySelector('#nilaiRekapTable tbody');
  const thead = document.querySelector('#nilaiRekapTable thead tr');
  const types = activeGradeTypes();
  thead.innerHTML = '<th>Siswa</th>' + types.map(t => `<th>${t.label}</th>`).join('') + '<th>Nilai akhir</th><th></th>';
  const colCount = types.length + 3;
  if (!classId) { tbody.innerHTML = `<tr><td colspan="${colCount}" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>`; if (chartNilaiInst) chartNilaiInst.destroy(); return; }
  const list = studentsOf(classId);
  const rows = list.map(s => {
    const perType = types.map(t => ({ id: t.id, label: t.label, avg: avgGrade(s.id, classId, t.id) }));
    const fin = computeFinalGrade(s.id, classId);
    return { id: s.id, name: s.name, perType, fin };
  });
  tbody.innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      ${r.perType.map(p => `<td class="numcell">${p.avg !== null ? p.avg.toFixed(1) : '—'}</td>`).join('')}
      <td class="numcell" style="font-weight:600">${r.fin !== null ? r.fin.toFixed(1) : '—'}</td>
      <td><button type="button" class="btn btn-line btn-sm" data-detail="${r.id}">Rincian</button></td>
    </tr>
  `).join('') : `<tr><td colspan="${colCount}" class="empty">Belum ada siswa/nilai.</td></tr>`;

  tbody.querySelectorAll('[data-detail]').forEach(btn => {
    btn.addEventListener('click', () => openNilaiDetailModal(btn.dataset.detail, classId));
  });

  const ctx = document.getElementById('chartNilai');
  if (chartNilaiInst) chartNilaiInst.destroy();
  chartNilaiInst = new Chart(ctx, {
    type: 'bar',
    data: { labels: rows.map(r => r.name), datasets: [{ label: 'Nilai akhir', data: rows.map(r => r.fin ?? 0), backgroundColor: '#8B5CF6', borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
  });
}

/* Modal rincian nilai — menampilkan tiap komponen penilaian (Tugas 1, Tugas 2,
   dst.) satu per satu untuk seorang siswa, sebagai dasar nilai rapor. */
function openNilaiDetailModal(studentId, classId) {
  const s = studentById(studentId);
  const w = state.settings.weights;
  const sections = activeGradeTypes().map(t => {
    const items = state.grades.filter(g => g.classId === classId && g.studentId === studentId && g.type === t.id)
      .sort((a, b) => naturalNameSort(a.name, b.name));
    const avg = avgGrade(studentId, classId, t.id);
    const rows = items.length
      ? items.map(g => `<div class="detail-row"><span>${escapeHtml(g.name)}</span><span class="numcell">${g.score}</span></div>`).join('')
      : '<div class="detail-row"><span class="empty">Belum ada nilai</span></div>';
    return `<div class="detail-group">
      <div class="detail-group-head"><strong>${t.label}</strong><small>bobot ${w[t.id] || 0}%</small></div>
      ${rows}
      <div class="detail-row detail-avg"><span>Rata-rata</span><span class="numcell">${avg !== null ? avg.toFixed(1) : '—'}</span></div>
    </div>`;
  }).join('');
  const fin = computeFinalGrade(studentId, classId);
  openModal(`
    <h3>Rincian nilai — ${escapeHtml(s?.name || '')}</h3>
    <div class="detail-wrap">${sections}</div>
    <div class="detail-final"><span>Nilai akhir (nilai rapor)</span><strong>${fin !== null ? fin.toFixed(1) : '—'}</strong></div>
    <div class="modal-actions"><button class="btn btn-primary" id="mCloseDetail">Tutup</button></div>
  `, box => { box.querySelector('#mCloseDetail').onclick = closeModal; });
}

/* =========================================================================
   JURNAL PRAKTIKUM
   ========================================================================= */

document.getElementById('savePraktikumBtn').addEventListener('click', () => {
  const { classId, date } = getCtx();
  const judul = document.getElementById('prakJudul').value.trim();
  if (!classId) { toast('Pilih kelas terlebih dahulu'); return; }
  if (!judul) { toast('Isi judul percobaan'); return; }
  state.praktikum.push({
    id: uid(), classId, date,
    judul, alat: document.getElementById('prakAlat').value.trim(), k3: document.getElementById('prakK3').value.trim()
  });
  saveState();
  document.getElementById('prakJudul').value = '';
  document.getElementById('prakAlat').value = '';
  document.getElementById('prakK3').value = '';
  toast('Catatan praktikum disimpan');
  renderAll();
});

function renderPraktikumTable() {
  const { classId } = getCtx();
  const tbody = document.querySelector('#praktikumTable tbody');
  if (!classId) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>'; return; }
  const list = state.praktikum.filter(p => p.classId === classId).sort((a, b) => b.date.localeCompare(a.date));
  tbody.innerHTML = list.length ? list.map(p => `
    <tr>
      <td class="numcell">${p.date}</td>
      <td>${escapeHtml(p.judul)}</td>
      <td>${escapeHtml(p.alat)}</td>
      <td>${escapeHtml(p.k3)}</td>
      <td><button class="btn btn-line" data-del-prak="${p.id}" style="color:#E1547A">Hapus</button></td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="empty">Belum ada catatan praktikum untuk kelas ini.</td></tr>';
  tbody.querySelectorAll('[data-del-prak]').forEach(b => b.onclick = () => {
    state.praktikum = state.praktikum.filter(p => p.id !== b.dataset.delPrak);
    saveState(); renderPraktikumTable();
  });
}

/* =========================================================================
   JURNAL MENGAJAR
   ========================================================================= */

document.getElementById('saveJurnalMengajarBtn').addEventListener('click', () => {
  const { classId, date } = getCtx();
  const jamKe = document.getElementById('jmJamKe').value.trim();
  const materi = document.getElementById('jmMateri').value.trim();
  if (!classId) { toast('Pilih kelas terlebih dahulu'); return; }
  if (!materi) { toast('Isi materi yang diajarkan'); return; }
  state.jurnalMengajar.push({
    id: uid(), classId, date, jamKe,
    materi, catatan: document.getElementById('jmCatatan').value.trim()
  });
  saveState();
  document.getElementById('jmJamKe').value = '';
  document.getElementById('jmMateri').value = '';
  document.getElementById('jmCatatan').value = '';
  toast('Catatan mengajar disimpan');
  renderAll();
});

function renderJurnalMengajarView() {
  const { classId, date } = getCtx();
  document.getElementById('jmTanggalLabel').textContent = fmtDateID(date);
  const tbody = document.querySelector('#jurnalMengajarTable tbody');
  if (!classId) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>'; return; }
  const list = state.jurnalMengajar.filter(j => j.classId === classId).sort((a, b) => b.date.localeCompare(a.date) || String(b.jamKe).localeCompare(String(a.jamKe)));
  tbody.innerHTML = list.length ? list.map(j => `
    <tr>
      <td class="numcell">${j.date}</td>
      <td class="numcell">${escapeHtml(j.jamKe || '—')}</td>
      <td>${escapeHtml(j.materi)}</td>
      <td>${escapeHtml(j.catatan || '—')}</td>
      <td><button class="btn btn-line" data-del-jm="${j.id}" style="color:#E1547A">Hapus</button></td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="empty">Belum ada catatan mengajar untuk kelas ini.</td></tr>';
  tbody.querySelectorAll('[data-del-jm]').forEach(b => b.onclick = () => {
    state.jurnalMengajar = state.jurnalMengajar.filter(j => j.id !== b.dataset.delJm);
    saveState(); renderJurnalMengajarView();
  });
}

/* =========================================================================
   DASHBOARD
   ========================================================================= */

function renderDashboard() {
  const { classId, date } = getCtx();
  document.getElementById('dashDateLabel').textContent = fmtDateID(date);

  const dayAtt = state.attendance.filter(a => a.date === date && (!classId || a.classId === classId));
  document.getElementById('statHadir').textContent = dayAtt.filter(a => a.status === 'Hadir').length;
  document.getElementById('statSakit').textContent = dayAtt.filter(a => a.status === 'Sakit').length;
  document.getElementById('statIzin').textContent = dayAtt.filter(a => a.status === 'Izin').length;
  document.getElementById('statAlpha').textContent = dayAtt.filter(a => a.status === 'Alpha').length;

  const classesWithStudents = state.classes.filter(c => studentsOf(c.id).length);
  const belum = classesWithStudents.filter(c => !state.attendance.some(a => a.classId === c.id && a.date === date));
  document.getElementById('statBelumAbsen').textContent = belum.length;

  // perlu perhatian: kehadiran 30 hari terakhir < 80%, atau nilai akhir < KKM
  const cutoff = new Date(date); cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const attn = [];
  state.students.forEach(s => {
    const recs = state.attendance.filter(a => a.studentId === s.id && a.date >= cutoffStr && a.date <= date);
    if (recs.length >= 3) {
      const hadir = recs.filter(a => a.status === 'Hadir').length;
      const pct = (hadir / recs.length) * 100;
      if (pct < 80) attn.push({ name: s.name, kelas: classById(s.classId)?.name, tag: `${pct.toFixed(0)}% hadir`, ok: false });
    }
    const fin = computeFinalGrade(s.id, s.classId);
    if (fin !== null && fin < KKM_DEFAULT) attn.push({ name: s.name, kelas: classById(s.classId)?.name, tag: `Nilai ${fin.toFixed(0)}`, ok: false });
  });
  const attnList = document.getElementById('attentionList');
  attnList.innerHTML = attn.length
    ? attn.slice(0, 8).map(a => `<div class="attn-row"><span>${escapeHtml(a.name)} <small style="color:var(--ink-soft)">· ${escapeHtml(a.kelas || '')}</small></span><span class="attn-tag">${escapeHtml(a.tag)}</span></div>`).join('')
    : '<p class="empty">Tidak ada yang perlu perhatian khusus saat ini.</p>';

  // papan keaktifan 7 hari terakhir, semua kelas
  const cutoff7 = new Date(date); cutoff7.setDate(cutoff7.getDate() - 7);
  const cutoff7Str = cutoff7.toISOString().slice(0, 10);
  const totals = {};
  state.activityPoints.filter(a => a.date >= cutoff7Str && a.date <= date).forEach(a => {
    totals[a.studentId] = (totals[a.studentId] || 0) + a.points;
  });
  const ranked = Object.entries(totals).map(([sid, pts]) => ({ s: studentById(sid), pts })).filter(x => x.s).sort((a, b) => b.pts - a.pts).slice(0, 8);
  const topList = document.getElementById('topActiveList');
  topList.innerHTML = ranked.length
    ? ranked.map(r => `<div class="attn-row"><span>${escapeHtml(r.s.name)} <small style="color:var(--ink-soft)">· ${escapeHtml(classById(r.s.classId)?.name || '')}</small></span><span class="attn-tag ok">${r.pts} poin</span></div>`).join('')
    : '<p class="empty">Belum ada poin keaktifan tercatat.</p>';
}

/* =========================================================================
   REKAP & LAPORAN
   ========================================================================= */

let currentRekapRows = [];
let chartAbsensiInst = null, chartKorelasiInst = null;

const rekapFrom = document.getElementById('rekapFrom');
const rekapTo = document.getElementById('rekapTo');

function defaultRekapRange() {
  const d = new Date(globalDate.value || todayStr());
  const first = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  if (!rekapFrom.value) rekapFrom.value = first;
  if (!rekapTo.value) rekapTo.value = last;
}

document.getElementById('rekapRunBtn').addEventListener('click', renderRekapView);

function renderRekapView() {
  defaultRekapRange();
  const { classId } = getCtx();
  const from = rekapFrom.value, to = rekapTo.value;
  const tbody = document.querySelector('#rekapTable tbody');
  if (!classId) { tbody.innerHTML = '<tr><td colspan="8" class="empty">Pilih kelas di atas terlebih dahulu.</td></tr>'; return; }

  const list = studentsOf(classId);
  currentRekapRows = list.map(s => {
    const recs = state.attendance.filter(a => a.studentId === s.id && a.date >= from && a.date <= to);
    const hadir = recs.filter(a => a.status === 'Hadir').length;
    const sakit = recs.filter(a => a.status === 'Sakit').length;
    const izin = recs.filter(a => a.status === 'Izin').length;
    const alpha = recs.filter(a => a.status === 'Alpha').length;
    const pct = recs.length ? (hadir / recs.length) * 100 : 0;
    const poin = state.activityPoints.filter(a => a.studentId === s.id && a.date >= from && a.date <= to).reduce((sum, a) => sum + a.points, 0);
    const fin = computeFinalGrade(s.id, classId);
    return { name: s.name, hadir, sakit, izin, alpha, pct, poin, fin };
  });

  tbody.innerHTML = currentRekapRows.length ? currentRekapRows.map(r => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td class="numcell">${r.hadir}</td>
      <td class="numcell">${r.sakit}</td>
      <td class="numcell">${r.izin}</td>
      <td class="numcell">${r.alpha}</td>
      <td class="numcell">${r.pct.toFixed(0)}%</td>
      <td class="numcell">${r.poin}</td>
      <td class="numcell">${r.fin !== null ? r.fin.toFixed(1) : '—'}</td>
    </tr>
  `).join('') : '<tr><td colspan="8" class="empty">Tidak ada data pada rentang ini.</td></tr>';

  const ctxA = document.getElementById('chartAbsensi');
  if (chartAbsensiInst) chartAbsensiInst.destroy();
  chartAbsensiInst = new Chart(ctxA, {
    type: 'bar',
    data: { labels: currentRekapRows.map(r => r.name), datasets: [{ label: '% Kehadiran', data: currentRekapRows.map(r => r.pct), backgroundColor: '#A78BFA' }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
  });

  const ctxK = document.getElementById('chartKorelasi');
  if (chartKorelasiInst) chartKorelasiInst.destroy();
  chartKorelasiInst = new Chart(ctxK, {
    type: 'scatter',
    data: { datasets: [{ label: 'Siswa', data: currentRekapRows.filter(r => r.fin !== null).map(r => ({ x: r.pct, y: r.fin })), backgroundColor: '#7040E0' }] },
    options: { scales: { x: { title: { display: true, text: '% Kehadiran' }, min: 0, max: 100 }, y: { title: { display: true, text: 'Nilai akhir' }, min: 0, max: 100 } } }
  });
}

/* ---- Ekspor Excel / Word / PDF ---- */

function rekapAoa() {
  const header = ['Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpha', '% Kehadiran', 'Poin Keaktifan', 'Nilai Akhir'];
  const body = currentRekapRows.map(r => [r.name, r.hadir, r.sakit, r.izin, r.alpha, r.pct.toFixed(0) + '%', r.poin, r.fin !== null ? r.fin.toFixed(1) : '-']);
  return [header, ...body];
}

document.getElementById('exportExcelBtn').addEventListener('click', () => {
  if (!currentRekapRows.length) { toast('Tampilkan rekap terlebih dahulu'); return; }
  const ws = XLSX.utils.aoa_to_sheet(rekapAoa());
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
  XLSX.writeFile(wb, `rekap-${classById(getCtx().classId)?.name || 'kelas'}-${rekapFrom.value}_${rekapTo.value}.xlsx`);
});

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  if (!currentRekapRows.length) { toast('Tampilkan rekap terlebih dahulu'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const kelas = classById(getCtx().classId)?.name || '';
  doc.setFontSize(13); doc.text(`Rekap Kelas ${kelas}`, 14, 15);
  doc.setFontSize(9); doc.text(`Periode: ${rekapFrom.value} s/d ${rekapTo.value}`, 14, 21);
  const aoa = rekapAoa();
  doc.autoTable({ head: [aoa[0]], body: aoa.slice(1), startY: 26, styles: { fontSize: 8 }, headStyles: { fillColor: [112, 64, 224] } });
  doc.save(`rekap-${kelas}-${rekapFrom.value}_${rekapTo.value}.pdf`);
});

document.getElementById('exportWordBtn').addEventListener('click', () => {
  if (!currentRekapRows.length) { toast('Tampilkan rekap terlebih dahulu'); return; }
  const kelas = classById(getCtx().classId)?.name || '';
  const aoa = rekapAoa();
  const tableHtml = `<table border="1" style="border-collapse:collapse;font-family:Calibri;font-size:12px">
    <thead><tr>${aoa[0].map(h => `<th style="padding:4px;background:#7040E0;color:#fff">${h}</th>`).join('')}</tr></thead>
    <tbody>${aoa.slice(1).map(row => `<tr>${row.map(c => `<td style="padding:4px">${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>Rekap</title></head>
    <body>
      <h2 style="font-family:Calibri">Rekap Kelas ${kelas}</h2>
      <p style="font-family:Calibri;font-size:12px">Periode: ${rekapFrom.value} s/d ${rekapTo.value}</p>
      ${tableHtml}
    </body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `rekap-${kelas}-${rekapFrom.value}_${rekapTo.value}.doc`;
  link.click();
});

/* =========================================================================
   PENGATURAN
   ========================================================================= */

const BOBOT_IDS = { tugas: 'bobotTugas', uh: 'bobotUh', ulisan: 'bobotUlisan', uts: 'bobotUts', uas: 'bobotUas', praktikum: 'bobotPraktikum' };

function renderPengaturan() {
  const w = state.settings.weights;
  Object.entries(BOBOT_IDS).forEach(([key, id]) => { document.getElementById(id).value = w[key] || 0; });
  document.getElementById('enableUlisanToggle').checked = !!state.settings.enableUlisan;
  document.getElementById('bobotUlisanWrap').style.display = state.settings.enableUlisan ? '' : 'none';
  updateBobotHint();
  document.getElementById('sheetsUrl').value = state.settings.sheetsUrl || '';
  document.getElementById('autoSyncToggle').checked = !!state.settings.autoSync;
}

function updateBobotHint() {
  const ids = state.settings.enableUlisan ? Object.values(BOBOT_IDS) : Object.values(BOBOT_IDS).filter(id => id !== 'bobotUlisan');
  const total = ids.reduce((a, id) => a + (Number(document.getElementById(id).value) || 0), 0);
  const hint = document.getElementById('bobotHint');
  hint.textContent = `Total saat ini: ${total}%` + (total !== 100 ? ' — sebaiknya 100%, tapi aplikasi tetap akan menormalkan otomatis.' : ' ✓');
}
Object.values(BOBOT_IDS).forEach(id => document.getElementById(id).addEventListener('input', updateBobotHint));

document.getElementById('enableUlisanToggle').addEventListener('change', (e) => {
  state.settings.enableUlisan = e.target.checked;
  saveState();
  refreshNilaiJenisOptions();
  renderPengaturan();
  renderNilaiChips();
  renderNilaiInputTable();
  renderNilaiRekap();
  toast(state.settings.enableUlisan ? 'Ulangan Lisan diaktifkan' : 'Ulangan Lisan dinonaktifkan');
});

document.getElementById('saveBobotBtn').addEventListener('click', () => {
  const weights = {};
  Object.entries(BOBOT_IDS).forEach(([key, id]) => { weights[key] = Number(document.getElementById(id).value) || 0; });
  state.settings.weights = weights;
  saveState();
  toast('Bobot nilai disimpan');
  renderAll();
});

document.getElementById('saveSheetsBtn').addEventListener('click', async () => {
  const url = document.getElementById('sheetsUrl').value.trim();
  state.settings.sheetsUrl = url;
  state.settings.autoSync = document.getElementById('autoSyncToggle').checked;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const result = document.getElementById('sheetsTestResult');
  if (!url) { result.textContent = 'URL dikosongkan — sinkronisasi otomatis dimatikan.'; updateSyncBadge(); return; }
  result.textContent = 'Menguji koneksi (mengambil data dari Spreadsheet)…';
  const ok = await pullFromSheets(true);
  if (ok) {
    result.textContent = '✓ Terhubung. Data dari Spreadsheet berhasil dimuat ke perangkat ini. Jika sebelumnya Anda sudah punya data di perangkat ini, klik "Kirim ke Spreadsheet" sekali agar ikut tersimpan di sana.';
  } else {
    result.textContent = '✗ Gagal terhubung. Cek kembali URL dan langkah deploy di TUTORIAL.md (pastikan sudah redeploy sebagai versi terbaru).';
  }
});

document.getElementById('downloadBackupBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `cadangan-bukukelas-${todayStr()}.json`;
  link.click();
});

document.getElementById('restoreFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!confirm('Ini akan menimpa seluruh data saat ini dengan isi file cadangan. Lanjutkan?')) return;
      state = Object.assign(structuredClone(DEFAULT_STATE), data, { settings: Object.assign({}, DEFAULT_STATE.settings, data.settings || {}) });
      saveState(); refreshKelasOptions(); renderAll();
      toast('Data berhasil dipulihkan');
    } catch (err) { toast('File cadangan tidak valid'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('resetDataBtn').addEventListener('click', () => {
  if (!confirm('Semua data (kelas, siswa, absensi, nilai) akan dihapus permanen dari peramban ini. Yakin?')) return;
  if (!confirm('Konfirmasi sekali lagi: hapus semua data?')) return;
  state = structuredClone(DEFAULT_STATE);
  saveState(); refreshKelasOptions(); renderAll();
  toast('Semua data telah dihapus');
});

/* =========================================================================
   SINKRON DENGAN GOOGLE SPREADSHEET (dua arah)
   ========================================================================= */

function updateSyncBadge() {
  const dot = document.getElementById('syncDot');
  const label = document.getElementById('syncLabel');
  const timeEl = document.getElementById('syncTime');
  if (state.settings.sheetsUrl) {
    dot.classList.toggle('is-ok', !!(state.settings.lastSync || state.settings.lastPull));
    label.textContent = hasUnsyncedChanges() ? 'Ada perubahan belum dikirim' : 'Tersambung ke Google Sheets (Gmail)';
  } else {
    dot.classList.remove('is-ok');
    label.textContent = 'Belum tersambung ke Google/Gmail';
  }
  const parts = [];
  if (state.settings.lastPull) parts.push('Ambil: ' + new Date(state.settings.lastPull).toLocaleString('id-ID'));
  if (state.settings.lastSync) parts.push('Kirim: ' + new Date(state.settings.lastSync).toLocaleString('id-ID'));
  timeEl.textContent = parts.length ? parts.join(' · ') : '—';
}

/* KIRIM: mendorong seluruh data perangkat ini ke Spreadsheet (menimpa isi
   Spreadsheet dengan versi dari perangkat ini). */
async function syncToSheets(silent) {
  const url = state.settings.sheetsUrl;
  if (!url) { if (!silent) toast('Isi URL Google Apps Script di Pengaturan terlebih dahulu'); return false; }
  const payload = {
    classes: state.classes,
    students: state.students.map(s => ({ ...s, kelas: classById(s.classId)?.name || '' })),
    attendance: state.attendance.map(a => ({ ...a, kelas: classById(a.classId)?.name || '', siswa: studentById(a.studentId)?.name || '' })),
    activityPoints: state.activityPoints.map(a => ({ ...a, kelas: classById(a.classId)?.name || '', siswa: studentById(a.studentId)?.name || '' })),
    grades: state.grades.map(g => ({ ...g, kelas: classById(g.classId)?.name || '', siswa: studentById(g.studentId)?.name || '' })),
    praktikum: state.praktikum.map(p => ({ ...p, kelas: classById(p.classId)?.name || '' })),
    jurnalMengajar: state.jurnalMengajar.map(j => ({ ...j, kelas: classById(j.classId)?.name || '' })),
    pengaturan: { weights: state.settings.weights, enableUlisan: state.settings.enableUlisan, activityCategories: state.activityCategories },
    syncedAt: new Date().toISOString()
  };
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    state.settings.lastSync = new Date().toISOString();
    state.settings.syncedSnapshot = coreSnapshotStr();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSyncBadge();
    if (!silent) toast('Data terkirim ke Spreadsheet');
    return true;
  } catch (err) {
    console.error('Sinkron (kirim) gagal', err);
    if (!silent) toast('Gagal mengirim data. Periksa koneksi internet dan URL.');
    return false;
  }
}

/* AMBIL: menarik data terbaru dari Spreadsheet dan menggantikan data di
   perangkat ini dengannya (dipakai supaya perubahan dari perangkat lain
   ikut muncul di sini). */
async function pullFromSheets(silent) {
  const url = state.settings.sheetsUrl;
  if (!url) { if (!silent) toast('Isi URL Google Apps Script di Pengaturan terlebih dahulu'); return false; }
  try {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(url + sep + 'action=pull&t=' + Date.now());
    const data = await res.json();
    if (!data || !data.ok) throw new Error((data && data.error) || 'Respons tidak valid');
    applyCloudSnapshot(data);
    state.settings.lastPull = new Date().toISOString();
    state.settings.syncedSnapshot = coreSnapshotStr();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSyncBadge();
    if (!silent) toast('Data terbaru berhasil diambil dari Spreadsheet');
    return true;
  } catch (err) {
    console.error('Sinkron (ambil) gagal', err);
    if (!silent) toast('Gagal mengambil data. Pastikan URL benar & skrip sudah versi terbaru (lihat TUTORIAL.md).');
    return false;
  }
}

function applyCloudSnapshot(data) {
  state.classes = data.classes || [];
  state.students = data.students || [];
  state.attendance = data.attendance || [];
  state.activityPoints = data.activityPoints || [];
  state.grades = data.grades || [];
  state.praktikum = data.praktikum || [];
  state.jurnalMengajar = data.jurnalMengajar || [];
  if (data.pengaturan) {
    if (data.pengaturan.weights) state.settings.weights = Object.assign({}, DEFAULT_STATE.settings.weights, data.pengaturan.weights);
    if (typeof data.pengaturan.enableUlisan === 'boolean') state.settings.enableUlisan = data.pengaturan.enableUlisan;
    if (Array.isArray(data.pengaturan.activityCategories) && data.pengaturan.activityCategories.length) state.activityCategories = data.pengaturan.activityCategories;
  }
  refreshKelasOptions();
  refreshNilaiJenisOptions();
  renderAll();
}

document.getElementById('syncNowBtn').addEventListener('click', () => syncToSheets(false));
document.getElementById('pullNowBtn').addEventListener('click', () => {
  if (hasUnsyncedChanges() && !confirm('Ada perubahan di perangkat ini yang belum dikirim ke Spreadsheet — mengambil data terbaru sekarang akan MENIMPA perubahan tersebut. Lanjutkan?')) return;
  pullFromSheets(false);
});

/* =========================================================================
   RENDER SEMUA
   ========================================================================= */

function renderAll() {
  renderKelasTable();
  renderSiswaTable();
  renderAbsensiView();
  renderKeaktifanView();
  refreshNilaiJenisOptions();
  renderNilaiChips();
  renderNilaiInputTable();
  renderNilaiRekap();
  renderPraktikumTable();
  renderJurnalMengajarView();
  renderRekapView();
  renderDashboard();
  renderPengaturan();
  updateSyncBadge();
}

refreshKelasOptions();
refreshNilaiJenisOptions();
renderAll();

/* Saat aplikasi dibuka: jika sudah terhubung ke Spreadsheet DAN tidak ada
   perubahan lokal yang belum dikirim, ambil data terbaru secara otomatis
   (diam-diam) supaya perangkat ini selalu memakai data terbaru dari
   perangkat lain. Kalau ada perubahan lokal yang belum dikirim, JANGAN
   ditimpa otomatis — cukup beri tahu penggunanya. */
if (state.settings.sheetsUrl) {
  if (hasUnsyncedChanges()) {
    toast('Ada perubahan lokal yang belum dikirim ke Spreadsheet. Klik "Kirim ke Spreadsheet" dulu.');
  } else {
    pullFromSheets(true);
  }
}

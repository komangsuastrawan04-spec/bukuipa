/**
 * BUKU KELAS — Backend Google Apps Script
 * ----------------------------------------
 * Skrip ini menjadikan sebuah Google Spreadsheet (di akun Gmail Anda sendiri)
 * sebagai "sumber data bersama" untuk aplikasi Buku Kelas, sehingga data yang
 * diisi dari satu perangkat (mis. laptop) bisa dimuat kembali di perangkat
 * lain (mis. HP), dan sebaliknya.
 *
 *   - doPost  → menerima data dari aplikasi (dipanggil saat "Kirim ke Spreadsheet")
 *               dan menuliskannya ke beberapa sheet.
 *   - doGet   → dipanggil dengan ?action=pull untuk MEMBACA kembali seluruh
 *               data dari sheet dan mengirimkannya sebagai JSON ke aplikasi
 *               (dipakai saat aplikasi dibuka, atau saat "Ambil data terbaru").
 *
 * CARA PAKAI: lihat TUTORIAL.md di paket aplikasi ini.
 *
 * PENTING: setiap kali file ini diperbarui, Anda harus membuat DEPLOYMENT
 * VERSI BARU (Deploy → Manage deployments → ikon pensil → New version →
 * Deploy) agar perubahan benar-benar aktif. Menyimpan kode saja tidak cukup.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    writeSheet(ss, 'Kelas', data.classes, ['id', 'name', 'subject', 'year']);
    writeSheet(ss, 'Siswa', data.students, ['id', 'name', 'nis', 'gender', 'kelas', 'classId']);
    writeSheet(ss, 'Absensi', data.attendance, ['date', 'kelas', 'siswa', 'status', 'note', 'id', 'classId', 'studentId']);
    writeSheet(ss, 'Keaktifan', data.activityPoints, ['date', 'kelas', 'siswa', 'category', 'points', 'id', 'classId', 'studentId']);
    writeSheet(ss, 'Nilai', data.grades, ['date', 'kelas', 'siswa', 'type', 'name', 'score', 'id', 'classId', 'studentId']);
    writeSheet(ss, 'Praktikum', data.praktikum, ['date', 'kelas', 'judul', 'alat', 'k3', 'id', 'classId']);
    writeSheet(ss, 'Jurnal Mengajar', data.jurnalMengajar, ['date', 'kelas', 'jamKe', 'materi', 'catatan', 'id', 'classId']);
    writePengaturan(ss, data.pengaturan);

    const metaSheet = getOrCreateSheet(ss, 'Info Sinkron');
    metaSheet.clear();
    metaSheet.getRange(1, 1, 2, 2).setValues([
      ['Terakhir sinkron (kirim)', 'Jumlah siswa'],
      [data.syncedAt || new Date().toISOString(), (data.students || []).length]
    ]);

    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    if (action === 'pull') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const data = {
        ok: true,
        classes: readSheet(ss, 'Kelas', ['id', 'name', 'subject', 'year']),
        students: readSheet(ss, 'Siswa', ['id', 'name', 'nis', 'gender', 'classId']),
        attendance: readSheet(ss, 'Absensi', ['id', 'classId', 'studentId', 'date', 'status', 'note']),
        activityPoints: readSheet(ss, 'Keaktifan', ['id', 'classId', 'studentId', 'date', 'category', 'points']),
        grades: readSheet(ss, 'Nilai', ['id', 'classId', 'studentId', 'type', 'name', 'score', 'date']),
        praktikum: readSheet(ss, 'Praktikum', ['id', 'classId', 'date', 'judul', 'alat', 'k3']),
        jurnalMengajar: readSheet(ss, 'Jurnal Mengajar', ['id', 'classId', 'date', 'jamKe', 'materi', 'catatan']),
        pengaturan: readPengaturan(ss)
      };
      return jsonOutput(data);
    }
    return jsonOutput({ ok: true, message: 'Buku Kelas backend aktif.' });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function writeSheet(ss, name, rows, columns) {
  const sheet = getOrCreateSheet(ss, name);
  sheet.clear();
  if (!rows || !rows.length) {
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    return;
  }
  const header = columns;
  const body = rows.map(r => columns.map(c => (r[c] !== undefined && r[c] !== null) ? r[c] : ''));
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  sheet.getRange(2, 1, body.length, header.length).setValues(body);
  sheet.setFrozenRows(1);
}

/* Membaca sebuah sheet kembali menjadi array of object, mengambil hanya kolom
   yang namanya ada di `keys` (dicocokkan lewat baris header), berapa pun
   urutan kolomnya di sheet. Kolom tampilan seperti "kelas"/"siswa" otomatis
   diabaikan kalau tidak diminta di `keys`. */
function readSheet(ss, sheetName, keys) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const header = values[0].map(h => String(h).trim());
  const idx = {};
  header.forEach((h, i) => { idx[h] = i; });
  return values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      keys.forEach(k => {
        if (idx[k] === undefined) { obj[k] = ''; return; }
        let v = row[idx[k]];
        if (k === 'score' || k === 'points') v = Number(v) || 0;
        else if (v === null || v === undefined) v = '';
        else if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        obj[k] = v;
      });
      return obj;
    });
}

/* Pengaturan bersama (bobot nilai, status Ulangan Lisan, kategori keaktifan)
   disimpan sebagai satu baris JSON di sheet "Pengaturan" supaya semua
   perangkat memakai bobot dan kategori yang sama. */
function writePengaturan(ss, pengaturan) {
  const sheet = getOrCreateSheet(ss, 'Pengaturan');
  sheet.clear();
  sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  sheet.getRange(2, 1, 1, 2).setValues([['settingsJson', JSON.stringify(pengaturan || {})]]);
}

function readPengaturan(ss) {
  const sheet = ss.getSheetByName('Pengaturan');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === 'settingsJson') {
      try { return JSON.parse(values[i][1]); } catch (e) { return null; }
    }
  }
  return null;
}

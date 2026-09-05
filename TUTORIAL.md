# Tutorial: Mengonlinkan "Buku Kelas" & Menghubungkannya ke Google Spreadsheet (akun Gmail Anda)

> **Update:** menu **Nilai** kini mendukung banyak penilaian per jenis — misalnya **Tugas 1, Tugas 2, Tugas 3**, **Ulangan Harian 1, 2, 3**, dan **Ulangan Lisan** (opsional, aktifkan di Pengaturan). Semua otomatis dirata-rata lalu digabung sesuai bobot menjadi **nilai akhir/rapor**. Tampilan juga sudah diperbarui dengan tema ungu muda yang lebih rapi.

Paket ini berisi:
```
absensi-ipa/
├── index.html              ← halaman utama aplikasi
├── style.css                ← tampilan
├── app.js                   ← seluruh logika aplikasi
├── google-apps-script.gs    ← kode backend untuk Google Spreadsheet
└── TUTORIAL.md               ← file ini
```

Aplikasi ini **berjalan sepenuhnya di peramban** (tidak butuh server/database berbayar). Data tersimpan otomatis di penyimpanan lokal peramban Anda (localStorage), dan bisa dicadangkan otomatis ke Google Spreadsheet.

Ada 2 tahap:
1. **Mengonlinkan aplikasi** (supaya bisa dibuka lewat link, dari laptop maupun HP)
2. **Menghubungkan ke Google Spreadsheet** (supaya data ter-backup otomatis)

---

## Bagian 1 — Mengonlinkan Aplikasi

Gunakan salah satu cara di bawah ini. **Cara A (GitHub Pages)** direkomendasikan karena gratis selamanya dan stabil.

### Cara A — GitHub Pages (gratis, direkomendasikan)

1. Buat akun di [github.com](https://github.com) jika belum punya.
2. Klik tombol **+** di kanan atas → **New repository**.
   - Nama repository: `buku-kelas` (bebas)
   - Pilih **Public**
   - Klik **Create repository**
3. Di halaman repository yang baru dibuat, klik **uploading an existing file**.
4. Seret (drag & drop) 3 file: `index.html`, `style.css`, `app.js` ke area upload.
   *(File `google-apps-script.gs` dan `TUTORIAL.md` tidak perlu diupload ke sini.)*
5. Klik **Commit changes**.
6. Buka menu **Settings** (di repository yang sama) → klik **Pages** di sidebar kiri.
7. Pada bagian **Build and deployment → Branch**, pilih `main` dan folder `/ (root)`, lalu klik **Save**.
8. Tunggu 1–2 menit, refresh halaman tersebut. Akan muncul link seperti:
   ```
   https://nama-akun-anda.github.io/buku-kelas/
   ```
9. Buka link itu — aplikasi Anda sudah online dan bisa diakses dari HP maupun laptop mana pun.

> Setiap kali Anda ingin memperbarui aplikasi (misalnya ada fitur baru), cukup upload ulang file yang berubah lewat menu **Add file → Upload files** di repository yang sama.

### Cara B — Netlify Drop (paling cepat, tanpa akun GitHub)

1. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
2. Seret **folder** `absensi-ipa` (yang berisi index.html, style.css, app.js) ke halaman tersebut.
3. Tunggu proses upload selesai — Netlify langsung memberi Anda link publik (misalnya `https://nama-acak.netlify.app`).
4. (Opsional) Daftar akun gratis di Netlify agar link tersebut permanen dan bisa Anda kelola/ubah nama.

### Cara C — Dibuka langsung dari HP/laptop tanpa online (paling sederhana)

Anda juga bisa membuka `index.html` langsung dua kali klik dari file manager — aplikasi tetap berjalan penuh secara lokal. Kekurangannya: hanya bisa diakses dari perangkat itu saja, dan alamatnya tidak bisa dibagikan sebagai link. Cocok untuk dicoba dulu sebelum online-kan dengan Cara A/B.

---

## Bagian 2 — Menghubungkan ke Akun Gmail Anda lewat Google Spreadsheet (Sinkron Dua Arah)

Karena aplikasi ini berjalan penuh di peramban (tanpa server berbayar), cara paling aman untuk menghubungkannya ke **akun Gmail Anda** adalah lewat **Google Apps Script** — fitur bawaan Google yang gratis. Skrip ini akan **dideploy dari akun Gmail Anda sendiri**, sehingga saat Anda login di Langkah 3, data (Spreadsheet-nya) benar-benar tersimpan di Google Drive akun Gmail Anda, bukan di server pihak ketiga mana pun.

Sejak versi ini, Spreadsheet tidak lagi hanya jadi cadangan satu arah — ia jadi **data bersama antar perangkat**:
- Setiap kali aplikasi dibuka (di HP atau laptop mana pun), aplikasi otomatis **mengambil** data terbaru dari Spreadsheet.
- Setiap kali Anda menekan **"Kirim ke Spreadsheet"** (atau mengaktifkan sinkron otomatis), data di perangkat itu **dikirim** dan menimpa isi Spreadsheet.

Ini membuat kelas yang diinput di laptop bisa langsung terlihat di HP, dan sebaliknya — asalkan Anda **selalu kirim dulu sebelum pindah perangkat**.

### Langkah 1 — Buat Spreadsheet baru

1. Buka [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Beri nama, misalnya **"Backup Buku Kelas IPA"**.

### Langkah 2 — Tempelkan kode backend

1. Di spreadsheet tadi, klik menu **Extensions → Apps Script**.
2. Hapus semua kode contoh yang ada di editor (`function myFunction() {...}`).
3. Buka file `google-apps-script.gs` dari paket aplikasi ini, **copy semua isinya**, lalu **paste** ke editor Apps Script.
4. Klik ikon 💾 **Save project** (beri nama proyek, misalnya "Backend Buku Kelas").

### Langkah 3 — Deploy sebagai Web App

1. Di editor Apps Script, klik tombol biru **Deploy** (kanan atas) → **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi pengaturan:
   - **Description**: `Buku Kelas backend`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: **`Anyone`** ← ini penting, agar aplikasi bisa mengirim data tanpa perlu login Google setiap saat.
4. Klik **Deploy**.
5. Google akan meminta Anda **mengizinkan akses** (Authorize access):
   - Pilih akun Google Anda.
   - Akan muncul peringatan "Google hasn't verified this app" — ini normal karena skrip ini milik Anda sendiri, bukan aplikasi pihak ketiga. Klik **Advanced** → **Go to Backend Buku Kelas (unsafe)** → **Allow**.
6. Setelah berhasil, Anda akan mendapat **Web app URL**, formatnya seperti:
   ```
   https://script.google.com/macros/s/AKfycb........................../exec
   ```
   **Salin (copy) URL ini.**

### Langkah 4 — Tempelkan URL ke aplikasi

1. Buka aplikasi Buku Kelas Anda (dari link GitHub Pages/Netlify tadi) — di **perangkat pertama** yang sudah berisi data (mis. laptop tempat Anda mulai mengisi kelas).
2. Masuk ke menu **Pengaturan** (sidebar kiri).
3. Tempelkan URL tadi ke kolom **URL Web App**.
4. (Opsional) Centang **"Kirim otomatis ke Spreadsheet setelah menyimpan"** agar setiap kali Anda menyimpan absensi/nilai, data langsung terkirim tanpa perlu klik tombol manual.
5. Klik **Simpan & tes koneksi**. Ini hanya akan **membaca** (aman, tidak menghapus apa pun) untuk memastikan URL benar.
6. Karena Spreadsheet masih kosong dan perangkat ini sudah punya data, klik **"⬆ Kirim ke Spreadsheet"** (pojok kanan atas) sekali untuk mengunggah data yang sudah ada.
7. Buka kembali Google Spreadsheet Anda — akan muncul sheet baru: **Kelas, Siswa, Absensi, Keaktifan, Nilai, Praktikum, Jurnal Mengajar, Pengaturan, Info Sinkron** — semuanya terisi otomatis.

### Langkah 5 — Menghubungkan perangkat kedua (mis. HP)

1. Buka link aplikasi yang sama di HP.
2. Masuk ke **Pengaturan**, tempelkan **URL Web App yang sama** persis seperti di laptop, lalu **Simpan & tes koneksi**.
3. Karena HP ini belum punya data lokal, data dari Spreadsheet akan otomatis termuat — kelas dan nilai yang Anda input di laptop akan langsung muncul.

Selanjutnya, setiap kali membuka aplikasi di perangkat mana pun, data terbaru otomatis diambil. Setelah mengedit, ingat klik **"⬆ Kirim ke Spreadsheet"** (atau aktifkan sinkron otomatis) supaya perangkat lain ikut mendapat pembaruannya. Kalau ingin memuat ulang data terbaru di tengah sesi (misalnya setelah perangkat lain baru saja mengirim), klik **"⬇ Ambil data terbaru"**.

---

## Update Deployment Apps Script (jika Anda mengubah kode .gs di kemudian hari)

Jika suatu saat kode `google-apps-script.gs` diperbarui:
1. Buka kembali **Extensions → Apps Script** dari spreadsheet yang sama.
2. Ganti isi kode dengan versi baru → **Save**.
3. Klik **Deploy → Manage deployments** → klik ikon pensil (edit) pada deployment yang aktif.
4. Di bagian **Version**, pilih **New version** → klik **Deploy**.
   *(URL Web App tidak akan berubah, jadi tidak perlu mengubah pengaturan di aplikasi.)*

---

## Troubleshooting

**Tombol "Kirim" / "Ambil" selalu gagal**
- Pastikan **Who has access** diset ke **Anyone**, bukan "Only myself".
- Pastikan URL yang ditempel diakhiri `/exec`, bukan `/dev`.
- Coba buka `URL-Anda?action=pull` langsung di tab baru browser — seharusnya muncul teks JSON berisi data Anda. Jika muncul halaman login Google, berarti izin akses belum benar (ulangi Langkah 3), atau Anda perlu membuat **New version** setelah update kode (lihat bagian di atas).

**Data di Spreadsheet/perangkat lain tidak ter-update setelah edit kode .gs**
- Anda perlu membuat **New version** lewat Manage deployments (lihat bagian "Update Deployment" di atas) — menyimpan kode saja tidak otomatis memperbarui Web App yang sudah dideploy.

**Saya ganti perangkat, data kelas hilang / tidak muncul**
- Pastikan **URL Web App yang ditempel di Pengaturan sama persis** di kedua perangkat.
- Pastikan sebelum pindah perangkat, Anda sudah klik **"⬆ Kirim ke Spreadsheet"** di perangkat sebelumnya (kalau belum, data terbaru belum ada di Spreadsheet untuk diambil perangkat lain).
- Di perangkat baru, coba klik manual **"⬇ Ambil data terbaru"** di pojok kanan atas.
- Sebagai jaring pengaman tambahan, Anda tetap bisa **Pengaturan → Unduh cadangan JSON** lalu **Pulihkan dari cadangan** di perangkat lain.

**Muncul pesan "Ada perubahan lokal yang belum dikirim" saat membuka aplikasi**
- Ini artinya ada data di perangkat ini yang belum sempat dikirim ke Spreadsheet sejak terakhir disinkron — aplikasi sengaja **tidak** menimpanya secara otomatis agar data itu tidak hilang. Klik **"⬆ Kirim ke Spreadsheet"** dulu, baru aman untuk mengambil data dari perangkat lain kalau diperlukan.

**Bisakah dipakai beberapa guru sekaligus secara real-time (seperti Google Docs)?**
- Belum. Sinkronnya bersifat "kirim/ambil" (last-write-wins), bukan real-time bersamaan. Kalau dua orang menyimpan pada saat yang nyaris sama tanpa saling menunggu, yang terkirim belakangan akan menimpa yang sebelumnya. Untuk kolaborasi banyak guru secara real-time, aplikasi perlu database bersama seperti Firebase — bisa dikembangkan lebih lanjut jika dibutuhkan.

---

## Pemakaian Harian (ringkas)

1. Buka aplikasi → pilih **kelas** dan **tanggal** di bagian atas.
2. Menu **Absensi** → tandai status tiap siswa → **Simpan absensi**.
3. Menu **Keaktifan** → isi poin menjawab/bertanya → **Simpan poin hari ini**.
4. Menu **Nilai** → pilih **Jenis** (Tugas/UH/Ulangan Lisan*/UTS/UAS/Praktikum), lalu klik salah satu chip penilaian yang sudah ada atau **"+ Tambah baru"** untuk membuat penilaian baru (mis. otomatis tersarankan "Tugas 3"). Isi nilai tiap siswa → **Simpan nilai**. Ulangi untuk Tugas 1, Tugas 2, Ulangan Harian 1, dst — semuanya akan dirata-rata otomatis. Klik **"Rincian"** pada tabel Rekap untuk melihat seluruh komponen nilai seorang siswa sekaligus nilai akhirnya (nilai rapor). *Ulangan Lisan bersifat opsional, aktifkan dulu di menu Pengaturan.
5. Menu **Jurnal Praktikum** → catat kegiatan lab hari itu.
6. Menu **Rekap & Laporan** → pilih rentang tanggal → unduh Excel/Word/PDF.
7. Sesekali klik **⬆ Kirim ke Spreadsheet** (pojok kanan atas) setelah selesai mengisi, terutama sebelum berpindah ke perangkat lain. Kalau baru membuka aplikasi di perangkat lain, aplikasi otomatis **⬇ mengambil** data terbaru — tapi Anda juga bisa menekannya manual kapan saja.

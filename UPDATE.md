# Tutorial: Memperbarui Aplikasi Buku Kelas ke Versi Terbaru

Panduan ini untuk Anda yang **sudah pernah** menginstal/mengonlinkan aplikasi ini sebelumnya, dan sekarang ingin memperbarui ke versi terbaru (mis. yang sudah ada fitur multi-Tugas/Ulangan, tema ungu, atau sinkron dua arah).

File yang mungkin berubah di setiap update:
| File | Kapan perlu diupdate |
|---|---|
| `index.html`, `style.css`, `app.js` | **Selalu**, setiap kali ada versi baru |
| `google-apps-script.gs` | **Hanya kalau** Anda memakai fitur sinkron ke Google Spreadsheet, dan file ini ikut berubah |

---

## Langkah 0 — Amankan data Anda dulu (WAJIB, jangan dilewati)

Sebelum mengganti file apa pun, pastikan data yang sudah Anda input tidak hilang:

1. Buka aplikasi versi lama Anda seperti biasa.
2. Masuk ke menu **Pengaturan**.
3. Kalau sudah terhubung ke Google Spreadsheet: klik **"⬆ Kirim ke Spreadsheet"** (atau "Sinkron ke Spreadsheet" di versi lama) dan pastikan berhasil (✓).
4. Sebagai jaring pengaman tambahan, klik juga **"Unduh cadangan JSON"** di panel "Data lokal" — simpan filenya di tempat aman (mis. folder Downloads atau email ke diri sendiri).

> Update file aplikasi (HTML/CSS/JS) **tidak akan menghapus** data yang tersimpan di peramban (localStorage) maupun di Spreadsheet — tapi selalu lebih aman mencadangkan dulu sebelum mengubah apa pun.

---

## Langkah 1 — Update file aplikasi (`index.html`, `style.css`, `app.js`)

Pilih cara sesuai bagaimana Anda mengonlinkan aplikasi sebelumnya.

### Cara A — Kalau pakai GitHub Pages

1. Ekstrak (unzip) paket aplikasi baru ini di komputer Anda — akan ada folder `absensi-ipa` berisi `index.html`, `style.css`, `app.js`, `google-apps-script.gs`, `TUTORIAL.md`.
2. Buka repository GitHub Anda yang lama di [github.com](https://github.com) (login dulu kalau perlu).
3. Klik masuk ke repository tempat aplikasi lama Anda berada.
4. Untuk **setiap file** `index.html`, `style.css`, `app.js`:
   - Klik nama file tersebut di daftar file repository.
   - Klik ikon pensil ✏️ **"Edit this file"** (kanan atas).
   - Hapus semua isi yang ada (**Ctrl+A** lalu **Delete**).
   - Buka file yang sama dari paket baru (pakai Notepad/TextEdit/VS Code), **copy semua isinya**, lalu **paste** ke editor GitHub.
   - Scroll ke bawah, klik tombol hijau **"Commit changes..."** → **"Commit changes"** lagi di kotak konfirmasi.
5. Ulangi langkah 4 untuk ketiga file tersebut satu per satu.
6. Tunggu 1–2 menit, lalu buka lagi link aplikasi Anda (`https://namaanda.github.io/nama-repo/`).
7. **Penting:** lakukan **hard refresh** supaya peramban tidak menampilkan file lama dari cache:
   - Windows/Linux: tekan **Ctrl+Shift+R**
   - Mac: tekan **Cmd+Shift+R**
   - HP: buka menu peramban → "Hapus cache" atau buka di jendela penyamaran/incognito untuk memastikan.

> **Tips lebih cepat (opsional, untuk yang terbiasa):** kalau Anda familiar dengan Git, cukup timpa ketiga file lama dengan file baru di folder repository lokal Anda, lalu `git add . && git commit -m "update aplikasi" && git push`.

### Cara B — Kalau pakai Netlify Drop

Netlify Drop tidak mendukung edit file satu-satu — cara paling gampang adalah deploy ulang:

1. Ekstrak paket aplikasi baru, pastikan folder `absensi-ipa` berisi `index.html`, `style.css`, `app.js`.
2. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
3. **Drag & drop** folder `absensi-ipa` (folder-nya, bukan file zip) ke area yang tersedia.
4. Netlify akan membuat link baru **atau** memperbarui site yang sama kalau Anda login dan drag ke site yang sudah ada sebelumnya (lihat dashboard Netlify → pilih site lama → tab **Deploys** → drag folder baru ke sana).
5. Setelah selesai, buka link aplikasi Anda dan lakukan hard refresh (**Ctrl+Shift+R** / **Cmd+Shift+R**) untuk memastikan versi terbaru yang tampil.

> Kalau Anda deploy ulang dan mendapat **link baru** (bukan situs lama yang di-update), data yang tersimpan di peramban tetap aman karena localStorage terikat ke domain — tapi kalau link berubah, localStorage lama di domain lama tidak ikut pindah. Gunakan cadangan JSON dari Langkah 0 untuk memulihkannya di link baru (menu Pengaturan → Pulihkan dari cadangan), atau — kalau sudah terhubung ke Google Spreadsheet — tinggal tempel URL Web App yang sama dan klik **"⬇ Ambil data terbaru"**.

### Cara C — Kalau dibuka langsung dari file lokal (tanpa online)

1. Ekstrak paket aplikasi baru ke folder di komputer/HP Anda.
2. Cukup **timpa (replace)** file lama dengan yang baru: `index.html`, `style.css`, `app.js` — kalau ditanya "ganti file yang sudah ada?", pilih **Ya/Replace**.
3. Tutup tab peramban yang sedang membuka aplikasi lama (kalau masih terbuka), lalu buka kembali file `index.html` yang baru.
4. Lakukan hard refresh untuk memastikan tidak ada file lama yang ter-cache.

---

## Langkah 2 — Update backend Google Apps Script (khusus jika Anda memakai sinkron Spreadsheet)

Lewati langkah ini kalau Anda **tidak** memakai fitur sinkron ke Google Spreadsheet. Kalau memakai, dan file `google-apps-script.gs` di paket baru ini berubah, ikuti langkah berikut:

1. Buka Google Spreadsheet yang selama ini Anda pakai untuk backup/sinkron.
2. Klik menu **Extensions → Apps Script**.
3. Di editor yang terbuka, **hapus semua kode lama** (Ctrl+A lalu Delete).
4. Buka file `google-apps-script.gs` dari paket baru, **copy semua isinya**, lalu **paste** ke editor Apps Script.
5. Klik ikon 💾 **Save project**.
6. Klik tombol biru **Deploy** (kanan atas) → **Manage deployments**.
7. Klik ikon **pensil (Edit)** ✏️ pada deployment yang aktif (yang statusnya "Active").
8. Pada bagian **Version**, ubah dari "..." menjadi **"New version"**.
9. Klik **Deploy**.

> ⚠️ **Ini bagian yang paling sering terlewat:** hanya menyimpan kode (langkah 5) **tidak cukup** — Web App yang sudah dideploy tetap memakai kode versi lama sampai Anda membuat **New version** lewat Manage deployments (langkah 6–9). URL Web App Anda **tidak berubah**, jadi tidak perlu mengganti apa pun di aplikasi.

### Verifikasi backend sudah versi baru

Buka URL Web App Anda di tab baru dengan tambahan `?action=pull`, contoh:
```
https://script.google.com/macros/s/AKfycb..................../exec?action=pull
```
Kalau berhasil, akan muncul teks JSON berisi data kelas/siswa Anda (bukan pesan error). Kalau muncul error atau halaman kosong, ulangi langkah 6–9 di atas.

---

## Langkah 3 — Cek aplikasi setelah update

1. Buka aplikasi Anda (link online atau file lokal), lakukan hard refresh sekali lagi untuk berjaga-jaga.
2. Pastikan data lama (kelas, siswa, absensi, nilai) **masih muncul seperti biasa**.
3. Cek fitur baru:
   - Menu **Nilai** → coba klik chip **"+ Tambah baru"**, harus muncul saran nama otomatis (mis. "Tugas 1").
   - Menu **Pengaturan** → cek toggle **"Aktifkan Ulangan Lisan"** dan kolom bobot nilai muncul dengan benar.
   - Kalau memakai sinkron: coba klik **"⬆ Kirim ke Spreadsheet"**, lalu **"⬇ Ambil data terbaru"** — keduanya harus berhasil (muncul notifikasi hijau/toast di bawah layar, bukan pesan gagal).
4. Kalau semua terlihat normal, update selesai — tidak perlu melakukan apa pun lagi.

---

## Troubleshooting Update

**Tampilan masih terlihat seperti versi lama (warna hijau, bukan ungu)**
- Peramban masih menyimpan file lama di cache. Lakukan hard refresh (**Ctrl+Shift+R** / **Cmd+Shift+R**), atau coba buka di jendela penyamaran/incognito untuk memastikan.
- Kalau pakai GitHub Pages, tunggu 1–2 menit setelah commit — GitHub Pages butuh sedikit waktu untuk mempublikasikan ulang.

**Setelah update, data kelas/siswa saya hilang**
- Kemungkinan besar Anda membuka **link/domain yang berbeda** dari sebelumnya (misalnya Netlify membuatkan link acak baru). Data localStorage terikat per-domain, jadi tidak ikut pindah otomatis.
- Solusi: menu Pengaturan → **Pulihkan dari cadangan** (pakai file JSON dari Langkah 0), atau kalau sudah pernah terhubung ke Spreadsheet, tempel kembali URL Web App yang sama lalu klik **"⬇ Ambil data terbaru"**.

**Fitur sinkron (Kirim/Ambil) tiba-tiba gagal setelah update**
- Pastikan sudah melakukan Langkah 2 (redeploy **New version**) kalau file `.gs` ikut berubah di versi ini.
- Buka `URL-Anda?action=pull` langsung di tab browser — kalau muncul error, deploy backend belum berhasil diperbarui.

**Saya tidak yakin file `.gs` di versi ini berubah atau tidak**
- Aman-aman saja untuk selalu mengulang Langkah 2 setiap update, meskipun ternyata tidak ada perubahan pada file itu — tidak akan merusak data yang sudah ada di Spreadsheet.

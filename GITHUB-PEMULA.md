# Tutorial Lengkap untuk Pemula: Mengonlinkan Aplikasi Buku Kelas Lewat GitHub Pages

Panduan ini ditulis untuk yang **belum pernah sama sekali** memakai GitHub. Ikuti dari atas ke bawah, jangan ada yang dilewati. Total waktu: sekitar 15–20 menit.

**Yang Anda butuhkan:**
- Alamat email aktif (untuk daftar akun GitHub)
- File aplikasi ini sudah diekstrak (unzip) di komputer/laptop Anda — pastikan Anda tahu di folder mana hasil ekstraknya (mis. folder `Downloads/absensi-ipa`)

---

## Bagian 1 — Membuat Akun GitHub

Lewati bagian ini kalau Anda sudah punya akun GitHub — langsung ke **Bagian 2**.

1. Buka [github.com](https://github.com) di peramban (Chrome/Firefox/Edge) pada **laptop/komputer** (bukan HP, supaya lebih mudah).
2. Klik tombol **"Sign up"** di pojok kanan atas.
3. Isi formulir:
   - **Email address** — pakai email aktif Anda.
   - **Password** — buat kata sandi yang kuat, catat di tempat aman.
   - **Username** — nama akun Anda di GitHub (contoh: `budi-guru-ipa`). Ini akan muncul di link aplikasi Anda nanti, jadi pilih yang singkat dan mudah diingat.
4. Selesaikan verifikasi (biasanya berupa teka-teki puzzle sederhana) dan klik **"Create account"**.
5. GitHub akan mengirim **kode verifikasi** ke email Anda. Buka email tersebut, salin kodenya, dan tempelkan di halaman GitHub.
6. Setelah akun aktif, GitHub mungkin menanyakan beberapa pertanyaan (tim, pengalaman, dll) — boleh dilewati/pilih apa saja, klik **"Continue"** atau **"Skip personalization"** sampai masuk ke halaman utama (dashboard) GitHub.

Anda sekarang punya akun GitHub. ✅

---

## Bagian 2 — Membuat Repository (Tempat Menyimpan File Aplikasi)

"Repository" adalah semacam folder proyek di GitHub tempat file aplikasi Anda akan disimpan.

1. Di halaman utama GitHub, klik ikon **"+"** di pojok kanan atas → pilih **"New repository"**.
2. Isi formulir pembuatan repository:
   - **Repository name**: ketik nama singkat, contoh `buku-kelas-ipa` (tanpa spasi, boleh pakai tanda `-`).
   - **Description**: boleh dikosongkan, atau isi "Aplikasi absensi & nilai kelas IPA".
   - Pilih **"Public"** (harus Public agar GitHub Pages bisa dipakai gratis).
   - **JANGAN** centang "Add a README file" — biarkan kosong (supaya repository benar-benar kosong dulu).
3. Klik tombol hijau **"Create repository"**.

Anda akan diarahkan ke halaman repository yang masih kosong, dengan petunjuk teknis (uploading an existing file, dst) — abaikan itu, ikuti langkah berikutnya di panduan ini.

---

## Bagian 3 — Mengunggah File Aplikasi

Ini bagian paling penting: **file harus diunggah langsung ke posisi utama repository, bukan di dalam folder tambahan.**

1. Di halaman repository yang masih kosong tadi, cari dan klik link **"uploading an existing file"** (biasanya berwarna biru, ada di tengah halaman). Kalau tidak terlihat, klik tombol **"Add file"** (dekat kanan atas daftar file) → **"Upload files"**.
2. Sekarang buka **File Explorer** (Windows) atau **Finder** (Mac) di jendela terpisah, masuk ke folder hasil ekstrak zip aplikasi ini — akan ada subfolder bernama `absensi-ipa`. **Buka folder itu** sampai Anda melihat isinya langsung: `index.html`, `style.css`, `app.js`, `google-apps-script.gs`, `TUTORIAL.md`, `UPDATE.md`.
3. **Blok/select semua file tersebut** (klik `index.html`, lalu tahan **Shift** dan klik file terakhir untuk memilih semuanya — atau tekan **Ctrl+A** / **Cmd+A** di dalam folder itu).
4. **Drag (seret)** semua file yang terpilih tadi ke area kotak putus-putus di halaman GitHub yang bertuliskan "Drag files here to add them to your repository".

   > ⚠️ **Penting:** seret file-nya satu-satu terpilih (langkah 3), **JANGAN** menyeret folder `absensi-ipa` itu sendiri. Kalau yang diseret foldernya, nanti file akan berada di dalam subfolder `absensi-ipa/` di GitHub, dan GitHub Pages tidak akan bisa menemukan `index.html` di posisi utama.

5. Tunggu sampai semua file selesai ter-upload (akan muncul daftarnya dengan tanda centang hijau).
6. Scroll ke bawah, di bagian **"Commit changes"**, biarkan pesan defaultnya, lalu klik tombol hijau **"Commit changes"**.
7. Anda akan kembali ke halaman repository — sekarang seharusnya terlihat daftar file: `index.html`, `style.css`, `app.js`, dst, **langsung di halaman utama** (bukan di dalam folder).

---

## Bagian 4 — Mengaktifkan GitHub Pages

Ini langkah yang membuat aplikasi Anda bisa diakses lewat link internet.

1. Di halaman repository Anda, klik tab **"Settings"** (ada ikon gerigi ⚙️, biasanya di deretan tab paling kanan: Code, Issues, Pull requests, ..., **Settings**).
2. Di menu sebelah kiri, scroll ke bawah dan klik **"Pages"** (di bawah grup "Code and automation").
3. Di bagian **"Build and deployment"** → **"Source"**, pastikan terpilih **"Deploy from a branch"**.
4. Di bagian **"Branch"**, klik dropdown yang bertuliskan "None", pilih **`main`** (atau `master`, tergantung nama branch default Anda), lalu di sebelahnya pastikan folder terpilih **`/ (root)`**.
5. Klik tombol **"Save"**.
6. Tunggu **1–3 menit**. Refresh halaman Settings → Pages ini beberapa kali sampai muncul kotak hijau bertuliskan:
   > "Your site is live at `https://username-anda.github.io/nama-repo/`"
7. **Klik link tersebut** (atau salin dan buka di tab baru) — aplikasi Buku Kelas Anda seharusnya sudah terbuka dan bisa dipakai!

---

## Bagian 5 — Menyimpan Link & Membuka di HP

1. **Salin link** aplikasi Anda (contoh: `https://budi-guru-ipa.github.io/buku-kelas-ipa/`).
2. Simpan link ini di tempat yang mudah diingat — kirim ke WhatsApp diri sendiri, catat di notes HP, atau simpan sebagai **Bookmark** di peramban laptop.
3. Buka link yang sama di HP (lewat WhatsApp/email yang Anda kirim tadi, ketuk linknya) — aplikasi akan terbuka di peramban HP.
4. **(Opsional, disarankan)** Tambahkan ke Layar Utama HP supaya terasa seperti aplikasi biasa:
   - **Android (Chrome)**: buka link → titik tiga (⋮) di pojok kanan atas → **"Tambahkan ke Layar Utama"**.
   - **iPhone (Safari)**: buka link → ikon **Share/Bagikan** (kotak dengan panah ke atas) → **"Tambah ke Layar Utama"**.

---

## Bagian 6 — Langkah Selanjutnya (Opsional)

Aplikasi Anda sekarang sudah online dan bisa dibuka dari perangkat mana pun lewat link tadi. Beberapa hal lanjutan yang bisa Anda lakukan:

- **Menghubungkan ke Google Spreadsheet** supaya data bisa disinkronkan antar perangkat (laptop ↔ HP) — lihat **`TUTORIAL.md`** Bagian 2 di paket ini.
- **Memperbarui aplikasi** kalau suatu saat ada versi baru — lihat **`UPDATE.md`** di paket ini, bagian "Cara A — Kalau pakai GitHub Pages" (Anda sudah tahu polanya dari Bagian 3 panduan ini: edit/timpa file lewat tab file di repository, lalu Commit).

---

## Troubleshooting untuk Pemula

**Halaman muncul tulisan "404 — File not found" atau halaman putih kosong**
- Kemungkinan besar file `index.html` tidak berada langsung di posisi utama repository, melainkan di dalam subfolder `absensi-ipa/`. Cek halaman utama repository Anda (tab **"Code"**) — kalau ada folder bernama `absensi-ipa` di sana, berarti file terunggah salah tempat.
  - **Perbaikan:** klik folder `absensi-ipa` tersebut, klik masing-masing file di dalamnya, klik ikon pensil ✏️ untuk edit — atau lebih mudah, hapus folder itu (klik file, klik ikon tempat sampah 🗑, commit), lalu ulangi **Bagian 3** dengan menyeret file-nya langsung (bukan foldernya).

**Sudah menunggu lama tapi Settings → Pages belum menunjukkan "Your site is live"**
- Refresh halaman (F5) beberapa kali, GitHub Pages kadang butuh 2–5 menit di percobaan pertama.
- Pastikan repository-nya **Public**, bukan Private (cek di Settings → General → scroll ke bawah, bagian "Danger Zone" biasanya menunjukkan status ini; atau lihat label di sebelah nama repository di halaman utama).

**Lupa link aplikasi setelah beberapa hari**
- Buka [github.com](https://github.com), login, klik nama repository Anda → **Settings → Pages** — link akan ditampilkan lagi di sana.

**Salah ketik nama repository / ingin ganti nama**
- Buka repository → **Settings** (tab paling atas, bukan sub-menu Pages) → di bagian paling atas ada kolom **"Repository name"** → ubah lalu klik **"Rename"**. Link aplikasi otomatis ikut berubah mengikuti nama baru.

**Ingin menghapus repository dan mulai ulang dari awal**
- Buka repository → **Settings** → scroll paling bawah ke **"Danger Zone"** → **"Delete this repository"** → ikuti konfirmasi (perlu ketik ulang nama repository). Setelah itu ulangi dari **Bagian 2** panduan ini.

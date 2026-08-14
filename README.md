# Prasa Workflow (static)

Tool pribadi: Klien → Proyek → Workflow.
Frontend statis di GitHub Pages + backend Google Apps Script + database Google Sheets.
Tanpa server, tanpa login (cukup kamu yang tahu URL + secret).

## 1. Buat Spreadsheet
- Buka https://sheets.google.com → Buat spreadsheet baru.
- Namanya bebas (mis. `prasa-workflow-db`). Biarkan kosong.

## 2. Pasang Apps Script (backend)
- Di spreadsheet: Extensions → Apps Script.
- Hapus isi editor, lalu tempel isi `appsscript.js`.
- Ubah `SECRET` (baris paling atas) jadi teks acak milikmu, mis. `prasa-rahasia-123`.
- Save (Ctrl+S).

## 3. Deploy Web App
- Klik Deploy → New deployment.
- Pilih type: Web app.
- Execute as: **Me**.
- Who has access: **Anyone** (wajib, supaya bisa dipanggil dari GitHub Pages).
  Keamanan digantikan oleh `SECRET` — jangan sebarkan URL+secret ke orang lain.
- Klik Deploy, authorize saat diminta.
- Salin **URL Web App** (bentuk `https://script.google.com/macros/s/.../exec`).

## 4. Setel frontend
- Buka `app.js`:
  - `API_URL = '...'` ← tempel URL Web App tadi.
  - `SECRET  = '...'` ← sama persis dengan SECRET di appsscript.js.

## 5. Upload ke GitHub
- Buat repo baru: `prasastoy-workflow`.
- Upload file: `index.html`, `app.js`, `style.css`, `.nojekyll` (semua di root repo).
- Catatan: `appsscript.js` TIDAK diupload ke repo — itu hanya untuk Apps Script editor.

## 6. Aktifkan GitHub Pages
- Repo → Settings → Pages.
- Source: branch `main` (atau `master`), folder `/ (root)`.
- Save. Tunggu ~1 menit.
- Buka: `https://<username-github>.github.io/prasastoy-workflow/`

## Cara pakai
- Tab Klien: tambah klien dulu.
- Tab Proyek: pilih klien, lalu isi proyek.
- Tab Workflow: pilih proyek, lalu isi tahapan.
- Edit/Hapus lewat tombol di tiap baris.
- Data tersimpan otomatis di sheet `clients`, `projects`, `workflows`.

## Jika gagal (blank / error)
- Buka DevTools (F12) → Console untuk lihat pesan.
- Pastikan `API_URL` dan `SECRET` sudah benar dan cocok dengan appsscript.js.
- Pastikan Apps Script sudah di-deploy ulang (New deployment) setiap kali mengubah kode/script.

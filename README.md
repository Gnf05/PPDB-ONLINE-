# PPDB Admin Panel - Ringkas

Ringkasan: saya sudah menyederhanakan proyek menjadi beberapa file inti yang saling terhubung (client-side only, mock data menggunakan localStorage).

File inti:
- `login.html` - halaman autentikasi (mock)
- `index.html` - dashboard utama
- `users.html` - CRUD users (localStorage)
- `reports.html` - laporan + filter + print
- `settings.html` - pengaturan dasar
- `assets/styles.css` - gaya tambahan
- `assets/app.js` - semua logic client-side (auth, sidebar, CRUD, reports)

Cara menjalankan (direkomendasikan):
1. Pasang ekstensi Live Server di VS Code (atau buka file HTML langsung di browser).

Via UI: buka VS Code -> Extensions -> cari "Live Server" -> Install.
Via CLI (opsional):
```bash
code --install-extension ritwickdey.LiveServer
code --install-extension esbenp.prettier-vscode
```

2. Di VS Code buka folder proyek ini, lalu buka `index.html` atau `login.html`, klik kanan -> "Open with Live Server".
3. Jika tidak menggunakan Live Server, cukup buka `login.html` di browser (double-click) lalu login untuk mengakses halaman.

Catatan:
- Data users disimpan di `localStorage` (key: `ppdb_users`). Login mock disimpan di `ppdb_logged_in`.
- Jika ingin menyimpan versi lama file, cek folder `legacy/` (jika dibuat).

Butuh penyesuaian desain lebih lanjut atau export CSV/PDF? Beri tahu saya opsi yang Anda inginkan.

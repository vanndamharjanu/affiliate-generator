# Shopee Affiliate Problem-to-Content Generator (PAS AI)

Aplikasi web statis (100% berjalan di browser, **tanpa database** & **siap di-host gratis di GitHub Pages**) untuk menganalisis **Niche & Masalah Pembeli (Pain Points)** dari produk Shopee Affiliate menggunakan **Google AI Studio (Gemini API)**, lalu membuatkan konten siap posting untuk **Threads, TikTok, Facebook, dan WhatsApp**.

## Fitur Utama
1. **Tanpa Database (Serverless):**
   - **API Key Gemini** disimpan secara lokal di `localStorage` browser perangkat Anda (tidak pernah tertulis di kode GitHub, sehingga aman walaupun repository GitHub Pages bersifat publik).
   - **Riwayat Analisis & Konten** otomatis tersimpan di `localStorage` browser.
2. **3 Cara Input Produk Shopee:**
   - **Ekstrak Otomatis dari Link Shopee:** Membaca nama produk langsung dari link produk Shopee atau mencoba mendeteksi redirect link pendek (`s.shopee.co.id`).
   - **Paste Screenshot (`Ctrl+V`):** Cukup *screenshot* halaman produk atau ulasan pembeli di Shopee, lalu tekan `Ctrl+V` di halaman aplikasi—AI Gemini akan membaca teks dan keluhan pembeli dari gambar tersebut.
   - **Ketik Singkat Nama/Fungsi Produk.**
3. **Alur 2 Tahap (Problem $\rightarrow$ Content):**
   - **Tahap 1:** Menganalisis Niche Pasar, Target Pembeli, Pemicu Checkout, dan **4 Masalah Utama Pembeli (Pain Points)**.
   - **Tahap 2:** Pilih masalah yang paling *relatable* dan gaya bahasa, lalu buat konten **Threads** (Utas utama + Balasan link), **TikTok** (Hook 3 detik + Script + Caption), **Facebook** (Storytelling + Komentar pertama berisi link), dan **WhatsApp** (Status & Broadcast).

---

## Cara Pakai di Komputer Lokal
Cukup klik 2x file `index.html` untuk membukanya di browser (Chrome / Edge / Safari / Firefox), lalu masukkan API Key dari [Google AI Studio](https://aistudio.google.com/app/apikey).

## Panduan Lengkap: Buat Repository, Upload File & Aktifkan GitHub Pages (Tanpa Terminal)

Lokasi file proyek Anda di komputer saat ini:
`C:\Users\DAC\.gemini\antigravity\scratch\shopee-affiliate-content`

### Tahap 1: Buat Repository Baru di GitHub
1. Buka [https://github.com](https://github.com) dan login ke akun Anda.
2. Klik tombol **`+`** di pojok kanan atas halaman, lalu pilih **New repository**.
3. Isi bagian berikut:
   - **Repository name:** Ketik nama singkat tanpa spasi, misalnya `affiliate-generator` atau `konten-pas`.
   - **Public / Private:** Pilih **Public** (agar fitur GitHub Pages bisa digunakan secara **Gratis**). *Tenang, API Key Anda tetap aman karena tidak disimpan di kode GitHub, melainkan di browser masing-masing.*
   - **Add a README file:** Boleh dicentang atau dikosongkan.
4. Klik tombol hijau **Create repository** di bagian bawah.

### Tahap 2: Unggah (Upload) File dari Komputer ke GitHub
1. Setelah halaman repository terbuka, klik link bertuliskan **"uploading an existing file"** (atau jika Anda mencentang README tadi, klik tombol **Add file** $\rightarrow$ **Upload files** di kanan atas).
2. Buka File Explorer di komputer Anda dan masuk ke folder:
   `C:\Users\DAC\.gemini\antigravity\scratch\shopee-affiliate-content`
3. Blok / pilih semua file di dalamnya (`index.html`, `style.css`, `app.js`, dan `README.md`), lalu **tarik (*drag & drop*)** ke kotak upload di halaman GitHub.
4. Tunggu beberapa detik sampai ke-4 file muncul di daftar.
5. Scroll ke bawah, lalu klik tombol hijau **Commit changes**.

### Tahap 3: Aktifkan GitHub Pages (Supaya Jadi Link Web)
1. Di halaman repository GitHub Anda, klik tab **Settings** (ikon gerigi di deretan menu atas).
2. Di menu sebelah kiri, klik **Pages** (di bagian *Code and automation*).
3. Pada bagian **Build and deployment** $\rightarrow$ **Branch**:
   - Ubah dropdown dari **None** menjadi **main** (atau **master**).
   - Biarkan folder di sebelahnya tetap **`/ (root)`**.
   - Klik tombol **Save**.
4. Tunggu sekitar **1–2 menit**, lalu **Refresh (F5)** halaman tersebut.
5. Di bagian atas akan muncul kotak pesan:
   > **Your site is live at `https://username-anda.github.io/affiliate-generator/`**
6. Klik link tersebut! Sekarang aplikasinya sudah bisa Anda buka dari HP maupun laptop kapan saja.


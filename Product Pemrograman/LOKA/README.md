# LOKA — One Place, Every Order

Prototype dashboard untuk membantu UMKM memantau pesanan dari berbagai kanal penjualan.

## Struktur file

- `index.html` — entry point dashboard LOKA.
- `admin.html` — entry point dashboard admin.
- `styles.css` — seluruh styling aplikasi.
- `admin.js` — logika dashboard admin: pesanan, produk, analitik, dan notifikasi.
- `config.js` — tempat konfigurasi Supabase (URL dan anon key).
- `customer.js` — scaffold untuk pengembangan halaman pelanggan.
- `supabase-schema.sql` — starter schema PostgreSQL untuk Supabase.
- `README.md` — dokumentasi proyek.

## Menjalankan secara lokal

1. Ekstrak folder proyek.
2. Buka folder di VS Code.
3. Jalankan `index.html` menggunakan Live Server, atau unggah file ke GitHub Pages.
4. Dashboard demo menggunakan `localStorage` browser.

## Catatan penting

- Data pesanan dan produk pada versi ini masih data demo/localStorage.
- `config.js` belum berisi kredensial Supabase.
- `customer.js` disiapkan sebagai scaffold karena file sumber yang diberikan berisi dashboard pengelola, belum menyediakan alur pelanggan.
- `supabase-schema.sql` adalah fondasi database dan belum dihubungkan ke frontend.
- Jangan pernah menaruh Supabase `service_role` key di kode frontend.
- Sebelum produksi, siapkan autentikasi, Row Level Security (RLS), validasi server-side, dan kebijakan akses data.

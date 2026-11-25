# BOOKITA — Customer Booking + Admin Dashboard

BOOKITA v2 adalah prototype web app salon dengan dua sisi:
- `index.html`: website pelanggan untuk melihat layanan, memilih stylist, tanggal dan slot, membuat reservasi, serta mengecek booking.
- `admin.html`: dashboard admin untuk melihat appointment, mengubah status, melihat kalender, pelanggan, dan export CSV.

## 1. Coba dulu tanpa Supabase (Demo mode)
1. Buka `index.html` untuk mencoba customer booking.
2. Buka `admin.html` untuk mencoba dashboard. Dalam demo mode, isi email dan password apa saja.
3. Data demo tersimpan di localStorage browser yang sama. Customer dan admin demo harus dibuka pada browser/perangkat yang sama agar data demo terlihat bersama.

Demo mode bukan database online dan bukan untuk operasional sungguhan.

## 2. Siapkan Supabase
1. Buat project di https://supabase.com/dashboard.
2. Buka SQL Editor → New query.
3. Salin seluruh isi `supabase-schema.sql`, lalu Run.
4. Buka Project Settings → API. Salin Project URL dan `anon` / publishable key.
5. Buka `config.js`, isi `supabaseUrl` dan `supabaseAnonKey`. Jangan pernah menggunakan `service_role` key di website.
6. Di Supabase Authentication → Users, buat user admin (email + password).
7. Salin UUID user tersebut.
8. Kembali ke SQL Editor, jalankan:
   `insert into public.admin_users(user_id) values ('UUID-USER-ADMIN');`
9. Edit data layanan dan stylist melalui Supabase Table Editor sesuai salon.

## 3. Upload ke GitHub Pages
1. Buat repository GitHub bernama `bookita-salon-booking`.
2. Upload seluruh isi folder ini ke root repository: `index.html`, `admin.html`, `styles.css`, `customer.js`, `admin.js`, `config.js`, `supabase-schema.sql`, `README.md`.
3. Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.
4. Setelah deploy, customer page: `https://USERNAME.github.io/bookita-salon-booking/`
5. Admin page: `https://USERNAME.github.io/bookita-salon-booking/admin.html`

## 4. Cara kerja anti-double booking
- Website meminta slot dari RPC `get_available_slots`.
- Saat pelanggan mengirim form, RPC `create_booking` membuat reservasi.
- Database memiliki exclusion constraint PostgreSQL untuk menolak jadwal stylist yang overlap. Jadi dua request bersamaan tidak dapat mengambil slot yang sama.
- Status `cancelled` dan `no_show` tidak mengunci slot.

## 5. Batasan dan hal yang perlu dikembangkan
- WhatsApp reminder otomatis belum diintegrasikan; memerlukan WhatsApp Business Platform/provider dan backend aman.
- Payment gateway/DP belum diintegrasikan.
- Admin perlu dibuat lewat Supabase Auth dan didaftarkan di tabel `admin_users`.
- Fitur customer lookup hanya mengembalikan data booking yang disaring dengan kode booking + nomor telepon; jangan membagikan kode booking ke orang lain.
- Jam operasional pada SQL saat ini 09.00–18.00 WIB, slot per 30 menit, timezone Asia/Jakarta. Ubah fungsi `get_available_slots` dan validasi `create_booking` jika jam salon berbeda.
- SQL ini ditujukan untuk project Supabase baru. Jika menjalankan ulang setelah mengubah struktur, periksa constraint/policy yang sudah ada.
- Supabase anon key memang digunakan di frontend dengan RLS; jangan pernah menaruh service_role key di `config.js`.

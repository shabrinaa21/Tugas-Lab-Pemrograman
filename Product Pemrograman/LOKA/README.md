# LOKA — One Place, Every Order

LOKA adalah prototype web app untuk membantu pemilik usaha mengelola pesanan dari berbagai kanal penjualan dalam satu dashboard. Pesanan dari WhatsApp, Instagram, Shopee, TikTok Shop, dan toko offline dapat dicatat dan dipantau melalui satu tempat.

## Fitur utama

### 1. Dashboard ringkasan
- Menampilkan jumlah seluruh pesanan.
- Menampilkan pesanan yang menunggu dan sedang diproses.
- Menampilkan ringkasan pendapatan dari pesanan berstatus selesai.
- Menampilkan kontribusi setiap kanal penjualan.
- Menampilkan aktivitas dan pesanan terbaru.

### 2. Manajemen pesanan
- Melihat daftar pesanan dari seluruh kanal.
- Menambahkan pesanan secara manual.
- Mencatat nama pelanggan, nomor telepon, kanal, produk, jumlah, harga, dan alamat.
- Mencari pesanan berdasarkan ID, nama pelanggan, atau produk.
- Memfilter pesanan berdasarkan kanal dan status.
- Mengubah status pesanan: Menunggu, Diproses, Siap Dikirim, Selesai, atau Dibatalkan.

### 3. Manajemen produk dan stok
- Melihat daftar produk, SKU, kategori, harga, dan stok.
- Menambahkan produk baru.
- Mencari produk dan memfilter kondisi stok.
- Memperbarui jumlah stok.
- Menampilkan indikator stok menipis dan stok habis.

### 4. Analitik penjualan
- Melihat total pendapatan dari pesanan selesai.
- Melihat jumlah pesanan selesai dan unit terjual.
- Melihat rata-rata nilai pesanan.
- Melihat tren penjualan tujuh hari terakhir.
- Membandingkan kontribusi kanal penjualan.

### 5. Notifikasi
- Melihat notifikasi pesanan baru, pesanan selesai, dan stok menipis.
- Menandai notifikasi sebagai sudah dibaca.
- Menandai seluruh notifikasi sebagai sudah dibaca.

---

## 1. Coba dulu tanpa Supabase (Demo mode)

1. Buka `index.html` untuk menjalankan dashboard LOKA.
2. Gunakan menu di sidebar untuk berpindah antara Dashboard, Pesanan, Produk & Stok, Analitik, dan Notifikasi.
3. Klik **Tambah Pesanan** untuk memasukkan pesanan secara manual.
4. Klik **Tambah Produk** untuk menambahkan produk ke inventaris.
5. Ubah status pesanan langsung dari tabel pada halaman Pesanan.
6. Data demo dan perubahan yang dilakukan akan disimpan di `localStorage` browser.

**Catatan demo mode:**
- Demo mode tidak memerlukan akun atau proses login.
- Data hanya tersimpan pada browser dan perangkat yang digunakan.
- Data tidak otomatis tersinkronisasi ke browser, perangkat, atau pengguna lain.
- Menghapus data situs/browser dapat menghapus data prototype.
- Integrasi pesanan otomatis dari WhatsApp, Instagram, Shopee, dan TikTok Shop belum tersedia. Untuk saat ini, pesanan dari kanal tersebut dicatat secara manual.
- Demo mode bukan database online dan belum ditujukan untuk operasional bisnis sungguhan.

---

## 2. Siapkan Supabase (Tahap pengembangan backend)

Supabase dapat digunakan sebagai database online untuk menyimpan data produk, pesanan, dan notifikasi. File `supabase-schema.sql` disediakan sebagai rancangan awal struktur database.

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor** → **New query**.
3. Buka file `supabase-schema.sql` di repository ini.
4. Salin seluruh isi SQL, tempel ke SQL Editor, lalu jalankan.
5. Buka **Project Settings** → **API**.
6. Salin **Project URL** dan **anon / publishable key**.
7. Buka `config.js`, lalu isi nilai `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sesuai project milikmu.

Contoh pengisian `config.js`:

```js
window.LOKA_CONFIG = {
  SUPABASE_URL: "https://PROJECT-REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
```

**Penting:**
- Jangan pernah menaruh `service_role` key di file frontend.
- `config.js` pada versi ini masih berupa konfigurasi awal.
- Dashboard saat ini belum menjalankan operasi baca/tulis ke Supabase; aplikasi masih menggunakan `localStorage`.
- SQL yang disediakan adalah starter schema, bukan integrasi backend yang sudah selesai.
- Sebelum digunakan banyak pengguna, siapkan Supabase Auth, Row Level Security (RLS), policy akses data, validasi server-side, dan mekanisme audit.

---

## 3. Upload ke GitHub Pages

1. Buat repository GitHub baru, misalnya `loka-order-management`.
2. Ekstrak file ZIP proyek LOKA.
3. Upload seluruh isi folder proyek ke **root repository**, bukan folder pembungkus ZIP.
4. Pastikan `index.html` berada langsung di root repository.
5. Pastikan file berikut juga berada di root:
   - `admin.html`
   - `admin.js`
   - `config.js`
   - `customer.js`
   - `styles.css`
   - `supabase-schema.sql`
   - `README.md`
6. Buka **Settings** → **Pages**.
7. Pada bagian **Build and deployment**, pilih **Deploy from a branch**.
8. Pilih branch `main` dan folder `/(root)`, lalu klik **Save**.
9. Tunggu proses deployment selesai.

Jika username GitHub kamu adalah `USERNAME` dan nama repository adalah `loka-order-management`, alamat website akan menjadi:

- Dashboard LOKA: `https://USERNAME.github.io/loka-order-management/`
- Halaman admin: `https://USERNAME.github.io/loka-order-management/admin.html`

`index.html` dan `admin.html` pada prototype ini sama-sama membuka dashboard pengelola. Keduanya belum merupakan dua aplikasi dengan hak akses yang berbeda.

---

## 4. Cara kerja pengelolaan pesanan pada prototype

Alur dasar pengelolaan pesanan di LOKA:

1. Pemilik usaha menerima pesanan dari salah satu kanal penjualan.
2. Pemilik usaha memasukkan pesanan ke LOKA melalui formulir **Tambah Pesanan**.
3. Pesanan tersimpan di browser dan muncul pada daftar pesanan.
4. Pemilik usaha memperbarui status sesuai proses pemenuhan pesanan.
5. Ringkasan dashboard dan analitik diperbarui berdasarkan data pesanan.
6. Notifikasi dibuat untuk aktivitas tertentu, misalnya pesanan baru atau pesanan selesai.

### Status pesanan

| Status | Arti |
|---|---|
| Menunggu | Pesanan baru dan belum mulai diproses |
| Diproses | Pesanan sedang disiapkan |
| Siap Dikirim | Pesanan sudah siap untuk dikirim atau diserahkan |
| Selesai | Pesanan telah diselesaikan |
| Dibatalkan | Pesanan dibatalkan |

### Pengaruh status terhadap stok

Pada prototype, stok produk dikurangi ketika pesanan berpindah ke status `Diproses`, `Siap Dikirim`, atau `Selesai` dari status yang belum mengurangi stok. Jika pesanan yang sudah mengurangi stok dibatalkan, jumlah stok dikembalikan.

Perilaku ini masih berupa logika frontend dan perlu diuji serta dipindahkan ke transaksi database sebelum digunakan pada operasional nyata.

---

## 5. Struktur file proyek

```text
LOKA-Repository/
├── index.html
├── admin.html
├── admin.js
├── config.js
├── customer.js
├── styles.css
├── supabase-schema.sql
└── README.md
```

Keterangan:
- `index.html` — halaman utama dashboard LOKA.
- `admin.html` — entry point dashboard admin pada prototype.
- `admin.js` — logika dashboard, pesanan, produk, analitik, dan notifikasi.
- `config.js` — tempat konfigurasi awal Supabase.
- `customer.js` — kerangka pengembangan fitur sisi pelanggan.
- `styles.css` — styling dan tampilan aplikasi.
- `supabase-schema.sql` — rancangan awal tabel database PostgreSQL.
- `README.md` — dokumentasi proyek dan panduan penggunaan.

---

## 6. Batasan dan hal yang perlu dikembangkan

- **Integrasi marketplace belum otomatis.** Pesanan WhatsApp, Instagram, Shopee, dan TikTok Shop masih perlu dimasukkan secara manual. Integrasi resmi membutuhkan API, otorisasi platform, dan backend.
- **Supabase belum terhubung ke aplikasi.** File konfigurasi dan SQL hanya menjadi fondasi awal. Operasi aplikasi saat ini masih menggunakan `localStorage`.
- **Belum ada autentikasi admin.** Dashboard prototype dapat dibuka tanpa login. Untuk produksi, gunakan Supabase Auth dan batasi akses admin.
- **Halaman pelanggan belum dibuat.** `customer.js` disiapkan sebagai scaffold; file sumber yang menjadi dasar LOKA berisi dashboard pengelola, bukan alur checkout pelanggan.
- **Belum ada sinkronisasi lintas perangkat.** Data demo hanya tersedia di browser yang menyimpannya.
- **Belum ada notifikasi real-time.** Notifikasi yang tampil merupakan notifikasi lokal dari aktivitas prototype.
- **Belum ada integrasi pembayaran dan pengiriman.** Konfirmasi pembayaran, ongkir, resi, dan pelacakan belum terhubung ke penyedia layanan.
- **Perlu pengamanan data.** Sebelum produksi, implementasikan autentikasi, RLS, validasi input, logging, backup, dan pengujian.
- **Perlu penanganan stok bersamaan.** Pengurangan dan pengembalian stok harus dilakukan secara atomik di backend agar tidak terjadi stok negatif ketika beberapa pesanan diproses bersamaan.

LOKA saat ini adalah prototype front-end untuk demonstrasi alur pengelolaan pesanan. Penggunaan untuk operasional sungguhan memerlukan backend, integrasi kanal penjualan, serta pengamanan data.

# ELS Admin Service Dashboard

Aplikasi berbasis web menggunakan Google Apps Script untuk manajemen dan dashboard layanan admin ELS. Aplikasi ini terhubung dengan Google Spreadsheet sebagai basis data (database) untuk menyimpan data servis, stok, alokasi part, dan pengaturan aplikasi.

## Struktur Direktori dan File

- **`Code.gs`** : Berisi logika backend, routing, dan API untuk berinteraksi dengan Google Spreadsheet.
- **`Index.html`** : Halaman utama atau User Interface (UI) dashboard.
- **`JavaScript.html`** : Berisi script client-side (frontend) untuk mengatur interaksi pengguna, panggilan API ke backend, dan pemrosesan data di browser.
- **`Stylesheet.html`** : Berisi CSS untuk mengatur tampilan dan desain antarmuka dashboard.
- **`read_excel_info.py`** : Script utilitas Python untuk membaca data dari file Excel.

## Fitur Utama

- **Dashboard & Manajemen Data Servis**: Mengelola status servis, kategori file, data pelanggan, kebutuhan part, vendor, dan garansi.
- **Sistem Autentikasi**: Fitur login pengguna, serta manajemen pengguna (tambah admin, update password, hapus admin).
- **Alokasi dan Manajemen Stok**: Pencatatan stok barang berdasarkan nomor seri/produksi dan manajemen alokasi part.
- **Upload Data Massal**: Fitur import atau upload data secara massal (untuk kategori konfirmasi, order part, siap diambil) yang telah dilengkapi dengan mekanisme *locking* untuk mencegah *race condition* jika ada beberapa admin yang beroperasi bersamaan.
- **Pengaturan Dinamis**: Mengatur highlight (warna) berdasarkan kata kunci (keyword) tertentu pada data servis.
- **Manajemen Cabang**: Mendata dan menyimpan daftar cabang yang ada.

## Persiapan dan Deployment

1. Buka [Google Apps Script](https://script.google.com/) dan buat project baru atau buka project yang sudah ada.
2. Salin kode dari file `Code.gs`, `Index.html`, `JavaScript.html`, dan `Stylesheet.html` ke editor Apps Script Anda (buat file dengan nama yang sesuai).
3. (Opsional) Pada file `Code.gs`, Anda dapat mengatur `SPREADSHEET_ID` secara manual jika sudah memiliki spreadsheet yang ingin digunakan. Jika tidak, script akan secara otomatis membuat spreadsheet baru dengan nama `Database_ELS_Admin_Service` saat pertama kali dijalankan.
4. Lakukan **Deploy** dengan cara:
   - Klik tombol **Deploy** di bagian kanan atas editor Apps Script.
   - Pilih **New deployment**.
   - Pada opsi "Select type", klik ikon gerigi dan centang **Web app**.
   - Atur "Execute as" ke **Me**.
   - Atur "Who has access" ke **Anyone**.
   - Klik **Deploy** dan setujui izin (permissions) yang diminta oleh aplikasi.
5. Salin URL Web App yang dihasilkan untuk mengakses aplikasi.

## Struktur Database (Spreadsheet)

Sistem ini akan mengelola (dan membuat secara otomatis jika belum ada) beberapa sheet (tab) dalam file Spreadsheet yang ditunjuk:
1. **`Data_Service`**: Tempat penyimpanan utama data servis.
2. **`Settings`**: Pengaturan sistem seperti keyword dan warna highlight.
3. **`Stock Nomor Seri/Produksi Per Barang`**: Data Master Stok.
4. **`Alokasi Part`**: Histori alokasi part untuk servis.
5. **`Cabang`**: Daftar cabang yang terdaftar.
6. **`Users`**: Menyimpan data username dan password untuk fitur login (Autentikasi).

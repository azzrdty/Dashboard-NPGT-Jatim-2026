# GeoSpatial SHP Explorer (Web GIS Viewer & NPGT Analysis)

Aplikasi Web GIS modern untuk memuat, memvisualisasikan, memproyeksikan, dan menganalisis data geospasial seperti **Shapefile (`.shp` / `.zip`)**, **GeoJSON**, **KML**, dan **CSV**, serta dilengkapi modul analisis **Neraca Penatagunaan Tanah (NPGT) DJPA / BPN Jawa Timur**.

---

## 🚀 Fitur Utama

### 1. Dukungan Format Geospasial Lengkap
- **Shapefile Archive (`.zip`)**: Cukup seret atau pilih file `.zip` berisi `.shp`, `.dbf`, `.shx`, `.prj`.
- **Komponen Shapefile Lepas**: Pilih atau seret file `.shp` dan `.dbf` sekaligus (bisa bersama `.prj` dan `.cpg`).
- **GeoJSON / JSON (`.geojson`, `.json`)**: Standar format pertukaran data spasial web.
- **KML (`.kml`)**: Titik, garis, dan poligon dari Google Earth / QGIS.
- **CSV Koordinat (`.csv`)**: Membaca otomatis kolom lintang (*latitude / lat / y*) dan bujur (*longitude / lon / x*).

### 2. Penanganan Proyeksi Otomatis (CRS)
- Terintegrasi dengan **`proj4`**: data berproyeksi UTM Indonesia (seperti **WGS 1984 UTM Zone 49S** dan **50S**) otomatis ditransformasikan ke **WGS84 (EPSG:4326)** secara instan di peramban tanpa perlu server backend.

### 3. Peta Interaktif & Peta Dasar (Basemaps)
- **Esri Satellite**: Citra satelit resolusi tinggi.
- **Esri Hybrid**: Citra satelit dengan label jalan dan nama wilayah.
- **OpenStreetMap Standard**: Peta vektor jalan lengkap.
- **CartoDB Positron**: Tema terang minimalis.
- **CartoDB Dark Matter**: Tema gelap modern beresolusi tinggi.
- **OpenTopoMap**: Peta topografi dengan kontur dan ketinggian medan.

### 4. Manajemen Multi-Layer
- Kontrol visibilitas (tampilkan / sembunyikan).
- Pengatur palet warna, transparansi isian (*fill opacity*), dan ketebalan garis batas (*stroke width*).
- Tombol langsung untuk **Zoom to Extent** setiap layer.
- Ekspor layer aktif ke format **GeoJSON**.

### 5. Klasifikasi Tematik (Choropleth)
- Pewarnaan otomatis berdasarkan kolom atribut pilihan (misal: `NAMOBJ`, `KSPOLA`, `REMARK`, dll.).
- Pilihan skema palet warna (Vibrant, Pastel, Viridis, Plasma, Warm, Earth).
- Legenda interaktif dinamis di sudut peta.

### 6. Tabel Atribut & Pencarian Data
- Menampilkan seluruh atribut fitur dalam bentuk data grid yang responsif.
- Pencarian teks instan lintas semua kolom.
- Pengurutan (*sorting*) kolom naik (*Ascending*) dan turun (*Descending*).
- Klik baris tabel untuk otomatis memusatkan dan menyorot fitur pada peta.
- Ekspor tabel ke file **CSV** dengan sekali klik.

### 7. Inspektur Fitur & Perhitungan Geometris
- Klik poligon, garis, atau titik untuk melihat detail atribut.
- Perhitungan otomatis luas area geodesik (**m²**, **Hektar**, **km²**) dan keliling/panjang garis (**meter**, **kilometer**).
- Salin atribut sebagai format JSON.

### 8. Alat Pengukuran (GIS Tools)
- **Pengukur Jarak (Distance)**: Mengukur panjang garis antar titik dalam meter / kilometer.
- **Pengukur Luas (Area)**: Menggambar poligon bebas untuk menghitung luas area dalam m² atau hektar.
- Tampilan koordinat kursor dan perkiraan zona UTM secara *real-time*.

### 9. Mode Analisis Neraca Penatagunaan Tanah (NPGT BPN)
- Modul khusus untuk analisis 8 indikator pertanahan DJPA:
  1. `KSPOLA`: Kesesuaian Penggunaan Tanah terhadap RTRW
  2. `COMPATB`: Kompatibilitas Fisik Tanah
  3. `OPTNH`: Keoptimalan Tanah
  4. `Vname`: Ketersediaan Tanah
  5. `V_Arahan`: Arahan Ketersediaan
  6. `V_Khusus`: Arahan Khusus
  7. `REKOMTNH`: Rekomendasi Tanah
  8. `PASET`: Potensi Penataan Aset
- Dilengkapi filter per Desa/Kelurahan (`WADMKD`), ringkasan KPI persentase, dan konversi satuan hektar vs jumlah poligon.

---

## 🛠️ Cara Menjalankan Aplikasi

1. Buka terminal di folder project:
   ```bash
   cd "Web-NPGTKecamatan"
   ```

2. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```

3. Buka URL yang muncul di browser Anda (biasanya `http://localhost:5173/`).

---

## 📦 Data Contoh yang Tersedia
Aplikasi sudah dilengkapi dengan preset data contoh siap uji:
- **Batas Administrasi Kec. Ujungpangkah (Kab. Gresik, Jatim)**: 13 desa, proyeksi UTM Zone 49S.
- **Sungai Poligon 25K (Jawa Timur)**: Data fitur sungai poligon.

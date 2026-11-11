*PANGNUSA*

PANGNUSA adalah website sistem peringatan dini ketersediaan pangan di Indonesia berbasis indikator Normative Consumption to Production Ratio (NCPR). Website ini menampilkan data NCPR resmi FSVA 2026 serta hasil prediksi FSVA 2027 menggunakan model FT-Transformer.

Fitur Utama
- Dashboard: Ringkasan kondisi dan peringatan dini perubahan status defisit pangan.
- Jelajahi Kabupaten: Pencarian dan penyaringan data 514 kabupaten/kota.
- Detail Kabupaten: Informasi NCPR, grafik historis, kelas, dan status prediksi wilayah.
- Tentang Sistem: Penjelasan metode, evaluasi model, sumber data, dan keterbatasan penelitian.

Teknologi
- React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, dan Lucide React.

Cara Menjalankan
- Pastikan Node.js dan npm sudah terinstal.
  npm install
  npm run dev

Buka alamat lokal yang ditampilkan pada terminal (umumnya http://localhost:5173).

Untuk membuat versi produksi:
  npm run build

Pengelolaan Data
- src/data/penelitianSnapshot.json — Data penelitian bawaan frontend.
- public/ncpr.json — File hasil ekspor pipeline Python yang digunakan jika tersedia.
- Prediksi FT-Transformer diproses secara terpisah menggunakan Python melalui metode Static (Batch) Inference.

Website mencakup 514 kabupaten/kota, dengan 402 kabupaten dalam cakupan peramalan dan 112 wilayah tidak diramal.
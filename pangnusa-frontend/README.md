*PANGNUSA*

PANGNUSA adalah website sistem peringatan dini ketersediaan pangan di Indonesia berbasis indikator Normative Consumption to Production Ratio (NCPR). Website ini menampilkan data NCPR resmi FSVA 2026 serta hasil prediksi FSVA 2027 menggunakan model FT-Transformer.

Fitur Utama
- Dashboard: Ringkasan kondisi dan peringatan dini perubahan status defisit pangan.
- Jelajahi Kabupaten: Pencarian dan penyaringan data 416 kabupaten.
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
- public/ncpr_2027.json — Satu-satunya sumber data resmi dan hasil ramalan, diekspor dari Google Colab.
- Prediksi FT-Transformer diproses secara terpisah menggunakan Python melalui metode Static (Batch) Inference.

Website mengikuti ncpr_2027.json: 416 kabupaten, 403 diramal dan 13 tidak diramal (model utama 20 fitur).
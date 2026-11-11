import {
  AlertTriangle, ArrowRight, BookOpen, CalendarDays, ChartNoAxesCombined,
  CheckCircle2, Database, FlaskConical, Info, Layers3,
  ShieldCheck, Target,
} from 'lucide-react'
import { PageHeading, SurfaceCard } from '../components/DesignUI'
import { useNcprData } from '../data/useNcprData'

const SUMBER = [
  {
    nama: 'Badan Pangan Nasional (FSVA)',
    isi: 'NCPR metode baru FSVA 2024 (dihitung ulang), FSVA 2025, dan FSVA 2026 serta indikator ketahanan pangan.',
  },
  {
    nama: 'BPS, BDSP Kementan, dan Open Data Aceh',
    isi: 'Produksi pangan kabupaten, produksi padi dan luas panen provinsi, serta data produksi padi parsial 2026.',
  },
  {
    nama: 'PIHPS Bank Indonesia',
    isi: 'Pergerakan harga beras medium tingkat provinsi.',
  },
  {
    nama: 'NASA POWER dan NOAA CPC',
    isi: 'Curah hujan, suhu, dan indeks iklim ONI (El Niño/La Niña).',
  },
]

const KETERBATASAN = [
  'Data produksi padi 2026 hanya mencakup Januari–April; penambahan data dapat mengubah ramalan.',
  'Data produksi jagung dan pisang tidak digunakan karena data kabupaten tidak memadai; data bulanan hanya untuk padi.',
  'Lima indikator FSVA yang tidak lagi diterbitkan menggunakan nilai FSVA 2024, sehingga belum menggambarkan perubahan terbaru.',
  'Status mendekati batas NCPR = 1 dapat berubah akibat perubahan kecil pada produksi.',
]

function persentase(n: unknown) {
  return typeof n === 'number' && Number.isFinite(n)
    ? `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)}%`
    : '—'
}

function desimal(n: unknown, digits = 3) {
  return typeof n === 'number' && Number.isFinite(n)
    ? new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
    : '—'
}

function rasio(n: unknown, total: unknown) {
  return typeof n === 'number' && Number.isFinite(n) &&
    typeof total === 'number' && Number.isFinite(total)
    ? `${n}/${total}`
    : '—'
}

function SectionTitle({ icon: Icon, title }: {
  icon: typeof BookOpen
  title: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E8F5F3] text-[#087F8C]">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-[#142B3B] sm:text-[19px]">{title}</h2>
      </div>
    </div>
  )
}

export default function TentangSistemPage() {
  const { data, loading, error } = useNcprData()
  const kinerja = data.meta.kinerja ?? {}
  const skenario20 = data.meta.skenario?.['20_fitur']?.kinerja ?? kinerja
  const skenario4 = data.meta.skenario?.['4_fitur']?.kinerja ?? {}
  const totalKabupaten = data.kabupaten.filter((k) => k.jenis === 'Kabupaten').length
  const totalDiramal = data.kabupaten.filter((k) => k.jenis === 'Kabupaten' && k.diramal).length
  const jumlahBelumDiramal = totalKabupaten - totalDiramal
  const bulanProduksi = data.meta.data_produksi_sampai === '2026-04'
    ? 'Januari–April 2026'
    : (data.meta.data_produksi_sampai || 'periode pengamatan')

  if (loading) return <p role="status" className="py-12 text-center text-[13px] text-[#627788]">Memuat hasil penelitian PANGNUSA...</p>
  if (error) return <p role="alert" className="rounded-xl border border-[#E5CDD0] bg-[#FFF8F8] p-5 text-[13px] text-[#A33A42]">Data PANGNUSA gagal dimuat: {error} Periksa file public/ncpr.json.</p>

  return (
    <>
      <PageHeading
        title="Tentang Sistem"
        description="Indikator NCPR, metode peramalan, kinerja model, dan sumber data penelitian."
      />



      {/* 01 Mengenal NCPR */}
      <SurfaceCard className="mb-5 p-5 sm:p-7">
        <SectionTitle icon={BookOpen} title="Mengenal NCPR" />
        <p className="max-w-4xl text-[12px] leading-6 text-[#52697B]">
          NCPR (Normative Consumption to Production Ratio) merupakan salah satu indikator ketersediaan pangan dalam Food Security and Vulnerability Atlas (FSVA). NCPR membandingkan konsumsi normatif dengan produksi pangan wilayah sendiri.
        </p>
        <p className="mt-3 max-w-4xl text-[12px] leading-6 text-[#52697B]">
        Berdasarkan metodologi FSVA, NCPR mencakup enam komoditas pangan sumber karbohidrat, yaitu padi (beras), jagung,  ubi kayu, ubi jalar, sagu, dan pisang. Perhitungannya menggunakan produksi pangan bersih yang dikonversi ke satuan setara beras untuk dibandingkan dengan kebutuhan konsumsi normatif.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#F0D7D9] bg-[#FFF8F8] p-4 sm:p-5">
            <p className="text-[11px] font-bold tracking-wider text-[#B43B43]">DEFISIT PRODUKSI LOKAL</p>
            <p className="mt-1 text-[22px] font-bold tabular-nums text-[#B43B43]">NCPR ≥ 1</p>
            <p className="mt-1 text-[12px] leading-5 text-[#7C6268]">Produksi wilayah sendiri belum memenuhi kebutuhan konsumsi normatifnya.</p>
          </div>
          <div className="rounded-xl border border-[#D3EBDB] bg-[#F4FBF7] p-4 sm:p-5">
            <p className="text-[11px] font-bold tracking-wider text-[#23865C]">SURPLUS PRODUKSI LOKAL</p>
            <p className="mt-1 text-[22px] font-bold tabular-nums text-[#23865C]">NCPR &lt; 1</p>
            <p className="mt-1 text-[12px] leading-5 text-[#587B69]">Produksi wilayah sendiri melebihi kebutuhan konsumsi normatifnya.</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#F5F8FA] px-4 py-3.5 text-[12px] leading-5 text-[#617588]">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#087F8C]" aria-hidden="true" />
          <p>Defisit NCPR <strong className="text-[#32495A]">tidak otomatis berarti kelaparan atau kerawanan pangan</strong>. Indikator ini tidak mengukur seluruh aspek akses dan ketahanan pangan.</p>
        </div>
        <div className="mt-5 border-t border-[#EDF1F3] pt-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] font-bold text-[#142B3B]"><CalendarDays size={16} className="text-[#087F8C]" aria-hidden="true" /> Periode data yang ditampilkan</p>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg bg-[#F8FAFB] p-3">
              <p className="text-[12px] font-bold text-[#142B3B]">FSVA 2024–2026</p>
              <p className="mt-1 text-[11px] leading-5 text-[#6E8191]">NCPR metode baru. FSVA 2024 dihitung ulang agar konsisten dengan 2025–2026.</p>
            </div>
            <div className="rounded-lg bg-[#F8FAFB] p-3">
              <p className="text-[12px] font-bold text-[#142B3B]">FSVA 2026</p>
              <p className="mt-1 text-[11px] leading-5 text-[#6E8191]">Edisi resmi yang menggambarkan kondisi produksi 2025.</p>
            </div>
            <div className="rounded-lg border border-[#E5DEF6] bg-[#FBF9FF] p-3">
              <p className="text-[12px] font-bold text-[#7464C0]">FSVA 2027 · Ramalan</p>
              <p className="mt-1 text-[11px] leading-5 text-[#786D97]">Perkiraan kondisi 2026 hasil penelitian; bukan publikasi resmi Badan Pangan Nasional.</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#8696A3]">Data FSVA 2018–2023 tidak digabungkan karena metode penghitungan NCPR berbeda.</p>
        </div>
      </SurfaceCard>

      {/* 02 Metode prediksi */}
      <SurfaceCard className="mb-5 p-5 sm:p-7">
        <SectionTitle icon={Layers3} title="Metode Prediksi" />
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { no: '01', judul: 'Data penelitian', isi: 'FSVA, produksi pangan, harga beras, kondisi sosial, dan iklim.' },
            { no: '02', judul: 'Pengolahan fitur', isi: '20 fitur dari enam kelompok informasi, termasuk riwayat NCPR dan produksi.' },
            { no: '03', judul: 'FT-Transformer', isi: 'Model untuk data tabular; hasil dari lima pelatihan dengan inisialisasi berbeda dirata-ratakan.' },
            { no: '04', judul: 'Ramalan NCPR', isi: 'Model menghasilkan nilai NCPR dan status defisit atau surplus.' },
          ].map((step, index) => (
            <div key={step.no} className="relative rounded-xl border border-[#E7EEF0] bg-[#FAFCFC] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#E8F5F3] text-[12px] font-bold text-[#087F8C]">{step.no}</span>
                {index < 3 && <ArrowRight size={15} className="hidden text-[#A0B6BF] md:block" aria-hidden="true" />}
              </div>
              <h3 className="text-[12px] font-bold text-[#142B3B]">{step.judul}</h3>
              <p className="mt-1.5 text-[12px] leading-5 text-[#718697]">{step.isi}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#E6EDF0] p-4">
            <p className="flex items-center gap-2 text-[12px] font-bold text-[#142B3B]"><Target size={16} className="text-[#087F8C]" aria-hidden="true" /> Cara melatih dan menguji</p>
            <p className="mt-2 text-[12px] leading-6 text-[#657B8C]">
              Model dilatih untuk memprediksi NCPR FSVA 2020–2025, divalidasi pada FSVA 2025, lalu diuji pada <strong className="text-[#142B3B]">402 kabupaten di FSVA 2026</strong> sebagai data uji terpisah.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6EDF0] p-4">
            <p className="flex items-center gap-2 text-[12px] font-bold text-[#142B3B]"><CalendarDays size={16} className="text-[#087F8C]" aria-hidden="true" /> Dasar peramalan FSVA 2027</p>
            <p className="mt-2 text-[12px] leading-6 text-[#657B8C]">
              Ramalan menggunakan NCPR resmi FSVA 2026 dan perbandingan produksi padi <strong className="text-[#142B3B]">{bulanProduksi}</strong> dengan periode sama pada 2025 karena data produksi setahun penuh belum tersedia.
            </p>
          </div>
        </div>
      </SurfaceCard>

      {/* 03 Kinerja model */}
      <SurfaceCard className="mb-5 p-5 sm:p-7">
        <SectionTitle icon={ChartNoAxesCombined} title="Kinerja Model" />
        <p className="mb-4 text-[12px] leading-5 text-[#64798A]">Evaluasi model utama FT-Transformer 20 fitur pada {String(kinerja.diuji_pada ?? 'FSVA 2026')}.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Akurasi status defisit', angka: persentase(kinerja.akurasi_status_persen), catatan: `Baseline tanpa perubahan: ${persentase(kinerja.akurasi_status_jika_tidak_berubah_persen)}`, warna: '#087F8C' },
            { label: 'MASE', angka: desimal(kinerja.mase), catatan: 'Di bawah 1: galat lebih kecil daripada prediksi NCPR tidak berubah', warna: '#142B3B' },
            { label: 'Perubahan terdeteksi', angka: rasio(kinerja.perubahan_status_tertangkap, kinerja.perubahan_status_sebenarnya), catatan: 'Dari seluruh perubahan status pada data uji', warna: '#142B3B' },
            { label: 'Peringatan tepat', angka: rasio(kinerja.peringatan_benar, kinerja.peringatan_dikeluarkan), catatan: 'Dari seluruh peringatan pada data uji', warna: '#142B3B' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#E4ECEF] bg-[#FAFCFD] p-4">
              <p className="min-h-[32px] text-[12px] font-semibold text-[#6E8292]">{item.label}</p>
              <p className="mt-1 text-[25px] font-bold tracking-tight tabular-nums" style={{ color: item.warna }}>{item.angka}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#8396A4]">{item.catatan}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F1E4C9] bg-[#FFFBF2] p-4 text-[12px] leading-5 text-[#846B42]">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#B48232]" aria-hidden="true" />
          <p><strong>Perhatikan:</strong> Akurasi status tidak menunjukkan seluruh perubahan terdeteksi. Pada pengujian FSVA 2026, model masih melewatkan sebagian perubahan status. Hasil pengujian tidak menjamin hasil ramalan FSVA 2027.</p>
        </div>
        <div className="mt-5 border-t border-[#EDF1F3] pt-4">
          <div className="flex items-start gap-2">
            <FlaskConical size={17} className="mt-0.5 shrink-0 text-[#087F8C]" aria-hidden="true" />
            <div>
              <p className="text-[12px] font-bold text-[#142B3B]">Perbandingan skenario penelitian</p>
              <p className="mt-1 text-[12px] leading-5 text-[#728697]">Model 4 fitur diuji sebagai pembanding. <strong className="text-[#526A7C]">PANGNUSA menggunakan model utama 20 fitur untuk ramalan 2027.</strong></p>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-[#E7EDF0]">
            <table className="w-full min-w-[530px] text-left text-[12px]">
              <thead className="bg-[#F4F8F9] font-bold text-[#526B7D]">
                <tr>
                  <th scope="col" className="px-4 py-3">Model uji FSVA 2026</th>
                  <th scope="col" className="px-3 py-3 text-right">MASE</th>
                  <th scope="col" className="px-3 py-3 text-right">Akurasi status</th>
                  <th scope="col" className="px-4 py-3 text-right">Perubahan terdeteksi</th>
                </tr>
              </thead>
              <tbody className="text-[#526A7C]">
                <tr className="border-t border-[#E8EDF0] bg-[#F4FAF9]">
                  <td className="px-4 py-3 font-bold text-[#142B3B]">20 fitur · model utama</td>
                  <td className="px-3 py-3 text-right tabular-nums">{desimal(skenario20.mase)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{persentase(skenario20.akurasi_status_persen)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rasio(skenario20.perubahan_status_tertangkap, skenario20.perubahan_status_sebenarnya)}</td>
                </tr>
                <tr className="border-t border-[#E8EDF0]">
                  <td className="px-4 py-3">4 fitur · skenario pembanding</td>
                  <td className="px-3 py-3 text-right tabular-nums">{desimal(skenario4.mase)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{persentase(skenario4.akurasi_status_persen)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rasio(skenario4.perubahan_status_tertangkap, skenario4.perubahan_status_sebenarnya)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </SurfaceCard>

      {/* 04 Data & keterbatasan */}
      <SurfaceCard className="p-5 sm:p-7">
        <SectionTitle icon={Database} title="Sumber Data dan Keterbatasan" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold text-[#142B3B]"><CheckCircle2 size={16} className="text-[#23865C]" aria-hidden="true" /> Sumber data penelitian</h3>
            <div className="space-y-2.5">
              {SUMBER.map((item) => (
                <div key={item.nama} className="rounded-xl border border-[#E9EFF1] bg-[#FBFCFD] p-3.5">
                  <p className="text-[12px] font-bold text-[#142B3B]">{item.nama}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#768B9A]">{item.isi}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold text-[#142B3B]"><AlertTriangle size={16} className="text-[#BC8A37]" aria-hidden="true" /> Keterbatasan yang perlu diketahui</h3>
            <ul className="space-y-2.5">
              {[...KETERBATASAN, `Cakupan PANGNUSA adalah ${totalKabupaten} kabupaten. Hasil peramalan tersedia untuk ${totalDiramal} kabupaten; ${jumlahBelumDiramal} kabupaten belum memiliki ramalan.`].map((catatan) => (
                <li key={catatan} className="flex items-start gap-2.5 rounded-xl border border-[#E9EFF1] bg-[#FBFCFD] p-3.5 text-[11px] leading-5 text-[#687F90]">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#C58B3D]" aria-hidden="true" />
                  {catatan}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#EEF7F6] p-4 text-[12px] leading-5 text-[#426C72]">
          <Info size={17} className="mt-0.5 shrink-0 text-[#087F8C]" aria-hidden="true" />
          <div>
            <p className="font-bold text-[#17505E]">Cara membaca hasil PANGNUSA</p>
            <p className="mt-1">Ramalan merupakan <strong>indikasi awal</strong> yang perlu diverifikasi. Hasilnya tidak digunakan sebagai satu-satunya dasar keputusan.</p>
          </div>
        </div>
      </SurfaceCard>

    </>
  )
}

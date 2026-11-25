import {
  ArrowLeft, ChartNoAxesCombined,
  Info, MapPin, MapPinned, ShieldAlert, Sprout, Users, Wheat,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { PageHeading, StatusBadge, SurfaceCard } from '../components/DesignUI'
import { useNcprData, type NCPRKabupaten, type PerubahanStatus } from '../data/useNcprData'
import { useProfil, type Profil } from '../data/useProfil'
import { formatKecukupan } from '../data/dashboardData'

const FORMAT = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

function formatNcpr(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? FORMAT.format(value) : '—'
}

const angka = (v: number, d = 0) =>
  v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })

const valid = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0

const MERAH = '#D16B73'
const HIJAU = '#23865C'
const BATAS = 100 / 1.5 // posisi garis kebutuhan 100% pada skala 0–150%
const lebarBatang = (ncpr: number) => Math.min(150, 100 / ncpr) / 150 * 100

const CLASSES = [
  { kelas: 1, label: '≥ 1,50', warna: '#AE3A42', jenis: 'Defisit' },
  { kelas: 2, label: '1,25 – < 1,50', warna: '#D46B60', jenis: 'Defisit' },
  { kelas: 3, label: '1,00 – < 1,25', warna: '#E6A294', jenis: 'Defisit' },
  { kelas: 4, label: '0,75 – < 1,00', warna: '#A8D7BB', jenis: 'Surplus' },
  { kelas: 5, label: '0,50 – < 0,75', warna: '#64B78A', jenis: 'Surplus' },
  { kelas: 6, label: '< 0,50', warna: '#23865C', jenis: 'Surplus' },
] as const

const STATUS: Record<PerubahanStatus, string> = {
  masuk_defisit: 'Masuk defisit',
  keluar_defisit: 'Keluar defisit',
  tetap_defisit: 'Tetap defisit',
  tetap_surplus: 'Tetap surplus',
}

// Kelas prioritas resmi Laporan FSVA Nasional 2025 (Tabel 2.2): prioritas 1 paling rawan.
type KunciIndikator = 'miskin' | 'stunting' | 'tanpa_air' | 'sekolah_perempuan'
const INDIKATOR: { key: KunciIndikator; label: string; satuan: string; n: number; prioritas: (v: number) => number }[] = [
  { key: 'miskin', label: 'Penduduk miskin', satuan: '%', n: 6, prioritas: (v) => v >= 30 ? 1 : v >= 25 ? 2 : v >= 20 ? 3 : v >= 15 ? 4 : v >= 10 ? 5 : 6 },
  { key: 'stunting', label: 'Balita stunting', satuan: '%', n: 4, prioritas: (v) => v >= 40 ? 1 : v >= 30 ? 2 : v >= 20 ? 3 : 4 },
  { key: 'tanpa_air', label: 'Rumah tangga tanpa akses air bersih', satuan: '%', n: 6, prioritas: (v) => v >= 70 ? 1 : v >= 60 ? 2 : v >= 50 ? 3 : v >= 40 ? 4 : v >= 30 ? 5 : 6 },
  { key: 'sekolah_perempuan', label: 'Rata-rata lama sekolah perempuan', satuan: ' tahun', n: 6, prioritas: (v) => v < 6 ? 1 : v < 6.5 ? 2 : v < 7.5 ? 3 : v < 8.5 ? 4 : v < 9 ? 5 : 6 },
]

function namaLengkap(k: NCPRKabupaten) {
  return `Kabupaten ${k.nama}`
}

function keteranganTidakDiramal(k: NCPRKabupaten) {
  if (k.alasan === 'belum_ada_hasil_ramalan') return 'Hasil ramalan untuk kabupaten ini belum tersedia.'
  if (k.alasan === 'data_produksi_tidak_ada') {
    return 'Data produksi yang dibutuhkan untuk peramalan wilayah ini tidak tersedia.'
  }
  return 'Wilayah ini tidak termasuk cakupan peramalan model.'
}

function status2026(k: NCPRKabupaten): 'defisit' | 'surplus' | null {
  const kelas = k.kelas_awal
  if (kelas == null || kelas < 1 || kelas > 6) return null
  return kelas <= 3 ? 'defisit' : 'surplus'
}

function status2027(k: NCPRKabupaten): 'defisit' | 'surplus' | null {
  if (!k.diramal || !k.perubahan_status) return null
  return k.perubahan_status === 'masuk_defisit' || k.perubahan_status === 'tetap_defisit'
    ? 'defisit'
    : 'surplus'
}

/** NCPR terbaru: ramalan 2027 bila ada, kalau tidak NCPR resmi FSVA 2026. */
function ncprTerbaru(k: NCPRKabupaten) {
  return k.diramal && valid(k.ncpr_ramalan) ? k.ncpr_ramalan : k.ncpr_resmi?.['FSVA 2026'] ?? null
}

function Batang({ ncpr, tebal = false }: { ncpr: number; tebal?: boolean }) {
  return (
    <div className={`relative w-full rounded-full bg-[#EEF2F5] ${tebal ? 'h-3' : 'h-1.5'}`} aria-hidden="true">
      <div className="h-full rounded-full" style={{ width: `${lebarBatang(ncpr)}%`, backgroundColor: ncpr >= 1 ? MERAH : HIJAU }} />
      <div className={`absolute w-0.5 bg-[#142B3B] ${tebal ? '-top-1 -bottom-1' : '-top-0.5 -bottom-0.5'}`} style={{ left: `${BATAS}%` }} />
    </div>
  )
}

function Kecukupan({ ncpr }: { ncpr: number }) {
  const selisih = Math.abs(100 / ncpr - 100)
  const kurang = ncpr >= 1
  const catatan = ncpr >= 10
    ? 'Produksi hampir tidak ada, sehingga hampir seluruh kebutuhan dipasok dari luar kabupaten.'
    : selisih < 1
      ? 'Hampir sama dengan kebutuhan penduduk (selisih kurang dari 1%).'
      : kurang
        ? `Kurang sekitar ${angka(selisih)}% dari kebutuhan penduduk, sehingga sisanya perlu dipasok dari luar kabupaten.`
        : `Lebih sekitar ${angka(selisih)}% dari kebutuhan penduduk.`
  return (
    <div className="mt-4">
      <Batang ncpr={ncpr} tebal />
      <div className="relative mt-1.5 h-4 text-[11px] text-[#7A8C9B]" aria-hidden="true">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2 font-bold whitespace-nowrap text-[#142B3B]" style={{ left: `${BATAS}%` }}>kebutuhan 100%</span>
        <span className="absolute right-0">150%+</span>
      </div>
      <p className="mt-2.5 text-[12px] leading-5 font-semibold" style={{ color: kurang ? '#B43B43' : HIJAU }}>{catatan}</p>
    </div>
  )
}

function NilaiUtama({
  title, value, badge, kelas, forecast = false, note, unavailableLabel = 'Status belum tersedia',
}: {
  title: string
  value: number | null | undefined
  badge: 'defisit' | 'surplus' | null
  kelas?: number | null
  forecast?: boolean
  note?: string
  unavailableLabel?: string
}) {
  return (
    <SurfaceCard className={`p-5 sm:p-6 ${forecast ? 'border-[#E3DDF7] bg-[#FEFDFF]' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[12px] font-bold text-[#617587]">{title}</p>
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${forecast ? 'bg-[#F0EBFD] text-[#7464C0]' : 'bg-[#EAF6F5] text-[#087F8C]'}`}>
          {forecast ? 'RAMALAN' : 'RESMI'}
        </span>
      </div>
      <p className={`mt-5 text-[32px] font-bold tracking-tight tabular-nums sm:text-[38px] ${forecast ? 'text-[#7464C0]' : 'text-[#142B3B]'}`}>
        {formatKecukupan(value)}
      </p>
      <p className="text-[12px] text-[#718697]">dari kebutuhan pangan penduduk</p>
      {valid(value) && <Kecukupan ncpr={value} />}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {badge ? <StatusBadge kind={badge}>{badge === 'defisit' ? 'Defisit' : 'Surplus'}</StatusBadge> : <StatusBadge kind="neutral">{unavailableLabel}</StatusBadge>}
        {valid(value) && (
          <span className="rounded-md bg-[#F0F3F5] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[#526778]">
            NCPR {formatNcpr(value)}{kelas != null && kelas >= 1 && kelas <= 6 ? ` · Kelas ${kelas}` : ''}
          </span>
        )}
      </div>
      {note && <p className="mt-4 border-t border-[#EAF0F3] pt-3 text-[12px] leading-5 text-[#718697]">{note}</p>}
    </SurfaceCard>
  )
}

function JudulKartu({ icon: Icon, children }: { icon: typeof Sprout; children: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#142B3B]">
      <Icon size={18} className="text-[#087F8C]" aria-hidden="true" /> {children}
    </h2>
  )
}

function KondisiPenduduk({ p }: { p: Profil }) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <JudulKartu icon={Users}>Kondisi penduduk</JudulKartu>
      <p className="mt-2 text-[12px] leading-5 text-[#7A8C9B]">
        Kabupaten yang kekurangan pangan dan penduduknya rawan sebaiknya didahulukan untuk bantuan.
      </p>
      <ul className="mt-4 space-y-3.5">
        {INDIKATOR.map((i) => {
          const v = p[i.key]
          if (v == null) return null
          const pr = i.prioritas(v)
          const rawan = pr <= 3
          return (
            <li key={i.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] text-[#3F596B]">{i.label}</span>
                <span className="text-[13px] font-bold tabular-nums text-[#142B3B]">{angka(v, 1)}{i.satuan}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: i.n }, (_, j) => (
                    <span key={j} className="h-2 w-5 rounded-sm" style={{ backgroundColor: j < i.n - pr + 1 ? (rawan ? MERAH : '#9FB3C1') : '#EEF2F5' }} />
                  ))}
                </div>
                <span className={`text-[11px] font-semibold ${rawan ? 'text-[#B43B43]' : 'text-[#7A8C9B]'}`}>
                  Prioritas {pr} dari {i.n}{rawan ? ' · perlu perhatian' : ''}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 border-t border-[#EAF0F3] pt-3 text-[11px] leading-5 text-[#8495A3]">
        Data FSVA 2026. Kelas prioritas mengikuti Laporan FSVA Nasional 2025: prioritas 1 paling rawan, makin banyak kotak terisi makin rawan.
      </p>
    </SurfaceCard>
  )
}

function Tetangga({ k, p, semua, kembali }: { k: NCPRKabupaten; p: Profil; semua: NCPRKabupaten[]; kembali: string }) {
  const kab = new Map(semua.map((x) => [x.kode_bps, x]))
  const daftar = p.tetangga
    .map((t) => kab.get(t))
    .filter((x): x is NCPRKabupaten => !!x && valid(ncprTerbaru(x)))
    .sort((a, b) => ncprTerbaru(a)! - ncprTerbaru(b)!)
  if (!daftar.length) return null
  const sendiriKurang = (ncprTerbaru(k) ?? 0) >= 1
  const surplus = daftar.filter((x) => ncprTerbaru(x)! < 1).length
  const kurang = daftar.length - surplus
  const intro = sendiriKurang
    ? surplus
      ? `${surplus} kabupaten tetangga produksinya lebih dari cukup, sehingga bisa menjadi sumber pasokan terdekat.`
      : 'Semua kabupaten tetangga juga kekurangan pangan, sehingga pasokan perlu didatangkan dari daerah yang lebih jauh.'
    : kurang
      ? `${kurang} kabupaten tetangga kekurangan pangan, sehingga bisa menjadi tujuan penjualan hasil panen dari sini.`
      : 'Semua kabupaten tetangga produksinya cukup.'
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <JudulKartu icon={MapPinned}>Kabupaten tetangga</JudulKartu>
      <p className="mt-2 text-[12px] leading-5 text-[#64748B]">{intro}</p>
      <ul className="mt-4 space-y-1">
        {daftar.map((x) => {
          const n = ncprTerbaru(x)!
          return (
            <li key={x.kode_bps}>
              <Link
                to={`/kabupaten/${x.kode_bps}?kembali=${encodeURIComponent(kembali)}`}
                className="grid grid-cols-[minmax(0,1fr)_72px_56px] items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#F5F8FA] focus-visible:outline-2 focus-visible:outline-[#087F8C]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-bold text-[#142B3B]">{x.nama}</span>
                  <span className="block truncate text-[11px] text-[#8495A3]">{!x.diramal ? 'resmi FSVA 2026, tidak diramal' : x.cek_data_produksi ? 'ramalan FSVA 2027 · data perlu dicek' : 'ramalan FSVA 2027'}</span>
                </span>
                <Batang ncpr={n} />
                <span className="text-right text-[12px] font-bold tabular-nums" style={{ color: n >= 1 ? '#B43B43' : HIJAU }}>{formatKecukupan(n)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 border-t border-[#EAF0F3] pt-3 text-[11px] leading-5 text-[#8495A3]">Persentase = kecukupan pangan. Garis hitam pada batang = kebutuhan 100%.</p>
    </SurfaceCard>
  )
}

function HargaBeras({ k, p }: { k: NCPRKabupaten; p: Profil }) {
  if (!valid(p.harga_beras_provinsi_2026)) return null
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <JudulKartu icon={Wheat}>Harga beras</JudulKartu>
      <p className="mt-4 text-[28px] font-bold tracking-tight tabular-nums text-[#142B3B]">
        Rp{angka(p.harga_beras_provinsi_2026)}<span className="text-[14px] font-semibold text-[#718697]">/kg</span>
      </p>
      <p className="text-[12px] font-bold text-[#617587]">Beras medium, {k.provinsi}</p>
      <p className="mt-3 border-t border-[#EAF0F3] pt-3 text-[11px] leading-5 text-[#8495A3]">
        Rata-rata Agustus 2025–Juli 2026 tingkat provinsi (PIHPS Bank Indonesia). Harga tingkat kabupaten belum tersedia.
      </p>
    </SurfaceCard>
  )
}

function GrafikNCPR({ kabupaten }: { kabupaten: NCPRKabupaten }) {
  const resmi = kabupaten.ncpr_resmi ?? {}
  const r24 = resmi['FSVA 2024'] ?? null
  const r25 = resmi['FSVA 2025'] ?? null
  const r26 = resmi['FSVA 2026'] ?? null
  const r27 = kabupaten.diramal ? kabupaten.ncpr_ramalan ?? null : null
  const hasForecast = typeof r27 === 'number' && Number.isFinite(r27)
  const r28 = hasForecast ? kabupaten.ncpr_ramalan_2028 ?? null : null
  const has2028 = typeof r28 === 'number' && Number.isFinite(r28)
  const hasActual = [r24, r25, r26].some((v) => typeof v === 'number' && Number.isFinite(v))
  const points = [
    { edisi: 'FSVA 2024', resmi: r24, ramalan: null as number | null },
    { edisi: 'FSVA 2025', resmi: r25, ramalan: null as number | null },
    { edisi: 'FSVA 2026', resmi: r26, ramalan: hasForecast ? r26 : null },
  ]
  // Jangan membuat titik ramalan kosong pada sumbu waktu jika nilainya tidak ada.
  if (hasForecast) points.push({ edisi: 'FSVA 2027', resmi: null, ramalan: r27 })
  if (has2028) points.push({ edisi: 'FSVA 2028', resmi: null, ramalan: r28 })
  const actuals = [r24, r25, r26, r27, r28].filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const maxY = Math.max(1.25, ...actuals) * 1.12

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#142B3B]">
            <ChartNoAxesCombined size={18} className="text-[#087F8C]" aria-hidden="true" /> Perkembangan NCPR
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-[#7A8C9B]">FSVA 2024 dihitung ulang dengan metode baru; FSVA 2025–2026 merupakan data resmi.{has2028 && ' FSVA 2028 adalah forecast lanjutan dari FSVA 2027 dengan produksi dianggap tidak berubah.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#637A8C]">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[#087F8C]" /> Resmi</span>
          {hasForecast && <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-[#8974D7]" /> Ramalan</span>}
          <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-[#D16B73]" /> Batas NCPR = 1</span>
        </div>
      </div>

      {hasActual ? (
        <div className="mt-5 h-[250px] w-full sm:h-[310px]" role="img" aria-label={`Grafik NCPR ${namaLengkap(kabupaten)} periode FSVA 2024 sampai ${has2028 ? '2028' : hasForecast ? '2027' : '2026'}. Data historis numerik tersedia di bawah grafik.`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 15, right: 12, bottom: 5, left: -15 }}>
              <CartesianGrid stroke="#EAF0F2" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="edisi" tick={{ fill: '#738796', fontSize: 10 }} tickFormatter={(value: string) => value.replace('FSVA ', '')} tickLine={false} axisLine={false} tickMargin={12} interval={0} />
              <YAxis type="number" domain={[0, maxY]} tick={{ fill: '#8395A1', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 })} width={48} />
              <Tooltip
                formatter={(value, name) => [typeof value === 'number' ? formatNcpr(value) : '—', name === 'ramalan' ? 'NCPR ramalan' : 'NCPR resmi']}
                labelFormatter={(label) => label === 'FSVA 2024' ? 'FSVA 2024 (dihitung ulang metode baru)' : label === 'FSVA 2028' ? 'FSVA 2028 (forecast lanjutan)' : String(label)}
                contentStyle={{ borderRadius: 12, borderColor: '#E0E8EE', fontSize: 11, boxShadow: '0 6px 20px rgba(20,43,59,.06)' }}
              />
              <ReferenceLine y={1} stroke="#D16B73" strokeDasharray="5 5" strokeWidth={1.6} />
              <Line type="monotone" dataKey="resmi" name="resmi" stroke="#087F8C" strokeWidth={3} dot={{ r: 4, fill: '#087F8C', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
              {hasForecast && (
                <Line type="monotone" dataKey="ramalan" name="ramalan" stroke="#8974D7" strokeWidth={3} strokeDasharray="7 5" dot={{ r: 4, fill: '#8974D7', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-[#F7FAFB] px-5 py-12 text-center text-[12px] text-[#758A99]">Data NCPR historis tidak tersedia untuk divisualisasikan.</div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EDF1F3] pt-4 sm:grid-cols-3 sm:gap-3">
        {[
          { edisi: 'FSVA 2024', value: r24, note: 'Dihitung ulang' },
          { edisi: 'FSVA 2025', value: r25, note: '' },
          { edisi: 'FSVA 2026', value: r26, note: '' },
        ].map((v) => (
          <div className={`rounded-lg bg-[#F8FAFB] p-2.5 sm:p-3 ${v.edisi === 'FSVA 2026' ? 'col-span-2 sm:col-span-1' : ''}`} key={v.edisi}>
            <p className="text-[11px] font-semibold text-[#738797]">{v.edisi}</p>
            <p className="mt-1 text-[12px] font-bold tabular-nums text-[#142B3B] sm:text-[14px]">{formatNcpr(v.value)}</p>
            {v.note && <p className="mt-0.5 text-[11px] leading-4 text-[#9AA9B3]">{v.note}</p>}
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}

function LegendaKelas({ k }: { k: NCPRKabupaten }) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <h2 className="text-[15px] font-bold text-[#142B3B]">Panduan 6 Kelas NCPR</h2>
      <p className="mt-2 text-[12px] leading-5 text-[#7A8D9C]">Kelas 1–3 menunjukkan defisit; kelas 4–6 menunjukkan surplus.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {CLASSES.map((item) => {
          const active = item.kelas === k.kelas_awal
          const predicted = k.diramal && item.kelas === k.kelas_ramalan
          return (
            <div
              key={item.kelas}
              className={`rounded-xl border p-3 ${active ? 'border-[#087F8C] bg-[#F1FAF9]' : predicted ? 'border-[#8974D7] bg-[#F8F5FF]' : 'border-[#EBEFF2] bg-[#FBFCFD]'}`}
            >
              <div className="mb-2 h-2.5 w-full rounded-full" style={{ backgroundColor: item.warna }} aria-hidden="true" />
              <p className="text-[12px] font-bold text-[#142B3B]">Kelas {item.kelas}</p>
              <p className="mt-0.5 text-[11px] font-bold text-[#728496]">{item.jenis}</p>
              <p className="mt-1.5 text-[11px] leading-4 text-[#758897]">{item.label}</p>
              {active && <span className="mt-2 block text-[9px] font-bold text-[#087F8C]">Resmi FSVA 2026</span>}
              {predicted && <span className="mt-2 block text-[9px] font-bold text-[#7464C0]">Ramalan FSVA 2027</span>}
            </div>
          )
        })}
      </div>
    </SurfaceCard>
  )
}

export default function DetailKabupatenPage() {
  const { kode } = useParams<{ kode: string }>()
  const [query] = useSearchParams()
  const previousList = query.get('kembali')
  // Hanya boleh menuju halaman Jelajahi internal, bukan URL eksternal.
  const kembaliKeJelajahi = previousList && (previousList === '/jelajahi' || previousList.startsWith('/jelajahi?'))
    ? previousList
    : '/jelajahi'
  const { data, loading, error } = useNcprData()
  const profil = useProfil(kode)
  const kabupaten = data.kabupaten.find((item) => item.jenis === 'Kabupaten' && String(item.kode_bps) === kode)

  if (loading) return <p role="status" className="py-12 text-center text-[13px] text-[#627788]">Memuat hasil penelitian PANGNUSA…</p>
  if (error) return <p role="alert" className="rounded-xl border border-[#E5CDD0] bg-[#FFF8F8] p-5 text-[13px] text-[#A33A42]">Data PANGNUSA gagal dimuat: {error} Periksa file public/ncpr_2027.json.</p>

  if (!kabupaten) {
    return (
      <>
        <PageHeading
          title="Kabupaten tidak ditemukan"
          description={`Kode kabupaten ${kode ?? 'tersebut'} tidak ditemukan.`}
        />
        <SurfaceCard className="p-8 text-center">
          <MapPin size={28} className="mx-auto text-[#8497A5]" aria-hidden="true" />
          <p className="mt-3 text-[13px] text-[#627788]">Periksa kembali kode atau pilih dari daftar kabupaten.</p>
          <Link to={kembaliKeJelajahi} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#087F8C] px-4 py-2.5 text-[12px] font-bold text-white">
            <ArrowLeft size={15} /> Kembali ke Jelajahi Kabupaten
          </Link>
        </SurfaceCard>
      </>
    )
  }

  const nama = namaLengkap(kabupaten)
  const resmi2026 = kabupaten.ncpr_resmi?.['FSVA 2026'] ?? null
  const ramalan2027 = kabupaten.diramal ? kabupaten.ncpr_ramalan ?? null : null
  const hasForecastValue = typeof ramalan2027 === 'number' && Number.isFinite(ramalan2027)
  const statusPerubahan = kabupaten.diramal ? kabupaten.perubahan_status ?? null : null
  const s27 = status2027(kabupaten)

  return (
    <>
      <Link to={kembaliKeJelajahi} className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold text-[#087F8C] hover:underline">
        <ArrowLeft size={15} aria-hidden="true" /> Kembali ke Jelajahi Kabupaten
      </Link>
      <PageHeading
        title={nama}
        description={`${kabupaten.provinsi} · Kode BPS ${kabupaten.kode_bps}`}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4E9ED] bg-white px-4 py-4 sm:px-5">
        <p className="max-w-[640px] text-[14px] leading-6 font-semibold text-[#142B3B]">
          {kabupaten.diramal && hasForecastValue
            ? <>Produksi pangan {nama} diramal mencukupi <strong>{formatKecukupan(ramalan2027)}</strong> kebutuhan penduduknya menurut FSVA 2027{typeof kabupaten.ncpr_ramalan_2028 === 'number' && <>, dan sekitar <strong>{formatKecukupan(kabupaten.ncpr_ramalan_2028)}</strong> menurut FSVA 2028 bila produksi tidak berubah</>}.</>
            : kabupaten.diramal
              ? 'Nilai ramalan kabupaten ini belum tersedia.'
              : `${nama} belum bisa diramal.`}
        </p>
        {!kabupaten.diramal ? (
          <StatusBadge kind="neutral">Tidak diramal</StatusBadge>
        ) : statusPerubahan ? (
          <StatusBadge kind={statusPerubahan === 'masuk_defisit' || statusPerubahan === 'tetap_defisit' ? 'defisit' : 'surplus'}>
            {STATUS[statusPerubahan]}
          </StatusBadge>
        ) : (
          <StatusBadge kind="neutral">Belum tersedia</StatusBadge>
        )}
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <NilaiUtama
          title="Kecukupan Pangan · FSVA 2026"
          value={resmi2026}
          badge={status2026(kabupaten)}
          kelas={kabupaten.kelas_awal}
        />
        <NilaiUtama
          title="Ramalan Kecukupan · FSVA 2027"
          value={ramalan2027}
          badge={s27}
          kelas={kabupaten.diramal ? kabupaten.kelas_ramalan : null}
          unavailableLabel={kabupaten.diramal ? 'Status belum tersedia' : 'Tidak diramal'}
          forecast
          note={
            !kabupaten.diramal
              ? undefined
              : hasForecastValue
                ? undefined
                : statusPerubahan
                  ? 'Nilai ramalan belum tersedia; status perubahannya sudah diketahui.'
                  : 'Nilai ramalan belum tersedia.'
          }
        />
      </div>

      {!kabupaten.diramal && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#DFE6EB] bg-[#F5F8FA] p-4 sm:p-5">
          <Info size={19} className="mt-0.5 shrink-0 text-[#718799]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-bold text-[#3F596B]">Kabupaten tidak diramal</p>
            <p className="mt-1 text-[12px] leading-5 text-[#718495]">{keteranganTidakDiramal(kabupaten)} Data NCPR resmi tetap tersedia.</p>
          </div>
        </div>
      )}

      {kabupaten.diramal && kabupaten.cek_data_produksi === true && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#F0DCB1] bg-[#FFF8E8] p-4 sm:p-5" role="note">
          <ShieldAlert size={19} className="mt-0.5 shrink-0 text-[#B37823]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-bold text-[#925C17]">Perlu verifikasi data produksi</p>
            <p className="mt-1 text-[12px] leading-5 text-[#9B763B]">Data produksi padi Januari–April perlu diperiksa sebelum status ramalan wilayah ini digunakan.</p>
          </div>
        </div>
      )}

      {profil && (
        <div className="mb-5 grid gap-5 md:grid-cols-2">
          <KondisiPenduduk p={profil} />
          <Tetangga k={kabupaten} p={profil} semua={data.kabupaten} kembali={kembaliKeJelajahi} />
          <HargaBeras k={kabupaten} p={profil} />
        </div>
      )}

      <h2 className="mt-8 mb-1 text-[16px] font-bold text-[#142B3B]">Rincian NCPR</h2>
      <p className="mb-4 text-[12px] leading-5 text-[#64748B]">Angka resmi FSVA untuk peneliti dan dinas. Kecukupan pangan di atas sama dengan 100 ÷ NCPR.</p>
      <div className="space-y-5">
        <GrafikNCPR kabupaten={kabupaten} />
        <LegendaKelas k={kabupaten} />
      </div>
    </>
  )
}

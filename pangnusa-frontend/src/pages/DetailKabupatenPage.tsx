import {
  ArrowLeft, ChartNoAxesCombined,
  Info, MapPin, ShieldAlert,
} from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { PageHeading, StatusBadge, SurfaceCard } from '../components/DesignUI'
import { useNcprData, type NCPRKabupaten, type PerubahanStatus } from '../data/useNcprData'

const FORMAT = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

function formatNcpr(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? FORMAT.format(value) : '—'
}

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

function NilaiUtama({
  title, periode, value, badge, kelas, forecast = false, note, unavailableLabel = 'Status belum tersedia',
}: {
  title: string
  periode: string
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
        <div>
          <p className="text-[12px] font-bold text-[#617587]">{title}</p>
          <p className="mt-1 text-[12px] text-[#94A1AE]">{periode}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${forecast ? 'bg-[#F0EBFD] text-[#7464C0]' : 'bg-[#EAF6F5] text-[#087F8C]'}`}>
          {forecast ? 'RAMALAN' : 'RESMI'}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <p className={`text-[32px] font-bold tracking-tight tabular-nums sm:text-[38px] ${forecast ? 'text-[#7464C0]' : 'text-[#142B3B]'}`}>
          {formatNcpr(value)}
        </p>

      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {badge ? <StatusBadge kind={badge}>{badge === 'defisit' ? 'Defisit' : 'Surplus'}</StatusBadge> : <StatusBadge kind="neutral">{unavailableLabel}</StatusBadge>}
        {kelas != null && kelas >= 1 && kelas <= 6 && (
          <span className="rounded-md bg-[#F0F3F5] px-2.5 py-1 text-[12px] font-semibold text-[#526778]">Kelas NCPR {kelas}</span>
        )}
      </div>
      {note && <p className="mt-4 border-t border-[#EAF0F3] pt-3 text-[12px] leading-5 text-[#718697]">{note}</p>}
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
  const hasActual = [r24, r25, r26].some((v) => typeof v === 'number' && Number.isFinite(v))
  const points = [
    { edisi: 'FSVA 2024', resmi: r24, ramalan: null as number | null },
    { edisi: 'FSVA 2025', resmi: r25, ramalan: null as number | null },
    { edisi: 'FSVA 2026', resmi: r26, ramalan: hasForecast ? r26 : null },
  ]
  // Jangan membuat titik ramalan kosong pada sumbu waktu jika nilainya tidak ada.
  if (hasForecast) points.push({ edisi: 'FSVA 2027', resmi: null, ramalan: r27 })
  const actuals = [r24, r25, r26, r27].filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const maxY = Math.max(1.25, ...actuals) * 1.12

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#142B3B]">
            <ChartNoAxesCombined size={18} className="text-[#087F8C]" aria-hidden="true" /> Perkembangan NCPR
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-[#7A8C9B]">FSVA 2024 dihitung ulang dengan metode baru; FSVA 2025–2026 merupakan data resmi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#637A8C]">
          <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[#087F8C]" /> Resmi</span>
          {hasForecast && <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-[#8974D7]" /> Ramalan</span>}
          <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-[#D16B73]" /> Batas NCPR = 1</span>
        </div>
      </div>

      {hasActual ? (
        <div className="mt-5 h-[250px] w-full sm:h-[310px]" role="img" aria-label={`Grafik NCPR ${namaLengkap(kabupaten)} periode FSVA 2024 sampai ${hasForecast ? '2027' : '2026'}. Data historis numerik tersedia di bawah grafik.`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 15, right: 12, bottom: 5, left: -15 }}>
              <CartesianGrid stroke="#EAF0F2" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="edisi" tick={{ fill: '#738796', fontSize: 10 }} tickFormatter={(value: string) => value.replace('FSVA ', '')} tickLine={false} axisLine={false} tickMargin={12} interval={0} />
              <YAxis type="number" domain={[0, maxY]} tick={{ fill: '#8395A1', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 })} width={48} />
              <Tooltip
                formatter={(value, name) => [typeof value === 'number' ? formatNcpr(value) : '—', name === 'ramalan' ? 'NCPR ramalan' : 'NCPR resmi']}
                labelFormatter={(label) => label === 'FSVA 2024' ? 'FSVA 2024 (dihitung ulang metode baru)' : String(label)}
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
              {active && <span className="mt-2 block text-[9px] font-bold text-[#087F8C]">Resmi 2026</span>}
              {predicted && <span className="mt-2 block text-[9px] font-bold text-[#7464C0]">Ramalan 2027</span>}
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
  const kabupaten = data.kabupaten.find((item) => item.jenis === 'Kabupaten' && String(item.kode_bps) === kode)

  if (loading) return <p role="status" className="py-12 text-center text-[13px] text-[#627788]">Memuat hasil penelitian PANGNUSA...</p>
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

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <NilaiUtama
          title="NCPR Resmi · FSVA 2026"
          periode="Kondisi tahun 2025"
          value={resmi2026}
          badge={status2026(kabupaten)}
          kelas={kabupaten.kelas_awal}
        />
        <NilaiUtama
          title="NCPR Ramalan · FSVA 2027"
          periode="Perkiraan kondisi tahun 2026"
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
                  ? 'Nilai NCPR ramalan belum tersedia; status perubahannya sudah diketahui.'
                  : 'Nilai NCPR ramalan belum tersedia.'
          }
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4E9ED] bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[12px] font-bold text-[#64798A]">Perubahan status:</span>
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

      <div className="space-y-5">
        <GrafikNCPR kabupaten={kabupaten} />
        <LegendaKelas k={kabupaten} />
      </div>


    </>
  )
}

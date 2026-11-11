import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Database,
  MapPin,
  Search,
  ShieldAlert,
  Sprout,
} from 'lucide-react'
import { Link } from 'react-router'
import { PageHeading, StatusBadge, SurfaceCard } from '../components/DesignUI'
import {
  formatNcpr, getDashboardData, urutkanMasukDefisit, type KabupatenPeringatan,
} from '../data/dashboardData'
import { useNcprData } from '../data/useNcprData'


function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'teal',
}: {
  label: string
  value: string
  icon: typeof Sprout
  tone?: 'teal' | 'red' | 'green' | 'gray'
}) {
  const tones = {
    teal: { bar: 'bg-[#087F8C]', icon: 'bg-[#E7F5F4] text-[#087F8C]' },
    red: { bar: 'bg-[#C94249]', icon: 'bg-[#FCEEEE] text-[#C94249]' },
    green: { bar: 'bg-[#23865C]', icon: 'bg-[#EAF6F0] text-[#23865C]' },
    gray: { bar: 'bg-[#A8B7C2]', icon: 'bg-[#F0F3F6] text-[#728797]' },
  }
  return (
    <SurfaceCard className="relative overflow-hidden p-5 sm:p-6">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${tones[tone].bar}`} />
      <div className="flex items-start justify-between gap-2">
        <h2 className="max-w-[165px] text-[12px] font-bold leading-5 text-[#516779]">{label}</h2>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone].icon}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-[32px] font-bold tracking-tight text-[#142B3B] tabular-nums sm:text-[35px]">{value}</p>
    </SurfaceCard>
  )
}

function PercentBar({ value, forecast = false }: { value: number; forecast?: boolean }) {
  return (
    <div
      className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EAF0F3]"
      role="img"
      aria-label={`Persentase defisit ${value.toLocaleString('id-ID')} persen`}
    >
      <div
        className={`h-full rounded-full ${forecast ? 'bg-[#7464C0]' : 'bg-[#C94249]'}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function DistrictLink({ item }: { item: KabupatenPeringatan }) {
  return (
    <Link
      to={`/kabupaten/${item.slug}`}
      className="inline-flex items-center gap-1 text-[12px] font-bold text-[#087F8C] hover:underline"
      aria-label={`Lihat detail Kabupaten ${item.nama}`}
    >
      Lihat Detail <ChevronRight size={15} aria-hidden="true" />
    </Link>
  )
}

function WarningList({ items }: { items: KabupatenPeringatan[] }) {
  if (items.length === 0) {
    return <p className="px-6 py-12 text-center text-[13px] text-[#64748B]">Tidak ada kabupaten masuk defisit yang sesuai dengan pencarian.</p>
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#F9FBFC] text-[11px] font-bold uppercase tracking-wide text-[#7D90A0]">
            <tr className="border-y border-[#E9EEF1]">
              <th className="px-6 py-3 font-bold">Kabupaten</th>
              <th className="px-4 py-3 font-bold">Provinsi</th>
              <th className="px-4 py-3 font-bold text-center">NCPR Resmi 2026</th>
              <th className="px-4 py-3 font-bold text-center">Ramalan 2027</th>
              <th className="px-4 py-3 font-bold">Perubahan</th>
              <th className="px-6 py-3 font-bold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F4]">
            {items.map((item) => (
              <tr key={item.slug} className="transition-colors hover:bg-[#FAFCFC]">
                <td className="px-6 py-4 text-[12px] font-bold text-[#142B3B]">{item.nama}</td>
                <td className="px-4 py-4 text-[12px] text-[#657C8A]">{item.provinsi}</td>
                <td className="px-4 py-4 text-center text-[12px] font-semibold tabular-nums text-[#607280]">{formatNcpr(item.ncprResmi)}</td>
                <td className="px-4 py-4 text-center text-[12px] font-semibold tabular-nums text-[#607280]">{formatNcpr(item.ncprRamalan)}</td>
                <td className="px-4 py-4"><StatusBadge kind="defisit">Masuk Defisit</StatusBadge>{item.cekDataProduksi && <span className="ml-2"><StatusBadge kind="warning">Perlu Dicek</StatusBadge></span>}</td>
                <td className="px-6 py-4"><DistrictLink item={item} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-[#EDF1F3] lg:hidden">
        {items.map((item) => (
          <div key={item.slug} className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-[#142B3B]">{item.nama}</p>
                <p className="mt-1 flex items-center gap-1 text-[12px] text-[#708594]"><MapPin size={12} /> {item.provinsi}</p>
              </div>
              <StatusBadge kind="defisit">Masuk Defisit</StatusBadge>
              {item.cekDataProduksi && <StatusBadge kind="warning">Perlu Dicek</StatusBadge>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[#F8FAFB] p-3 text-[12px]">
              <div><span className="block text-[#7A8D9B]">Resmi 2026</span><strong className="mt-0.5 block text-[#142B3B]">{formatNcpr(item.ncprResmi)}</strong></div>
              <div><span className="block text-[#7A8D9B]">Ramalan 2027</span><strong className="mt-0.5 block text-[#142B3B]">{formatNcpr(item.ncprRamalan)}</strong></div>
            </div>
            <div className="mt-3"><DistrictLink item={item} /></div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { data, loading, error } = useNcprData()
  const { ringkasan, peringatanKabupaten } = useMemo(() => getDashboardData(data), [data])
  const allProvinces = useMemo(() => Array.from(new Set(peringatanKabupaten.map((item) => item.provinsi))).sort((a, b) => a.localeCompare(b, 'id')), [peringatanKabupaten])
  const warningList = useMemo(() => urutkanMasukDefisit(peringatanKabupaten.filter((item) => item.status === 'masuk_defisit')), [peringatanKabupaten])
  const leavingList = useMemo(() => peringatanKabupaten.filter((item) => item.status === 'keluar_defisit'), [peringatanKabupaten])
  const [searchText, setSearchText] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')

  const filtered = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase('id-ID')
    return (items: KabupatenPeringatan[]) => items.filter((item) => {
      const matchText = query.length === 0 || item.nama.toLocaleLowerCase('id-ID').includes(query)
      const matchProvince = selectedProvince === '' || item.provinsi === selectedProvince
      return matchText && matchProvince
    })
  }, [searchText, selectedProvince])

  const filteredEntering = filtered(warningList)
  const filteredLeaving = filtered(leavingList)
  const formatPersen = (v: number) => `${v.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`

  if (loading) return <p role="status" className="py-12 text-center text-[13px] text-[#627788]">Memuat hasil penelitian PANGNUSA...</p>
  if (error) return <p role="alert" className="rounded-xl border border-[#E5CDD0] bg-[#FFF8F8] p-5 text-[13px] text-[#A33A42]">Data PANGNUSA gagal dimuat: {error} Periksa file public/ncpr_2027.json.</p>

  return (
    <>
      <PageHeading
        title="Peringatan Dini Ketersediaan Pangan"
        description="Ringkasan perubahan status NCPR kabupaten dari FSVA 2026 ke ramalan FSVA 2027."
      />

      <section aria-label="Ringkasan nasional" className="mb-5 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <SummaryCard label="Kabupaten Diramal" value={String(ringkasan.diramal)} icon={Database} />
        <SummaryCard label="Masuk Defisit" value={String(ringkasan.masukDefisit)} icon={ShieldAlert} tone="red" />
        <SummaryCard label="Keluar Defisit" value={String(ringkasan.keluarDefisit)} icon={ArrowUpRight} tone="green" />
        <SummaryCard label="Kabupaten Tidak Diramal" value={String(ringkasan.tidakDiramal)} icon={MapPin} tone="gray" />
      </section>

      <SurfaceCard className="mb-6 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#142B3B]">Perbandingan Kabupaten Defisit</h2>
            <p className="mt-1 text-[12px] leading-5 text-[#64748B]">Persentase kabupaten dalam cakupan model dengan NCPR ≥ 1.</p>
          </div>
          <span className="rounded-full bg-[#EFF5F6] px-3 py-1 text-[11px] font-bold text-[#486E79]">{ringkasan.diramal} kabupaten</span>
        </div>
        <div className="mt-6 grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
          <div>
            <p className="text-[12px] font-bold text-[#758A99]">FSVA 2026 · DATA RESMI</p>
            <p className="mt-1 text-[30px] font-bold tracking-tight text-[#142B3B] tabular-nums">{formatPersen(ringkasan.persenDefisitResmi)}</p>
            <PercentBar value={ringkasan.persenDefisitResmi} />
            <p className="mt-2 text-[12px] text-[#7A8D9B]">Kondisi tahun 2025</p>
          </div>
          <ArrowRight className="hidden text-[#A1B0B9] sm:block" size={22} aria-hidden="true" />
          <div>
            <p className="text-[12px] font-bold text-[#758A99]">FSVA 2027 · HASIL RAMALAN</p>
            <p className="mt-1 text-[30px] font-bold tracking-tight text-[#7464C0] tabular-nums">{formatPersen(ringkasan.persenDefisitRamalan)}</p>
            <PercentBar value={ringkasan.persenDefisitRamalan} forecast />
            <p className="mt-2 text-[12px] text-[#7A8D9B]">Kondisi tahun 2026</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_215px]">
        <label className="relative block">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8296A3]" aria-hidden="true" />
          <span className="sr-only">Cari kabupaten</span>
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cari kabupaten dalam daftar peringatan..."
            className="h-11 w-full rounded-xl border border-[#DCE6E9] bg-white pl-10 pr-4 text-[12px] text-[#142B3B] shadow-sm placeholder:text-[#96A6B0]"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter provinsi</span>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#DCE6E9] bg-white px-3 text-[12px] text-[#506778] shadow-sm"
          >
            <option value="">Semua Provinsi</option>
            {allProvinces.map((province) => <option key={province} value={province}>{province}</option>)}
          </select>
        </label>
      </div>

      <SurfaceCard className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-[#C94249] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#142B3B]">Peringatan Dini: Berpotensi Masuk Defisit</h2>
            <p className="mt-1 text-[12px] leading-5 text-[#64748B]">Surplus pada FSVA 2026, diprediksi defisit pada FSVA 2027.</p>
          </div>
          <StatusBadge kind="defisit">{ringkasan.masukDefisit} Kabupaten</StatusBadge>
        </div>
        <WarningList items={filteredEntering} />
        <div className="border-t border-[#EEF2F4] bg-[#FCFDFD] px-5 py-3 text-[12px] leading-5 text-[#80919B] sm:px-6">
          {warningList.every((item) => item.ncprRamalan !== null) ? 'Diurutkan menurut NCPR ramalan tertinggi.' : 'Urutan wilayah bukan peringkat risiko.'} {warningList.some((item) => item.ncprRamalan === null) && 'Simbol —: nilai NCPR ramalan belum tersedia.'}
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[#EAF6F0] text-[#23865C]"><ArrowDownRight size={22} aria-hidden="true" /></span>
            <div>
              <h2 className="text-[15px] font-bold text-[#142B3B]">Berpotensi Keluar dari Defisit</h2>
              <p className="mt-0.5 text-[12px] text-[#64748B]">Defisit pada FSVA 2026, diprediksi surplus pada FSVA 2027.</p>
            </div>
          </div>
          <StatusBadge kind="surplus">{ringkasan.keluarDefisit} Kabupaten</StatusBadge>
        </div>
        {filteredLeaving.length > 0 ? (
          filteredLeaving.map((item) => (
            <div key={item.slug} className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5EEEB] bg-[#FAFDFB] px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div><p className="text-[13px] font-bold text-[#142B3B]">{item.nama}</p><p className="text-[12px] text-[#718694]">{item.provinsi}</p></div>
                <StatusBadge kind="surplus">Keluar Defisit</StatusBadge>
                  {item.cekDataProduksi && <StatusBadge kind="warning">Perlu Dicek</StatusBadge>}
                  <span className="text-[12px] text-[#657C8A]">NCPR resmi 2026: <strong>{formatNcpr(item.ncprResmi)}</strong></span>
              </div>
              <DistrictLink item={item} />
            </div>
          ))
        ) : (
          <p className="mt-5 rounded-xl bg-[#FAFCFC] px-4 py-6 text-center text-[12px] text-[#64748B]">Tidak ada wilayah keluar defisit yang sesuai dengan pencarian.</p>
        )}
        {filteredLeaving.some((item) => item.cekDataProduksi) && (
          <p className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-[#7A8B96]"><AlertCircle size={15} className="mt-0.5 shrink-0 text-[#C28B30]" /> Data produksi pada kabupaten yang bertanda Perlu Dicek harus diverifikasi sebelum hasil ramalannya digunakan.</p>
        )}
      </SurfaceCard>

      <p className="mb-2 text-[12px] leading-5 text-[#627788]">
        <strong>Data produksi:</strong> {ringkasan.produksiSampai === '2026-04' ? 'Januari–April 2026' : ringkasan.produksiSampai}.
        {' '}Ramalan dapat berubah setelah data produksi diperbarui.
        {ringkasan.tanggalPembaruan && <> Diperbarui: {ringkasan.tanggalPembaruan}.</>}
      </p>

    </>
  )
}

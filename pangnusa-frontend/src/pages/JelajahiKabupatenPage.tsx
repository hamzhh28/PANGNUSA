import { useMemo, useState } from 'react'
import {
  ArrowRight, ChevronRight, Info, MapPinned, Search,
  ShieldAlert,
} from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { PageHeading, StatusBadge, SurfaceCard } from '../components/DesignUI'
import { useNcprData, type NCPRKabupaten, type PerubahanStatus } from '../data/useNcprData'

const PAGE_SIZE = 25

type FilterStatus = PerubahanStatus | 'semua' | 'tidak_diramal'

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'semua', label: 'Semua status' },
  { value: 'masuk_defisit', label: 'Masuk defisit' },
  { value: 'keluar_defisit', label: 'Keluar defisit' },
  { value: 'tetap_defisit', label: 'Tetap defisit' },
  { value: 'tetap_surplus', label: 'Tetap surplus' },
  { value: 'tidak_diramal', label: 'Tidak diramal' },
]

const STATUS_LABEL: Record<PerubahanStatus, string> = {
  masuk_defisit: 'Masuk defisit',
  keluar_defisit: 'Keluar defisit',
  tetap_defisit: 'Tetap defisit',
  tetap_surplus: 'Tetap surplus',
}

function formatNcpr(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  // Empat angka desimal agar nilai di dekat batas NCPR = 1 tidak tampak keliru.
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function alasanTidakDiramal(k: NCPRKabupaten): string {
  if (k.alasan === 'data_produksi_tidak_ada') return 'Data produksi tidak tersedia'
  if (k.alasan === 'belum_ada_hasil_ramalan') return 'Hasil ramalan belum tersedia'
  return 'Di luar cakupan model'
}

function StatusWilayah({ item }: { item: NCPRKabupaten }) {
  if (!item.diramal) {
    return (
      <div className="space-y-1.5">
        <StatusBadge kind="neutral">Tidak diramal</StatusBadge>
        <p className="text-[12px] leading-4 text-[#8897A4]">{alasanTidakDiramal(item)}</p>
      </div>
    )
  }

  const status = item.perubahan_status
  if (!status) return <StatusBadge kind="neutral">Status belum tersedia</StatusBadge>

  return (
    <div className="space-y-1.5">
      <StatusBadge kind={status.endsWith('defisit') && status !== 'keluar_defisit' ? 'defisit' : 'surplus'}>
        {STATUS_LABEL[status]}
      </StatusBadge>
      {item.cek_data_produksi === true && (
        <p className="flex items-center gap-1 text-[12px] text-[#A16B18]">
          <ShieldAlert size={12} aria-hidden="true" /> Perlu cek produksi
        </p>
      )}
    </div>
  )
}

function DistrictRow({ item, returnTo }: { item: NCPRKabupaten; returnTo: string }) {
  const resmi = item.ncpr_resmi?.['FSVA 2026']
  const forecast = item.diramal ? item.ncpr_ramalan : null
  const url = `/kabupaten/${item.kode_bps}?${new URLSearchParams({ kembali: returnTo })}`

  return (
    <tr className="border-b border-[#EDF1F3] transition-colors last:border-b-0 hover:bg-[#F8FBFB]">
      <td className="px-5 py-4 align-middle">
        <Link to={url} className="text-[12px] font-bold text-[#142B3B] hover:text-[#087F8C] hover:underline">
          {item.nama}
        </Link>
      </td>
      <td className="px-4 py-4 text-[12px] text-[#546A7B]">{item.provinsi}</td>
      <td className="px-4 py-4 text-right text-[12px] font-bold tabular-nums text-[#142B3B]">
        {formatNcpr(resmi)}
      </td>
      <td className="px-4 py-4 text-right text-[12px] font-bold tabular-nums text-[#7464C0]">
        {forecast != null ? formatNcpr(forecast) : <span className="font-medium text-[#9BA9B3]">—</span>}
      </td>
      <td className="px-4 py-4"><StatusWilayah item={item} /></td>
      <td className="px-5 py-4 text-right">
        <Link
          to={url}
          aria-label={`Lihat detail ${item.jenis} ${item.nama}, ${item.provinsi}`}
          className="inline-flex items-center gap-0.5 whitespace-nowrap text-[12px] font-bold text-[#087F8C] hover:underline"
        >
          Detail <ChevronRight size={15} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  )
}

function DistrictMobileCard({ item, returnTo }: { item: NCPRKabupaten; returnTo: string }) {
  const url = `/kabupaten/${item.kode_bps}?${new URLSearchParams({ kembali: returnTo })}`
  return (
    <article className="border-b border-[#EDF1F3] p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={url} className="text-[13px] font-bold text-[#142B3B] hover:underline">
            {item.nama}
          </Link>
          <p className="mt-1 text-[12px] text-[#718694]">{item.provinsi}</p>
        </div>
        <Link to={url} aria-label={`Lihat detail ${item.nama}`} className="rounded-lg bg-[#EDF7F6] p-2 text-[#087F8C]">
          <ChevronRight size={18} />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-[#F8FAFB] px-3 py-3">
        <div>
          <p className="text-[11px] text-[#81919E]">NCPR resmi 2026</p>
          <p className="mt-1 text-[14px] font-bold tabular-nums text-[#142B3B]">{formatNcpr(item.ncpr_resmi?.['FSVA 2026'])}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#81919E]">Ramalan 2027</p>
          <p className="mt-1 text-[14px] font-bold tabular-nums text-[#7464C0]">{formatNcpr(item.diramal ? item.ncpr_ramalan : null)}</p>
        </div>
      </div>
      <div className="mt-3"><StatusWilayah item={item} /></div>
    </article>
  )
}

export default function JelajahiKabupatenPage() {
  const { data, loading, error } = useNcprData()
  // Filter disimpan di URL: saat kembali dari Detail Kabupaten, pilihan tetap terjaga.
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('cari') ?? ''
  const provinsi = searchParams.get('provinsi') ?? 'semua'
  const rawStatus = searchParams.get('status') ?? 'semua'
  const status: FilterStatus = STATUS_OPTIONS.some((item) => item.value === rawStatus)
    ? rawStatus as FilterStatus
    : 'semua'
  const returnTo = `/jelajahi${location.search}`
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const kabupaten = useMemo(() => data.kabupaten.filter((k) => k.jenis === 'Kabupaten'), [data.kabupaten])

  function updateFilter(key: 'cari' | 'provinsi' | 'status', value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value === '' || value === 'semua') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
    setVisibleCount(PAGE_SIZE)
  }

  const provinces = useMemo(
    () => [...new Set(kabupaten.map((k) => k.provinsi))].sort((a, b) => a.localeCompare(b, 'id')),
    [kabupaten],
  )

  const result = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID')
    return kabupaten
      .filter((k) => {
        if (query && !`${k.nama} ${k.provinsi} ${k.kode_bps}`.toLocaleLowerCase('id-ID').includes(query)) return false
        if (provinsi !== 'semua' && k.provinsi !== provinsi) return false
        if (status === 'tidak_diramal') return !k.diramal
        if (status !== 'semua') return k.diramal && k.perubahan_status === status
        return true
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id') || a.provinsi.localeCompare(b.provinsi, 'id'))
  }, [kabupaten, search, provinsi, status])

  const visibleRows = result.slice(0, visibleCount)

  function clearFilters() {
    setSearchParams({}, { replace: true })
    setVisibleCount(PAGE_SIZE)
  }

  if (loading) return <p role="status" className="py-12 text-center text-[13px] text-[#627788]">Memuat hasil penelitian PANGNUSA...</p>
  if (error) return <p role="alert" className="rounded-xl border border-[#E5CDD0] bg-[#FFF8F8] p-5 text-[13px] text-[#A33A42]">Data PANGNUSA gagal dimuat: {error} Periksa file public/ncpr_2027.json.</p>

  return (
    <>
      <PageHeading
        title="Jelajahi Kabupaten"
        description="Lihat NCPR resmi dan perubahan status ramalan kabupaten di Indonesia."
      />

      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[#E9EEF1] px-4 py-5 sm:px-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#516779]">Nama kabupaten</span>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#93A3AF]" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => updateFilter('cari', event.target.value)}
                  type="search"
                  placeholder="Cari nama atau kode BPS..."
                  className="h-11 w-full rounded-lg border border-[#DCE5E9] bg-white pl-10 pr-3 text-[12px] text-[#142B3B] outline-none placeholder:text-[#A2AFB9] focus:border-[#087F8C]"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#516779]">Provinsi</span>
              <select
                value={provinsi}
                onChange={(event) => updateFilter('provinsi', event.target.value)}
                className="h-11 w-full rounded-lg border border-[#DCE5E9] bg-white px-3 text-[12px] text-[#142B3B] outline-none focus:border-[#087F8C]"
              >
                <option value="semua">Semua provinsi</option>
                {provinces.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#516779]">Status perubahan</span>
              <select
                value={status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className="h-11 w-full rounded-lg border border-[#DCE5E9] bg-white px-3 text-[12px] text-[#142B3B] outline-none focus:border-[#087F8C]"
              >
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6" aria-live="polite">
          <p className="text-[12px] text-[#657B8C]">
            <strong className="font-bold text-[#142B3B]">{result.length.toLocaleString('id-ID')}</strong> kabupaten ditemukan
            
          </p>
          {(search || provinsi !== 'semua' || status !== 'semua') && (
            <button type="button" onClick={clearFilters} className="text-[12px] font-bold text-[#087F8C] hover:underline">
              Hapus filter
            </button>
          )}
        </div>

        {result.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border-t border-[#EDF1F3] px-5 py-14 text-center">
            <MapPinned size={28} className="text-[#96A8B2]" aria-hidden="true" />
            <p className="text-[13px] font-bold text-[#142B3B]">Tidak ada kabupaten yang cocok</p>
            <p className="max-w-sm text-[12px] leading-5 text-[#718694]">Ubah pencarian atau pilihan filter.</p>
            <button type="button" onClick={clearFilters} className="mt-1 text-xs font-bold text-[#087F8C] hover:underline">Tampilkan semua kabupaten</button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[850px] w-full border-collapse text-left">
                <thead className="border-y border-[#E9EEF1] bg-[#F9FBFC] text-[11px] font-bold uppercase tracking-wide text-[#788B9A]">
                  <tr>
                    <th scope="col" className="px-5 py-3">Kabupaten</th>
                    <th scope="col" className="px-4 py-3">Provinsi</th>
                    <th scope="col" className="px-4 py-3 text-right">NCPR resmi 2026</th>
                    <th scope="col" className="px-4 py-3 text-right">Ramalan 2027</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>{visibleRows.map((item) => <DistrictRow key={item.kode_bps} item={item} returnTo={returnTo} />)}</tbody>
              </table>
            </div>
            <div className="border-t border-[#E9EEF1] md:hidden">
              {visibleRows.map((item) => <DistrictMobileCard key={item.kode_bps} item={item} returnTo={returnTo} />)}
            </div>
            {visibleRows.length < result.length && (
              <div className="border-t border-[#EDF1F3] px-4 py-5 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#C7E0DF] bg-[#EDF7F6] px-5 py-2.5 text-[12px] font-bold text-[#087F8C] hover:bg-[#DDF0EE]"
                >
                  Tampilkan {Math.min(PAGE_SIZE, result.length - visibleRows.length)} kabupaten lagi <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </SurfaceCard>

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-5 text-[#657B8C]">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        NCPR ≥ 1 berarti defisit produksi terhadap konsumsi normatif. Simbol — berarti nilai tidak tersedia, bukan nol.
      </p>

    </>
  )
}

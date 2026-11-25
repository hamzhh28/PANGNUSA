import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { SurfaceCard } from './DesignUI'
import { formatKecukupan } from '../data/dashboardData'
import { kelasNcpr, type NCPRKabupaten } from '../data/useNcprData'

/**
 * Peta kecukupan pangan kabupaten dari public/peta_kabupaten.json (batas wilayah geoBoundaries yang disederhanakan).
 * ponytail: proyeksi lon/lat langsung (equirectangular) tanpa library peta; cukup untuk wilayah sepanjang khatulistiwa.
 */
type Fitur = { properties: { kode: number; kota: boolean }; geometry: { coordinates: number[][][][] } }
type Bentuk = { kode: number; d: string; pusat: [number, number] }
type Peta = { bentuk: Bentuk[]; tinggi: number }

const W = 1000
const PAD = 8
const WARNA = ['', '#AE3A42', '#D46B60', '#E6A294', '#A8D7BB', '#64B78A', '#23865C']
const LABEL = ['', '≤67%', '67–80%', '80–100%', '100–133%', '133–200%', '>200%']
const BELUM = '#C5CFD6'
const KOTA = '#F1F4F6'

let proses: Promise<Peta> | null = null

function muatPeta(): Promise<Peta> {
  proses ??= fetch('/peta_kabupaten.json')
    .then((r) => {
      if (!r.ok) throw new Error('Peta tidak tersedia.')
      return r.json() as Promise<{ features: Fitur[] }>
    })
    .then(({ features }) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
      for (const f of features) for (const poly of f.geometry.coordinates) for (const [x, y] of poly[0]) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      }
      const k = (W - 2 * PAD) / (x1 - x0)
      const px = (x: number) => +(PAD + (x - x0) * k).toFixed(1)
      const py = (y: number) => +(PAD + (y1 - y) * k).toFixed(1)
      const bentuk = features.map((f) => {
        let d = ''
        let besar = 0
        let pusat: [number, number] = [0, 0]
        for (const poly of f.geometry.coordinates) {
          for (const ring of poly) d += `M${ring.map(([x, y]) => `${px(x)},${py(y)}`).join('L')}Z`
          // Penanda diletakkan di titik berat cincin luar poligon terbesar.
          const r = poly[0]
          let a = 0, cx = 0, cy = 0
          for (let i = 0; i < r.length - 1; i++) {
            const c = r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
            a += c; cx += (r[i][0] + r[i + 1][0]) * c; cy += (r[i][1] + r[i + 1][1]) * c
          }
          if (Math.abs(a) > besar) { besar = Math.abs(a); pusat = [px(cx / (3 * a)), py(cy / (3 * a))] }
        }
        return { kode: f.properties.kode, d, pusat }
      })
      return { bentuk, tinggi: (y1 - y0) * k + 2 * PAD }
    })
    .catch((err: unknown) => { proses = null; throw err })
  return proses
}

const SEGITIGA = 'M0,-7L6.5,4.5L-6.5,4.5Z'

function Penanda({ jenis }: { jenis: 'masuk' | 'keluar' }) {
  return (
    <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true">
      {jenis === 'masuk'
        ? <path d={SEGITIGA} fill="#B43B43" stroke="white" strokeWidth="1.5" />
        : <circle r="5.5" fill="#23865C" stroke="white" strokeWidth="1.5" />}
    </svg>
  )
}

export default function PetaKabupaten({ kabupaten }: { kabupaten: NCPRKabupaten[] }) {
  const [peta, setPeta] = useState<Peta | null>(null)
  const [gagal, setGagal] = useState(false)
  const [tahun, setTahun] = useState<2025 | 2026>(2026)
  const [tip, setTip] = useState<{ x: number; y: number; kiri: boolean; kode: number } | null>(null)
  const kotak = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const kab = useMemo(() => new Map(kabupaten.map((k) => [k.kode_bps, k])), [kabupaten])

  useEffect(() => {
    let aktif = true
    muatPeta().then((p) => { if (aktif) setPeta(p) }, () => { if (aktif) setGagal(true) })
    return () => { aktif = false }
  }, [])

  // Lapisan peta di-memo supaya tooltip yang bergerak tidak menggambar ulang 514 wilayah.
  const lapisan = useMemo(() => {
    if (!peta) return null
    const ncpr = (k: NCPRKabupaten) =>
      tahun === 2026 ? (k.diramal ? k.ncpr_ramalan ?? null : null) : k.ncpr_resmi?.['FSVA 2026'] ?? null
    const isi = (b: Bentuk) => {
      const k = kab.get(b.kode)
      if (!k) return KOTA
      const n = ncpr(k)
      return n == null ? BELUM : WARNA[kelasNcpr(n)]
    }
    const kurang = peta.bentuk.filter((b) => { const k = kab.get(b.kode); const n = k && ncpr(k); return n != null && n >= 1 })
    const penanda = tahun === 2026
      ? peta.bentuk.flatMap((b) => {
        const s = kab.get(b.kode)?.perubahan_status
        return s === 'masuk_defisit' || s === 'keluar_defisit' ? [{ ...b, s }] : []
      })
      : []
    return (
      <>
        <g>
          {peta.bentuk.map((b) => (
            <path key={b.kode} data-kode={b.kode} d={b.d} fill={isi(b)} stroke="white" strokeWidth={0.4}
              className={kab.has(b.kode) ? 'cursor-pointer hover:stroke-[#142B3B] hover:stroke-[1.5]' : ''} />
          ))}
        </g>
        {/* Arsir = kurang dari kebutuhan, supaya status tidak hanya dibedakan warna. */}
        <g pointerEvents="none">
          {kurang.map((b) => <path key={b.kode} d={b.d} fill="url(#arsir)" />)}
        </g>
        <g pointerEvents="none">
          {penanda.map((b) => b.s === 'masuk_defisit'
            ? <path key={b.kode} d={SEGITIGA} transform={`translate(${b.pusat[0]},${b.pusat[1]}) scale(1.3)`} fill="#B43B43" stroke="white" strokeWidth={1.5} />
            : <circle key={b.kode} cx={b.pusat[0]} cy={b.pusat[1]} r={7} fill="#23865C" stroke="white" strokeWidth={2} />)}
        </g>
      </>
    )
  }, [peta, kab, tahun])

  const kodeDi = (e: MouseEvent) => Number((e.target as Element).getAttribute('data-kode'))

  function gerak(e: MouseEvent) {
    const kode = kodeDi(e)
    if (!kode || !kotak.current) { setTip(null); return }
    const r = kotak.current.getBoundingClientRect()
    const x = e.clientX - r.left
    setTip({ x, y: e.clientY - r.top, kiri: x > r.width - 250, kode })
  }

  const k = tip ? kab.get(tip.kode) : undefined
  const tombol = (t: 2025 | 2026, label: string) => (
    <button
      type="button"
      aria-pressed={tahun === t}
      onClick={() => setTahun(t)}
      className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#087F8C] ${tahun === t ? 'bg-[#087F8C] text-white' : 'text-[#516779] hover:bg-[#EEF2F5]'}`}
    >
      {label}
    </button>
  )

  return (
    <SurfaceCard className="mb-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[620px]">
          <h2 className="text-[16px] font-bold text-[#142B3B]">Peta Kecukupan Pangan</h2>
          <p className="mt-1 text-[12px] leading-5 text-[#64748B]">
            Warna menunjukkan seberapa besar produksi pangan kabupaten mencukupi kebutuhan penduduknya (100 ÷ NCPR).
            Klik kabupaten untuk melihat detailnya.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[#DCE6E9] bg-white p-1" role="group" aria-label="Tahun yang ditampilkan">
          {tombol(2025, '2025 · resmi')}
          {tombol(2026, '2026 · ramalan')}
        </div>
      </div>

      <div ref={kotak} className="relative mt-5">
        {gagal ? (
          <p className="rounded-xl bg-[#F7FAFB] px-5 py-12 text-center text-[12px] text-[#758A99]">Peta gagal dimuat. Daftar kabupaten tetap bisa dilihat di Jelajahi Kabupaten.</p>
        ) : !peta ? (
          <p role="status" className="rounded-xl bg-[#F7FAFB] px-5 py-12 text-center text-[12px] text-[#758A99]">Memuat peta…</p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${peta.tinggi.toFixed(0)}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`Peta kecukupan pangan kabupaten tahun ${tahun}. Daftar lengkap tersedia di halaman Jelajahi Kabupaten.`}
            onMouseMove={gerak}
            onMouseLeave={() => setTip(null)}
            onClick={(e) => { const kode = kodeDi(e); if (kab.has(kode)) navigate(`/kabupaten/${kode}`) }}
          >
            <defs>
              <pattern id="arsir" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(255,255,255,.65)" strokeWidth="1.6" />
              </pattern>
            </defs>
            {lapisan}
          </svg>
        )}

        {tip && (
          <div
            className="pointer-events-none absolute z-10 w-[230px] rounded-xl border border-[#E0E8EE] bg-white px-3.5 py-3 text-[12px] leading-5 text-[#3F596B] shadow-[0_6px_20px_rgba(20,43,59,.1)]"
            style={{ left: tip.kiri ? tip.x - 244 : tip.x + 14, top: tip.y + 14 }}
          >
            {!k ? (
              <><p className="font-bold text-[#142B3B]">Wilayah kota</p><p>Di luar cakupan: pangan kota sebagian besar didatangkan dari luar.</p></>
            ) : (
              <>
                <p className="font-bold text-[#142B3B]">{k.nama}</p>
                <p className="text-[11px] text-[#8495A3]">{k.provinsi}</p>
                <p className="mt-1">Kecukupan 2025: <strong className="tabular-nums">{formatKecukupan(k.ncpr_resmi?.['FSVA 2026'])}</strong></p>
                {k.diramal
                  ? <p>Ramalan 2026: <strong className="tabular-nums">{formatKecukupan(k.ncpr_ramalan)}</strong></p>
                  : <p>Belum bisa diramal: data produksi tidak tersedia.</p>}
                {k.perubahan_status === 'masuk_defisit' && <p className="font-semibold text-[#B43B43]">Berpotensi masuk defisit</p>}
                {k.perubahan_status === 'keluar_defisit' && <p className="font-semibold text-[#23865C]">Berpotensi keluar defisit</p>}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#637A8C]">
        <span className="flex items-center gap-2">
          <span className="font-bold">Kurang</span>
          <span className="flex" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="h-3 w-7" title={LABEL[i]}
                style={{ background: i <= 3 ? `repeating-linear-gradient(45deg, rgba(255,255,255,.65) 0 1.5px, transparent 1.5px 4.5px), ${WARNA[i]}` : WARNA[i] }} />
            ))}
          </span>
          <span className="font-bold">Cukup</span>
        </span>
        <span className="tabular-nums">≤67 · 80 · 100 · 133 · 200%+ (berarsir = kurang dari kebutuhan)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: BELUM }} aria-hidden="true" />belum bisa diramal</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-[#DCE3E8]" style={{ background: KOTA }} aria-hidden="true" />kota (di luar cakupan)</span>
        {tahun === 2026 && <>
          <span className="flex items-center gap-1"><Penanda jenis="masuk" />berpotensi masuk defisit</span>
          <span className="flex items-center gap-1"><Penanda jenis="keluar" />berpotensi keluar defisit</span>
        </>}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#8495A3]">
        Batas wilayah: geoBoundaries, disederhanakan. Lebih mudah mencari lewat nama? Buka{' '}
        <Link to="/jelajahi" className="font-bold text-[#087F8C] hover:underline">Jelajahi Kabupaten</Link>.
      </p>
    </SurfaceCard>
  )
}

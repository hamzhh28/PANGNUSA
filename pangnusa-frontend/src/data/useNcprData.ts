import { useEffect, useState } from 'react'

/**
 * Data PANGNUSA hanya berasal dari public/ncpr_2027.json hasil ekspor Google Colab.
 * Tidak menjalankan model di browser dan tidak menampilkan snapshot lama.
 */
export type PerubahanStatus =
  | 'masuk_defisit'
  | 'keluar_defisit'
  | 'tetap_defisit'
  | 'tetap_surplus'

type SkenarioId = '20_fitur' | '4_fitur'

type Kinerja = Record<string, string | number>

interface HasilSkenario {
  ncpr_ramalan: number
  kelas_ramalan: number
  perubahan_status: PerubahanStatus
}

export interface NCPRKabupaten {
  kode_bps: number
  nama: string
  provinsi: string
  jenis: 'Kabupaten'
  diramal: boolean
  alasan?: 'data_produksi_tidak_ada' | 'belum_ada_hasil_ramalan' | null
  ncpr_resmi?: Record<string, number | null>
  ncpr_ramalan?: number | null
  kelas_awal?: number | null
  kelas_ramalan?: number | null
  perubahan_status?: PerubahanStatus | null
  cek_data_produksi?: boolean
  skenario?: Record<SkenarioId, HasilSkenario> | null
}

export interface NCPRMeta {
  dibuat?: string | null
  edisi_awal: string
  kondisi_awal: number
  edisi_ramalan: string
  kondisi_ramalan: number
  data_produksi_sampai?: string
  model?: string
  kinerja?: Kinerja
  kinerja_jan_apr?: Kinerja
  skenario_utama?: SkenarioId
  skenario?: Partial<Record<SkenarioId, {
    model: string
    kinerja: Kinerja
    kinerja_jan_apr?: Kinerja
  }>>
  ringkasan?: {
    total_wilayah: number
    diramal: number
    tidak_diramal: number
    masuk_defisit: number
    keluar_defisit: number
    persen_defisit_resmi: number
    persen_defisit_ramalan: number
  }
  sumber_data?: string
}

export interface NCPRData {
  meta: NCPRMeta
  kabupaten: NCPRKabupaten[]
}

const KOSONG: NCPRData = {
  meta: {
    edisi_awal: 'FSVA 2026',
    kondisi_awal: 2025,
    edisi_ramalan: 'FSVA 2027',
    kondisi_ramalan: 2026,
  },
  kabupaten: [],
}

const STATUSES: PerubahanStatus[] = [
  'masuk_defisit', 'keluar_defisit', 'tetap_defisit', 'tetap_surplus',
]

function kelasNcpr(n: number): number {
  if (n >= 1.5) return 1
  if (n >= 1.25) return 2
  if (n >= 1) return 3
  if (n >= 0.75) return 4
  if (n >= 0.5) return 5
  return 6
}

function statusNcpr(resmi: number, ramalan: number): PerubahanStatus {
  if (resmi < 1 && ramalan >= 1) return 'masuk_defisit'
  if (resmi >= 1 && ramalan < 1) return 'keluar_defisit'
  return resmi >= 1 ? 'tetap_defisit' : 'tetap_surplus'
}

function angkaValid(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 10
}

/** Menolak JSON tidak lengkap/tidak sesuai agar hasil lama tidak tampil diam-diam. */
function validasiEkspor(value: unknown): NCPRData {
  if (!value || typeof value !== 'object') throw new Error('Struktur JSON tidak sesuai.')
  const hasil = value as Partial<NCPRData>
  const kabupaten = hasil.kabupaten
  const meta = hasil.meta
  if (!meta || !Array.isArray(kabupaten) || kabupaten.length !== 416 || !meta.ringkasan) {
    throw new Error('Jumlah kabupaten atau metadata JSON tidak sesuai.')
  }
  if (meta.skenario_utama !== '20_fitur' || !meta.skenario?.['20_fitur'] || !meta.skenario?.['4_fitur']) {
    throw new Error('Skenario FT-Transformer dalam JSON tidak lengkap.')
  }

  const kode = new Set<number>()
  for (const k of kabupaten) {
    if (!Number.isInteger(k.kode_bps) || kode.has(k.kode_bps) ||
      k.jenis !== 'Kabupaten' || !k.nama?.trim() || !k.provinsi?.trim() ||
      typeof k.diramal !== 'boolean' ||
      !angkaValid(k.ncpr_resmi?.['FSVA 2026']) ||
      k.kelas_awal !== kelasNcpr(k.ncpr_resmi['FSVA 2026']!)) {
      throw new Error('Ada data kabupaten yang tidak valid atau duplikat.')
    }
    kode.add(k.kode_bps)
    if (k.diramal) {
      const resmi = k.ncpr_resmi['FSVA 2026']!
      const pred = k.ncpr_ramalan
      if (!angkaValid(pred) || k.kelas_ramalan !== kelasNcpr(pred) ||
        !STATUSES.includes(k.perubahan_status as PerubahanStatus) ||
        k.perubahan_status !== statusNcpr(resmi, pred)) {
        throw new Error(`Hasil ramalan tidak konsisten untuk ${k.nama}.`)
      }
      for (const s of ['20_fitur', '4_fitur'] as const) {
        const v = k.skenario?.[s]
        if (!v || !angkaValid(v.ncpr_ramalan) || v.kelas_ramalan !== kelasNcpr(v.ncpr_ramalan) ||
          v.perubahan_status !== statusNcpr(resmi, v.ncpr_ramalan)) {
          throw new Error(`Hasil skenario ${s} tidak konsisten untuk ${k.nama}.`)
        }
      }
      if (Math.abs(k.skenario!['20_fitur'].ncpr_ramalan - pred) > 0.00001 ||
        k.skenario!['20_fitur'].perubahan_status !== k.perubahan_status) {
        throw new Error(`Skenario utama tidak sesuai untuk ${k.nama}.`)
      }
    } else if (k.ncpr_ramalan != null || k.perubahan_status != null || k.kelas_ramalan != null) {
      throw new Error(`Kabupaten tidak diramal memiliki prediksi: ${k.nama}.`)
    }
  }
  if (!kode.has(6302)) throw new Error('Kabupaten Kotabaru tidak ditemukan.')

  const diramal = kabupaten.filter((k) => k.diramal)
  const masuk = diramal.filter((k) => k.perubahan_status === 'masuk_defisit').length
  const keluar = diramal.filter((k) => k.perubahan_status === 'keluar_defisit').length
  const defisitResmi = diramal.filter((k) => (k.ncpr_resmi?.['FSVA 2026'] ?? 0) >= 1).length
  const defisitRamalan = diramal.filter((k) => (k.ncpr_ramalan ?? 0) >= 1).length
  const persen = (n: number) => Number((n * 100 / diramal.length).toFixed(1))
  const r = meta.ringkasan
  if (r.total_wilayah !== kabupaten.length || r.diramal !== diramal.length ||
    r.tidak_diramal !== kabupaten.length - diramal.length ||
    r.masuk_defisit !== masuk || r.keluar_defisit !== keluar ||
    r.persen_defisit_resmi !== persen(defisitResmi) ||
    r.persen_defisit_ramalan !== persen(defisitRamalan)) {
    throw new Error('Ringkasan JSON tidak sama dengan data per kabupaten.')
  }
  return { meta, kabupaten }
}

// Cache data satu kali selama pengguna bernavigasi antarhalaman.
let cache: NCPRData | null = null
let proses: Promise<NCPRData> | null = null

function ambilData(): Promise<NCPRData> {
  if (cache) return Promise.resolve(cache)
  if (!proses) {
    proses = fetch('/ncpr_2027.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('File ncpr_2027.json tidak tersedia.')
        return validasiEkspor(await response.json())
      })
      .then((valid) => { cache = valid; return valid })
      .catch((err: unknown) => { proses = null; throw err })
  }
  return proses
}

export function useNcprData() {
  const [data, setData] = useState<NCPRData>(cache ?? KOSONG)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let aktif = true
    ambilData()
      .then((hasil) => { if (aktif) { setData(hasil); setLoading(false) } })
      .catch((err: unknown) => {
        if (aktif) {
          setError(err instanceof Error ? err.message : 'Gagal membaca ncpr_2027.json.')
          setLoading(false)
        }
      })
    return () => { aktif = false }
  }, [])

  return { data, loading, error }
}

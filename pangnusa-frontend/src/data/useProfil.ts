import { useEffect, useState } from 'react'

/**
 * Profil pendukung per kabupaten (public/profil.json): produksi padi Januari–April,
 * indikator kerawanan FSVA 2026, harga beras provinsi, dan kabupaten tetangga.
 * Bersifat tambahan: kalau gagal dimuat, halaman tetap menampilkan hasil ramalan.
 */
export interface Profil {
  padi_janapr_2025: number | null
  padi_janapr_2026: number | null
  miskin: number | null
  stunting: number | null
  tanpa_air: number | null
  sekolah_perempuan: number | null
  harga_beras_provinsi_2026: number | null
  tetangga: number[]
}

type DataProfil = Record<string, Profil>

let cache: DataProfil | null = null
let proses: Promise<DataProfil | null> | null = null

function ambilProfil() {
  proses ??= fetch('/profil.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() as Promise<DataProfil> : null))
    .then((d) => (cache = d))
    .catch(() => null)
  return proses
}

export function useProfil(kode: string | undefined): Profil | null {
  const [data, setData] = useState<DataProfil | null>(cache)
  useEffect(() => {
    if (cache) return
    let aktif = true
    ambilProfil().then((d) => { if (aktif) setData(d) })
    return () => { aktif = false }
  }, [])
  return kode ? data?.[kode] ?? null : null
}

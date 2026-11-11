import type { NCPRData, NCPRKabupaten, PerubahanStatus } from './useNcprData'

export type StatusPerubahan = PerubahanStatus
export interface KabupatenPeringatan {
  slug: string
  nama: string
  provinsi: string
  status: StatusPerubahan
  ncprResmi: number | null
  ncprRamalan: number | null
  cekDataProduksi: boolean
}

export function formatNcpr(value: number | null): string {
  // Empat desimal menghindari nilai 0,9999 dibulatkan menjadi 1,00 di dekat ambang defisit.
  return value === null || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)
}

/** Mengurutkan hanya bila nilai forecast individual seluruhnya tersedia. */
export function urutkanMasukDefisit(items: KabupatenPeringatan[]): KabupatenPeringatan[] {
  if (items.length && items.every((item) => item.ncprRamalan !== null)) {
    return [...items].sort((a, b) => (b.ncprRamalan ?? 0) - (a.ncprRamalan ?? 0))
  }
  return items
}

function mapPeringatan(k: NCPRKabupaten): KabupatenPeringatan {
  return {
    slug: String(k.kode_bps),
    nama: k.nama,
    provinsi: k.provinsi,
    status: k.perubahan_status as StatusPerubahan,
    ncprResmi: k.ncpr_resmi?.['FSVA 2026'] ?? null,
    ncprRamalan: k.ncpr_ramalan ?? null,
    cekDataProduksi: k.cek_data_produksi === true,
  }
}

export function getDashboardData(data: NCPRData) {
  const kabupaten = data.kabupaten.filter((k) => k.jenis === 'Kabupaten')
  const available = kabupaten.filter((k) => k.diramal)
  const peringatanKabupaten = available
    .filter((k) => k.perubahan_status === 'masuk_defisit' || k.perubahan_status === 'keluar_defisit')
    .map(mapPeringatan)
  const entering = peringatanKabupaten.filter((k) => k.status === 'masuk_defisit')
  const leaving = peringatanKabupaten.filter((k) => k.status === 'keluar_defisit')

  // Pengelompokan status yang SUDAH diberikan oleh pipeline/snapshot.
  // Ini bukan perhitungan status/kelas dari angka NCPR.
  const predictedDeficit = available.filter((k) =>
    k.perubahan_status === 'masuk_defisit' || k.perubahan_status === 'tetap_defisit',
  ).length
  const officialDeficit = available.filter((k) =>
    k.perubahan_status === 'keluar_defisit' || k.perubahan_status === 'tetap_defisit',
  ).length
  const pct = (n: number) => available.length ? Number((n * 100 / available.length).toFixed(1)) : 0

  const ringkasan = {
    totalWilayah: kabupaten.length,
    diramal: available.length,
    tidakDiramal: kabupaten.length - available.length,
    masukDefisit: entering.length,
    keluarDefisit: leaving.length,
    persenDefisitResmi: pct(officialDeficit),
    persenDefisitRamalan: pct(predictedDeficit),
    edisiAwal: data.meta.edisi_awal,
    edisiRamalan: data.meta.edisi_ramalan,
    produksiSampai: data.meta.data_produksi_sampai || '—',
    tanggalPembaruan: data.meta.dibuat || null,
  }
  return { ringkasan, peringatanKabupaten }
}

"""Persiapan input ramalan NCPR FSVA 2027 berdasarkan notebook FT-Transformer v2.

Input merupakan dataset yang SUDAH diproses pada penelitian, bukan data mentah.
Tidak melakukan pelatihan, normalisasi ulang, ataupun inferensi model.
"""

from pathlib import Path
import argparse

import numpy as np
import pandas as pd


# Urutan fitur harus sama dengan FEATURES pada cell 44 notebook penelitian.
NUMERIC_FEATURES = [
    "ikp", "ncpr",
    "produksi_kab_growth", "produksi_pangan_growth_tanpa_jagung",
    "produksi_log", "luas_panen_log",
    "miskin", "pengeluaran_pangan", "tanpa_listrik", "harga_log", "harga_cv",
    "tanpa_air", "lama_sekolah_perempuan", "rasio_nakes", "ahh", "stunting",
    "hujan_anomali", "suhu_c", "oni",
]
MODEL_FEATURES = NUMERIC_FEATURES + ["prov_kode"]
PRODUCTION_FEATURES = ["produksi_kab_growth", "produksi_pangan_growth_tanpa_jagung"]
FORECAST_INPUT_YEAR = 2026  # fitur baris 2026 dipakai untuk meramal FSVA 2027
EXPECTED_DISTRICTS = 402
DATASET_NAME = "dataset_gabungan_kabupaten_processed.csv"


def prepare_forecast_features(dataset_path: str | Path) -> pd.DataFrame:
    """Baca dataset dan siapkan 402 baris fitur (19 numerik + provinsi) untuk inferensi.

    Mengikuti notebook:
    - kabupaten terpilih: punya pertumbuhan produksi pada 2019–2024 (cell 44)
    - NCPR basis: `ncpr_metode_baru` FSVA 2026 (cell 75)
    - dua fitur pertumbuhan produksi: log perbandingan padi Jan–Apr 2026/2025,
      di-clip ±1,5; bila tidak tersedia, pertumbuhan dianggap 0 (cell 75)
    - scaling memakai scaler model terlatih pada Tahap 2, bukan dihitung di sini.
    """
    dataset_path = Path(dataset_path)
    if not dataset_path.is_file():
        raise FileNotFoundError(f"Dataset tidak ditemukan: {dataset_path}")

    data = pd.read_csv(dataset_path, dtype={"kode_bps": "string"}, low_memory=False)
    required = set(MODEL_FEATURES) | {
        "kode_bps", "kab_kota", "provinsi", "wilayah_34", "jenis", "tahun",
        "ncpr_metode_baru", "produksi_padi_jan_apr_ton",
    }
    missing = sorted(required - set(data.columns))
    if missing:
        raise ValueError(f"Kolom dataset tidak lengkap: {', '.join(missing)}")

    if data["kode_bps"].isna().any() or data["tahun"].isna().any():
        raise ValueError("Ada kode_bps atau tahun yang kosong.")
    if data.duplicated(["kode_bps", "tahun"]).any():
        raise ValueError("Terdapat duplikat kombinasi kode_bps dan tahun.")

    data["tahun"] = pd.to_numeric(data["tahun"], errors="raise").astype(int)
    for col in set(MODEL_FEATURES) | {"ncpr_metode_baru", "produksi_padi_jan_apr_ton"}:
        data[col] = pd.to_numeric(data[col], errors="raise")

    if data["kode_bps"].nunique() != 514:
        raise ValueError("Jumlah wilayah tidak sesuai dataset penelitian (seharusnya 514).")

    # Pastikan prov_kode sesuai encoding provinsi induk yang dipakai saat training.
    province_codes = {name: i for i, name in enumerate(sorted(data["wilayah_34"].unique()))}
    if len(province_codes) != 34 or not data["prov_kode"].eq(data["wilayah_34"].map(province_codes)).all():
        raise ValueError("Encoding prov_kode tidak sesuai 34 provinsi pada notebook.")

    # Kode cakupan model diambil dari riwayat yang dipakai notebook, bukan
    # sekadar semua kabupaten tahun 2026.
    history = data.loc[
        data["jenis"].eq("Kabupaten") & data["tahun"].between(2019, 2024)
    ]
    eligible_codes = history.loc[
        history[PRODUCTION_FEATURES].notna().any(axis=1), "kode_bps"
    ].unique()
    if len(eligible_codes) != EXPECTED_DISTRICTS:
        raise ValueError(
            f"Cakupan kabupaten berubah: {len(eligible_codes)}, "
            f"seharusnya {EXPECTED_DISTRICTS}. Periksa dataset."
        )

    forecast = data.loc[
        data["tahun"].eq(FORECAST_INPUT_YEAR)
        & data["kode_bps"].isin(eligible_codes)
    ].copy()
    if len(forecast) != EXPECTED_DISTRICTS or forecast["ncpr_metode_baru"].isna().any():
        raise ValueError("Data FSVA 2026 untuk 402 kabupaten belum lengkap.")

    # FSVA 2026 memakai metode baru; jangan memakai kolom ncpr metode lama.
    forecast["ncpr"] = forecast["ncpr_metode_baru"]

    # Perubahan produksi padi kumulatif Jan–Apr 2026 vs Jan–Apr 2025.
    # Mengikuti fungsi with_partial_growth() pada cell 75 notebook.
    by_year = data.set_index(["kode_bps", "tahun"])["produksi_padi_jan_apr_ton"]
    current = pd.MultiIndex.from_arrays([forecast["kode_bps"], forecast["tahun"]])
    previous = pd.MultiIndex.from_arrays([forecast["kode_bps"], forecast["tahun"] - 1])
    now = by_year.reindex(current).to_numpy(dtype=float)
    prev = by_year.reindex(previous).to_numpy(dtype=float)
    with np.errstate(divide="ignore", invalid="ignore", over="ignore"):
        growth = np.log(now / prev)
    growth = np.nan_to_num(np.clip(growth, -1.5, 1.5), nan=0.0)
    forecast[PRODUCTION_FEATURES] = np.column_stack([growth, growth])

    numeric = forecast[NUMERIC_FEATURES].to_numpy(dtype=float)
    categorical = forecast["prov_kode"].to_numpy(dtype=float)
    if not np.isfinite(numeric).all() or not np.isfinite(categorical).all():
        bad_cols = [c for c in MODEL_FEATURES if not np.isfinite(forecast[c].to_numpy(dtype=float)).all()]
        raise ValueError(f"Fitur model mengandung nilai kosong/tidak valid: {bad_cols}")

    columns = ["kode_bps", "kab_kota", "provinsi", "tahun", "ncpr_metode_baru", *MODEL_FEATURES]
    return forecast[columns].reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validasi dataset dan siapkan 20 fitur FSVA 2027.")
    parser.add_argument(
        "--data", type=Path, default=Path(__file__).resolve().parent / DATASET_NAME,
        help="Lokasi CSV hasil preprocessing penelitian.",
    )
    args = parser.parse_args()
    prepared = prepare_forecast_features(args.data)
    print("TAHAP 1 BERHASIL — INPUT MODEL SIAP")
    print(f"Kabupaten: {len(prepared)} | Fitur: {len(MODEL_FEATURES)} "
          f"({len(NUMERIC_FEATURES)} numerik + 1 kategorikal)")
    print("Basis NCPR: FSVA 2026 metode baru | Target berikutnya: FSVA 2027")
    print("Produksi: pertumbuhan Januari–April 2026 dibanding 2025")
    print("Contoh data (belum berupa hasil prediksi):")
    print(prepared[["kode_bps", "kab_kota", "ncpr", *PRODUCTION_FEATURES]].head(3).to_string(index=False))


if __name__ == "__main__":
    main()

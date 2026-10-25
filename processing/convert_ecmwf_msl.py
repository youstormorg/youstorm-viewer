import sys
from pathlib import Path

import numpy as np
import xarray as xr


EXPECTED_SHAPE = (721, 1440)
FORECAST_HOURS = list(range(0, 145, 3))
EXPECTED_SIZE = EXPECTED_SHAPE[0] * EXPECTED_SHAPE[1] * 2


def convert_msl(input_file, output_file):
    """Convert ECMWF mean sea-level pressure to tenths of hPa."""

    input_file = Path(input_file)
    output_file = Path(output_file)

    with xr.open_dataset(input_file, engine="cfgrib") as ds:
        if "msl" not in ds.data_vars:
            raise RuntimeError(
                f"Missing msl field in {input_file}"
            )

        if ds["msl"].attrs.get("units") != "Pa":
            raise RuntimeError(
                f"Expected pressure units of Pa in {input_file}"
            )

        pressure_pa = ds["msl"].values.astype(np.float64)

    if pressure_pa.shape != EXPECTED_SHAPE:
        raise RuntimeError(
            f"Unexpected grid shape in {input_file}: "
            f"{pressure_pa.shape}"
        )

    if not np.isfinite(pressure_pa).all():
        raise RuntimeError(
            f"Non-finite pressure values in {input_file}"
        )

    # Pa / 10 = tenths of hPa.
    scaled_pressure = np.rint(pressure_pa / 10)

    limits = np.iinfo(np.int16)
    if (
        scaled_pressure.min() < limits.min
        or scaled_pressure.max() > limits.max
    ):
        raise RuntimeError(
            f"Pressure values exceed int16 encoding range "
            f"in {input_file}"
        )

    binary_pressure = scaled_pressure.astype("<i2")
    binary_pressure.tofile(output_file)

    if output_file.stat().st_size != EXPECTED_SIZE:
        raise RuntimeError(
            f"Unexpected binary size: {output_file}"
        )

    print(f"Created {output_file}")


def main():
    if len(sys.argv) not in (1, 2):
        print(
            "Usage: python convert_ecmwf_msl.py [DATA_DIR]"
        )
        sys.exit(1)

    data_dir = Path(
        sys.argv[1] if len(sys.argv) == 2 else "data/ecmwf"
    )

    for forecast_hour in FORECAST_HOURS:
        hour = f"{forecast_hour:03d}"

        input_file = data_dir / f"ecmwf_msl_f{hour}.grib2"
        output_file = data_dir / f"ecmwf_msl_f{hour}.bin"

        print(
            f"Converting ECMWF mean sea-level pressure "
            f"+{hour} h"
        )
        convert_msl(input_file, output_file)

    print()
    print("All ECMWF pressure conversions complete")


if __name__ == "__main__":
    main()
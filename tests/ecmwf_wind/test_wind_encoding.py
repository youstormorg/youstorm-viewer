from pathlib import Path

import numpy as np
import xarray as xr

data_dir = Path("tests/ecmwf_wind/downloads")
expected_shape = (721, 1440)

for component, variable_name in (("10u", "u10"), ("10v", "v10")):
    filename = data_dir / f"ecmwf_{component}_f000.grib2"

    with xr.open_dataset(filename, engine="cfgrib") as ds:
        wind = ds[variable_name].values

        if wind.shape != expected_shape:
            raise RuntimeError(
                f"Unexpected grid shape for {component}: {wind.shape}"
            )

        encoded = np.rint(wind * 10).astype(np.int16)
        decoded = encoded.astype(np.float32) / 10

        error = np.abs(decoded - wind)

        print(f"\n{component}:")
        print(f"  Grid shape: {wind.shape}")
        print(f"  Binary size: {encoded.nbytes:,} bytes")
        print(f"  Original range: {wind.min():.2f} to {wind.max():.2f} m/s")
        print(f"  Maximum rounding error: {error.max():.4f} m/s")

        if encoded.nbytes != 2_076_480:
            raise RuntimeError(f"Unexpected binary size for {component}")

        if error.max() > 0.051:
            raise RuntimeError(f"Unexpected encoding error for {component}")

print("\nBoth wind components passed the encoding checks.")
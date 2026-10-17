import xarray as xr
import sys
import numpy as np
from pathlib import Path

if len(sys.argv) not in (2, 3):
    print(
        "Usage: python convert_ecmwf_total_precip_u16.py "
        "FORECAST_HOUR [DATA_DIR]"
    )
    sys.exit(1)

forecast_hour = int(sys.argv[1])

if forecast_hour < 3 or forecast_hour > 144 or forecast_hour % 3 != 0:
    raise ValueError(
        "FORECAST_HOUR must be a multiple of 3 from 3 to 144"
    )

data_dir = Path(
    sys.argv[2] if len(sys.argv) == 3 else "data/ecmwf"
)

input_file = (
    data_dir / f"ecmwf_tp_f{forecast_hour:03d}.grib2"
)

output_file = (
    data_dir /
    f"ecmwf_precip_total_f{forecast_hour:03d}_u16.bin"
)

with xr.open_dataset(
    input_file,
    engine="cfgrib",
    backend_kwargs={
        "read_keys": ["startStep", "endStep"]
    }
) as ds:
    precipitation = ds["tp"].values.copy()
    start_step = int(ds["tp"].attrs["GRIB_startStep"])
    end_step = int(ds["tp"].attrs["GRIB_endStep"])

if start_step != 0 or end_step != forecast_hour:
    raise RuntimeError(
        f"Expected cumulative period 0-{forecast_hour} h, "
        f"but found {start_step}-{end_step} h"
    )

# ECMWF total precipitation is in metres. Convert to millimetres.
precipitation = precipitation * 1000
precipitation = precipitation.clip(min=0)

if not np.isfinite(precipitation).all():
    raise ValueError("Precipitation contains non-finite values")

if (precipitation > 6553.4).any():
    raise ValueError("Precipitation exceeds uint16 encoding range")

# Store precipitation in 0.1 mm increments.
# 65535 remains reserved as the missing-value code.
packed_precipitation = (
    precipitation * 10
).round().astype("uint16")

packed_precipitation.tofile(output_file)

print("Cumulative precipitation binary created")
print("---------------------------------------")
print(f"Forecast: +{forecast_hour:03d} h")
print(f"Accumulation: {start_step}-{end_step} h")
print(f"Input:  {input_file}")
print(f"Output: {output_file}")
print(f"Grid: {precipitation.shape[0]} x {precipitation.shape[1]}")
print(f"Minimum: {precipitation.min():.2f} mm")
print(f"Maximum: {precipitation.max():.2f} mm")
print(f"Mean: {precipitation.mean():.2f} mm")
print(f"Binary size: {output_file.stat().st_size:,} bytes")

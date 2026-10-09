import xarray as xr
import sys
import numpy as np

if len(sys.argv) != 2:

    print(
        "Usage: python convert_precip_binary.py FORECAST_HOUR"
    )

    sys.exit(1)


forecast_hour = int(sys.argv[1])


input_file = (
    f"data/gfs/"
    f"gfs_precip_global_f{forecast_hour:03d}.grib2"
)


output_file = (
    f"data/gfs/"
    f"gfs_precip_global_f{forecast_hour:03d}_u16.bin"
)


ds = xr.open_dataset(
    input_file,
    engine="cfgrib",
    backend_kwargs={
        "read_keys": [
            "startStep",
            "endStep"
        ]
    }
)


precipitation = ds["tp"].values


start_step = int(
    ds["tp"].attrs["GRIB_startStep"]
)

end_step = int(
    ds["tp"].attrs["GRIB_endStep"]
)


if end_step - start_step == 6:

    previous_hour = forecast_hour - 3

    previous_file = (
        f"data/gfs/"
        f"gfs_precip_global_f{previous_hour:03d}.grib2"
    )

    previous_ds = xr.open_dataset(
        previous_file,
        engine="cfgrib"
    )

    previous_precipitation = (
        previous_ds["tp"].values
    )

    precipitation = (
        precipitation -
        previous_precipitation
    )


print(
    f"Accumulation: {start_step}-{end_step} h"
)

print(
    f"Output field: {forecast_hour - 3}-{forecast_hour} h"
)

# Pack precipitation in 0.1 mm increments.
# Reserve 65535 as the missing-value code.

if not np.isfinite(precipitation).all():
    raise ValueError("Precipitation contains non-finite values")

if (precipitation < 0).any():
    raise ValueError("Precipitation contains negative values")

if (precipitation > 6553.4).any():
    raise ValueError("Precipitation exceeds uint16 encoding range")

packed_precipitation = (
    precipitation * 10
).round().astype("uint16")

packed_precipitation.tofile(output_file)


print(
    "Precipitation binary created"
)

print(
    "---------------------------"
)

print(
    f"Forecast: +{forecast_hour:03d} h"
)

print(
    f"Input:    {input_file}"
)

print(
    f"Binary:   {output_file}"
)

print(
    f"Grid:     {precipitation.shape[0]} x "
    f"{precipitation.shape[1]}"
)

print(
    f"Min:      {precipitation.min()} mm"
)

print(
    f"Max:      {precipitation.max()} mm"
)

print(
    f"Dtype:    {precipitation.dtype}"
)
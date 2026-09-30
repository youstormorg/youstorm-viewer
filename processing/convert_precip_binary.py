import xarray as xr
import sys


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
    f"gfs_precip_global_f{forecast_hour:03d}.bin"
)


ds = xr.open_dataset(
    input_file,
    engine="cfgrib"
)


precipitation = ds["tp"].values


precipitation.tofile(
    output_file
)


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
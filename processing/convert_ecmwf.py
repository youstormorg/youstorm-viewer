import xarray as xr

forecast_hours = list(
    range(0, 145, 3)
)

for forecast_hour in forecast_hours:

    print()
    print(
        f"Converting ECMWF +{forecast_hour:03d} h"
    )

    input_file = (
        f"data/ecmwf/"
        f"ecmwf_2t_f{forecast_hour:03d}.grib2"
    )

    binary_output_file = (
        f"data/ecmwf/"
        f"ecmwf_2t_f{forecast_hour:03d}.bin"
    )

    ds = xr.open_dataset(
        input_file,
        engine="cfgrib"
    )

    temperature = ds["t2m"] - 273.15

    binary_temperature = \
        (temperature.values * 10).round().astype("int16")

    binary_temperature.tofile(
        binary_output_file
    )

    print(
        f"Created {binary_output_file}"
    )
print()
print("All ECMWF conversions complete")
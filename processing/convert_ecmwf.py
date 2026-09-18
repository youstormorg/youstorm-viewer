import xarray as xr
import json

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

    output_file = (
        f"data/ecmwf/"
        f"ecmwf_2t_f{forecast_hour:03d}.json"
    )

    ds = xr.open_dataset(
        input_file,
        engine="cfgrib"
    )

    temperature = ds["t2m"] - 273.15

    output = {
        "model": "ECMWF",
        "variable": "temperature",
        "forecast_hour": forecast_hour,
        "initialisation":
            str(ds["time"].values)[:19] + "Z",
        "valid_time":
            str(ds["valid_time"].values)[:19] + "Z",
        "latitude":
            ds["latitude"].values.tolist(),
        "longitude":
            ds["longitude"].values.tolist(),
        "values":
            temperature.values.tolist()
    }

    with open(
        output_file,
        "w"
    ) as f:
        json.dump(
            output,
            f
        )

    print(
        f"Created {output_file}"
    )

print()
print("All ECMWF conversions complete")
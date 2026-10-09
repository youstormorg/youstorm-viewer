import subprocess
import json
import xarray as xr
from pathlib import Path

forecast_hours = list(
    range(0, 145, 3)
)

precipitation_hours = list(
    range(3, 145, 3)
)


for forecast_hour in forecast_hours:

    print()
    print(
        f"Converting temperature +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/convert_gfs.py",
            str(forecast_hour)
        ],
        check=True
    )


for forecast_hour in precipitation_hours:

    print()
    print(
        f"Converting precipitation +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/convert_precip_binary.py",
            str(forecast_hour)
        ],
        check=True
    )
    subprocess.run(
        [
            "python",
            "processing/convert_precip_binary_u16.py",
            str(forecast_hour)
        ],
        check=True
    )    

precipitation_metadata = []

for forecast_hour in precipitation_hours:

    input_file = (
        Path("data/gfs")
        / f"gfs_precip_global_f{forecast_hour:03d}.grib2"
    )

    with xr.open_dataset(
        input_file,
        engine="cfgrib"
    ) as ds:

        precipitation_metadata.append(
            {
                "forecast_hour": forecast_hour,
                "initialisation":
                    str(ds["time"].values)[:19] + "Z",
                "valid_time":
                    str(ds["valid_time"].values)[:19] + "Z"
            }
        )

print()
print("Creating GFS metadata")

temperature_metadata = []

for forecast_hour in forecast_hours:

    input_file = (
        Path("data/gfs")
        / f"gfs_temp_global_f{forecast_hour:03d}.grib2"
    )

    with xr.open_dataset(
        input_file,
        engine="cfgrib"
    ) as ds:

        temperature_metadata.append(
            {
                "forecast_hour": forecast_hour,
                "initialisation":
                    str(ds["time"].values)[:19] + "Z",
                "valid_time":
                    str(ds["valid_time"].values)[:19] + "Z"
            }
        )


temperature_metadata_file = (
    Path("data/gfs")
    / "gfs_temperature_metadata.json"
)

temperature_metadata_file.write_text(
    json.dumps(
        temperature_metadata,
        indent=2
    ),
    encoding="utf-8"
)

precipitation_metadata_file = (
    Path("data/gfs")
    / "gfs_precipitation_metadata.json"
)

precipitation_metadata_file.write_text(
    json.dumps(
        precipitation_metadata,
        indent=2
    ),
    encoding="utf-8"
)

print()
print(
    "Created GFS temperature metadata: "
    f"{temperature_metadata_file}"
)

print(
    "Created GFS precipitation metadata: "
    f"{precipitation_metadata_file}"
)

print()
print("All GFS conversions complete")
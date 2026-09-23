import subprocess
import json
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
            "processing/convert_precip.py",
            str(forecast_hour)
        ],
        check=True
    )


print()
print("Creating GFS metadata")

temperature_metadata = []

for forecast_hour in forecast_hours:

    input_file = (
        Path("data/gfs")
        / f"gfs_temp_global_f{forecast_hour:03d}.json"
    )

    with input_file.open(
        "r",
        encoding="utf-8"
    ) as f:

        data = json.load(f)

    temperature_metadata.append(
        {
            "forecast_hour": data["forecast_hour"],
            "initialisation": data["initialisation"],
            "valid_time": data["valid_time"]
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


precipitation_metadata = []

for forecast_hour in precipitation_hours:

    input_file = (
        Path("data/gfs")
        / f"gfs_precip_global_f{forecast_hour:03d}.json"
    )

    with input_file.open(
        "r",
        encoding="utf-8"
    ) as f:

        data = json.load(f)

    precipitation_metadata.append(
        {
            "forecast_hour": data["forecast_hour"],
            "initialisation": data["initialisation"],
            "valid_time": data["valid_time"]
        }
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
import json
import sys
import xarray as xr
from pathlib import Path


if len(sys.argv) not in (1, 2):
    print(
        "Usage: python create_ecmwf_precip_metadata.py [DATA_DIR]"
    )
    sys.exit(1)


data_dir = Path(
    sys.argv[1]
    if len(sys.argv) == 2
    else "data/ecmwf"
)


precipitation_hours = list(
    range(3, 145, 3)
)

metadata = []


for forecast_hour in precipitation_hours:

    hour = f"{forecast_hour:03d}"

    input_file = (
        data_dir
        / f"ecmwf_tp_f{hour}.grib2"
    )

    print(
        f"Reading ECMWF precipitation +{hour} h"
    )

    with xr.open_dataset(
        input_file,
        engine="cfgrib"
    ) as ds:

        initialisation = (
            str(ds["time"].values)[:19]
            + "Z"
        )

        valid = (
            str(ds["valid_time"].values)[:19]
            + "Z"
        )

    metadata.append(
        {
            "model": "ECMWF",
            "variable": "precipitation",
            "forecast_hour": forecast_hour,
            "initialisation": initialisation,
            "valid_time": valid
        }
    )


output_file = (
    data_dir
    / "ecmwf_precipitation_metadata.json"
)


with open(
    output_file,
    "w"
) as f:

    json.dump(
        metadata,
        f,
        indent=2
    )


print()
print(
    f"Created {output_file}"
)

print(
    f"Forecasts: {len(metadata)}"
)
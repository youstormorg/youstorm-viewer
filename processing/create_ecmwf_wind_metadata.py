import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from eccodes import (
    codes_grib_new_from_file,
    codes_get,
    codes_release,
)


if len(sys.argv) not in (1, 2):
    print(
        "Usage: python create_ecmwf_wind_metadata.py [DATA_DIR]"
    )
    sys.exit(1)


data_dir = Path(
    sys.argv[1]
    if len(sys.argv) == 2
    else "data/ecmwf"
)

forecast_hours = list(range(0, 145, 3))
metadata = []


for forecast_hour in forecast_hours:
    hour = f"{forecast_hour:03d}"
    input_file = data_dir / f"ecmwf_10u_f{hour}.grib2"

    print(f"Reading ECMWF wind +{hour} h")

    with input_file.open("rb") as f:
        gid = codes_grib_new_from_file(f)

        if gid is None:
            raise RuntimeError(
                f"Could not read GRIB metadata from {input_file}"
            )

        try:
            data_date = codes_get(gid, "dataDate")
            data_time = codes_get(gid, "dataTime")
            forecast_step = codes_get(gid, "step")
            step_units = codes_get(gid, "stepUnits")
        finally:
            codes_release(gid)

    if step_units != 1:
        raise RuntimeError(
            f"Unexpected ECMWF step units in {input_file}: "
            f"{step_units}"
        )

    initialisation = datetime(
        data_date // 10000,
        (data_date // 100) % 100,
        data_date % 100,
        data_time // 100,
        data_time % 100,
        tzinfo=timezone.utc,
    )

    valid = initialisation + timedelta(hours=forecast_step)

    metadata.append({
        "model": "ECMWF",
        "variable": "wind_10m",
        "forecast_hour": forecast_hour,
        "initialisation": initialisation.strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
        "valid_time": valid.strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        ),
    })


output_file = data_dir / "ecmwf_wind_metadata.json"

with output_file.open("w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print()
print(f"Created {output_file}")
print(f"Forecasts: {len(metadata)}")

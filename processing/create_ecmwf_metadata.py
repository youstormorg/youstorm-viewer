import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from eccodes import (
    codes_grib_new_from_file,
    codes_get,
    codes_release,
)


forecast_hours = list(
    range(0, 145, 3)
)


metadata = []


for forecast_hour in forecast_hours:

    hour = f"{forecast_hour:03d}"

    input_file = (
        Path("data/ecmwf")
        / f"ecmwf_2t_f{hour}.grib2"
    )

    print(
        f"Reading ECMWF +{hour} h"
    )

    with open(input_file, "rb") as f:

        gid = codes_grib_new_from_file(f)

        if gid is None:
            raise RuntimeError(
                f"Could not read GRIB metadata from {input_file}"
            )

        data_date = codes_get(
            gid,
            "dataDate"
        )

        data_time = codes_get(
            gid,
            "dataTime"
        )

        forecast_step = codes_get(
            gid,
            "step"
        )

        step_units = codes_get(
            gid,
            "stepUnits"
        )

        codes_release(gid)

    if step_units != 1:
        raise RuntimeError(
            f"Unexpected ECMWF step units for {input_file}: "
            f"{step_units}"
        )

    initialisation = datetime(
        data_date // 10000,
        (data_date // 100) % 100,
        data_date % 100,
        data_time // 100,
        data_time % 100,
        tzinfo=timezone.utc
    )

    valid = (
        initialisation
        + timedelta(
            hours=forecast_step
        )
    )

    metadata.append(
        {
            "model": "ECMWF",
            "variable": "temperature_2m",
            "forecast_hour": forecast_hour,
            "initialisation":
                initialisation.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
            "valid_time":
                valid.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                )
        }
    )


output_file = (
    Path("data/ecmwf")
    / "ecmwf_temperature_metadata.json"
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
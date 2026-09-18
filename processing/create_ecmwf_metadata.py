import subprocess
import re
import json
from pathlib import Path


gdalinfo = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin"
    r"\gdalinfo.exe"
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

    result = subprocess.run(
        [
            gdalinfo,
            str(input_file)
        ],
        capture_output=True,
        text=True,
        check=True
    )

    output = result.stdout

    ref_time = re.search(
        r"REF_TIME=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)",
        output
    )

    forecast_seconds = re.search(
        r"GRIB_FORECAST_SECONDS=(\d+)",
        output
    )

    if not ref_time or not forecast_seconds:
        raise RuntimeError(
            f"Could not read metadata from {input_file}"
        )

    valid_time = (
        ref_time.group(1)
    )

    # Add forecast duration to initialisation time
    from datetime import datetime, timedelta

    initialisation = datetime.fromisoformat(
        ref_time.group(1).replace("Z", "+00:00")
    )

    valid = (
        initialisation
        + timedelta(
            seconds=int(forecast_seconds.group(1))
        )
    )

    metadata.append(
        {
            "model": "ECMWF",
            "variable": "temperature_2m",
            "forecast_hour": forecast_hour,
            "initialisation":
                ref_time.group(1),
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
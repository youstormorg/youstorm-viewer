
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from eccodes import (
    codes_grib_new_from_file,
    codes_get,
    codes_release,
)


def main():
    if len(sys.argv) not in (1, 2):
        print(
            "Usage: python create_ecmwf_msl_metadata.py [DATA_DIR]"
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

        input_file = (
            data_dir
            / f"ecmwf_msl_f{hour}.grib2"
        )

        print(
            f"Reading ECMWF mean sea-level pressure +{hour} h"
        )

        with open(input_file, "rb") as f:
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
                short_name = codes_get(gid, "shortName")
                parameter_id = codes_get(gid, "paramId")
            finally:
                codes_release(gid)

        if short_name != "msl" or parameter_id != 151:
            raise RuntimeError(
                f"Unexpected GRIB parameter in {input_file}: "
                f"shortName={short_name}, paramId={parameter_id}"
            )

        if step_units != 1:
            raise RuntimeError(
                f"Unexpected ECMWF step units for {input_file}: "
                f"{step_units}"
            )

        if forecast_step != forecast_hour:
            raise RuntimeError(
                f"Forecast step mismatch in {input_file}: "
                f"expected {forecast_hour}, got {forecast_step}"
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

        metadata.append(
            {
                "model": "ECMWF",
                "variable": "mean_sea_level_pressure",
                "forecast_hour": forecast_hour,
                "initialisation": initialisation.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
                "valid_time": valid.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
            }
        )

    output_file = data_dir / "ecmwf_msl_metadata.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print()
    print(f"Created {output_file}")
    print(f"Forecasts: {len(metadata)}")


if __name__ == "__main__":
    main()

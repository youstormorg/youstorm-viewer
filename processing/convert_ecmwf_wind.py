import sys
from pathlib import Path

import numpy as np
import xarray as xr


if len(sys.argv) not in (1, 2):
    print(
        "Usage: python convert_ecmwf_wind.py [DATA_DIR]"
    )
    sys.exit(1)


data_dir = Path(
    sys.argv[1]
    if len(sys.argv) == 2
    else "data/ecmwf"
)

forecast_hours = list(range(0, 145, 3))

wind_components = {
    "10u": "u10",
    "10v": "v10",
}

expected_shape = (721, 1440)


for forecast_hour in forecast_hours:
    hour = f"{forecast_hour:03d}"

    for component, variable_name in wind_components.items():
        input_file = (
            data_dir
            / f"ecmwf_{component}_f{hour}.grib2"
        )

        binary_output_file = (
            data_dir
            / f"ecmwf_{component}_f{hour}.bin"
        )

        print(
            f"Converting ECMWF {component} "
            f"+{hour} h"
        )

        with xr.open_dataset(
            input_file,
            engine="cfgrib"
        ) as ds:
            wind = ds[variable_name].values

            if wind.shape != expected_shape:
                raise RuntimeError(
                    f"Unexpected grid shape in {input_file}: "
                    f"{wind.shape}"
                )

            if not np.isfinite(wind).all():
                raise RuntimeError(
                    f"Non-finite wind values in {input_file}"
                )

            scaled_wind = np.rint(wind * 10)

            limits = np.iinfo(np.int16)
            if (
                scaled_wind.min() < limits.min
                or scaled_wind.max() > limits.max
            ):
                raise RuntimeError(
                    f"Wind values exceed int16 encoding range "
                    f"in {input_file}"
                )

            binary_wind = scaled_wind.astype("<i2")

            binary_wind.tofile(
                binary_output_file
            )

        expected_size = (
            expected_shape[0]
            * expected_shape[1]
            * 2
        )

        if binary_output_file.stat().st_size != expected_size:
            raise RuntimeError(
                f"Unexpected binary size: {binary_output_file}"
            )

        print(
            f"Created {binary_output_file}"
        )


print()
print("All ECMWF wind conversions complete")

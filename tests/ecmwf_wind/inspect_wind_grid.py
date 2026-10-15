from pathlib import Path

import xarray as xr

for component in ("10u", "10v"):
    filename = (
        Path("tests/ecmwf_wind/downloads")
        / f"ecmwf_{component}_f000.grib2"
    )

    print(f"\nInspecting {component}: {filename}")

    with xr.open_dataset(filename, engine="cfgrib") as ds:
        print("Dimensions:", dict(ds.sizes))
        print("Coordinates:", list(ds.coords))

        for name, variable in ds.data_vars.items():
            print(
                f"Variable: {name}, "
                f"shape: {variable.shape}, "
                f"units: {variable.attrs.get('units')}"
            )

        for name in ("latitude", "longitude"):
            if name in ds.coords:
                values = ds[name].values
                print(
                    f"{name}: shape={values.shape}, "
                    f"first={values.flat[0]}, "
                    f"last={values.flat[-1]}"
                )

print("\nGrid inspection complete.")
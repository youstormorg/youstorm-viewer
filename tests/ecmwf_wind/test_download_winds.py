from pathlib import Path

from ecmwf.opendata import Client
from eccodes import (
    codes_grib_new_from_file,
    codes_get,
    codes_release,
)

output_dir = Path("tests/ecmwf_wind/downloads")
output_dir.mkdir(parents=True, exist_ok=True)

client = Client(source="google")

for component in ("10u", "10v"):
    output_file = output_dir / f"ecmwf_{component}_f000.grib2"

    print(f"Downloading {component} at forecast hour +000...")

    client.retrieve(
        type="fc",
        stream="oper",
        levtype="sfc",
        param=component,
        step=0,
        target=str(output_file),
    )

    if not output_file.is_file() or output_file.stat().st_size == 0:
        raise RuntimeError(f"Missing or empty file: {output_file}")

    with output_file.open("rb") as f:
        gid = codes_grib_new_from_file(f)

        if gid is None:
            raise RuntimeError(f"Could not read GRIB file: {output_file}")

        try:
            print(
                f"Verified {component}: "
                f"shortName={codes_get(gid, 'shortName')}, "
                f"step={codes_get(gid, 'step')}, "
                f"file size={output_file.stat().st_size:,} bytes"
            )
        finally:
            codes_release(gid)

print("Both wind component downloads passed the basic checks.")
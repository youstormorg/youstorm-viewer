import subprocess
import sys

if len(sys.argv) not in (1, 2):
    print(
        "Usage: python convert_all_ecmwf_precip.py [DATA_DIR]"
    )
    sys.exit(1)

precipitation_hours = list(
    range(3, 145, 3)
)

data_dir = (
    sys.argv[1]
    if len(sys.argv) == 2
    else "data/ecmwf"
)

for forecast_hour in precipitation_hours:

    print()
    print(
        f"Converting ECMWF precipitation "
        f"+{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            sys.executable,
            "processing/convert_ecmwf_precip_u16.py",
            str(forecast_hour),
            data_dir
        ],
        check=True
    )


print()
print(
    "All ECMWF precipitation conversions complete"
)
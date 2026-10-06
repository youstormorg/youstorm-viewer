import subprocess


precipitation_hours = list(
    range(3, 145, 3)
)


for forecast_hour in precipitation_hours:

    print()
    print(
        f"Converting ECMWF precipitation "
        f"+{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/convert_ecmwf_precip.py",
            str(forecast_hour)
        ],
        check=True
    )


print()
print(
    "All ECMWF precipitation conversions complete"
)
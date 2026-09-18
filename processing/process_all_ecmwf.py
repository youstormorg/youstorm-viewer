import subprocess


forecast_hours = list(
    range(0, 145, 3)
)


for forecast_hour in forecast_hours:

    print()
    print(
        f"Processing ECMWF +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/process_ecmwf.py",
            str(forecast_hour)
        ],
        check=True
    )


print()
print("Selected ECMWF processing complete")
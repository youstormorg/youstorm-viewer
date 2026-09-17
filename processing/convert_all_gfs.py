import subprocess


forecast_hours = [
    0, 3, 6, 9, 12, 15, 18, 21, 24
]


precipitation_hours = [
    3, 6, 9, 12, 15, 18, 21, 24
]


for forecast_hour in forecast_hours:

    print()
    print(
        f"Converting temperature +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/convert_gfs.py",
            str(forecast_hour)
        ],
        check=True
    )


for forecast_hour in precipitation_hours:

    print()
    print(
        f"Converting precipitation +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/convert_precip.py",
            str(forecast_hour)
        ],
        check=True
    )


print()
print("All GFS conversions complete")
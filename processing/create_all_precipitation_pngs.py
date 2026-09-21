import subprocess


forecast_hours = list(
    range(3, 145, 3)
)

for forecast_hour in forecast_hours:

    input_file = (
        f"data/gfs/gfs_precip_global_f{forecast_hour:03d}.json"
    )

    output_file = (
        f"data/gfs/precipitation_f{forecast_hour:03d}.png"
    )

    print()
    print(
        f"Creating precipitation PNG +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/create_precipitation_png.py",
            input_file,
            output_file
        ],
        check=True
    )


print()
print("All precipitation PNGs created")
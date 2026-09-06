import subprocess


forecast_hours = [
    0, 3, 6, 9, 12, 15, 18, 21, 24
]


for forecast_hour in forecast_hours:

    input_file = (
        f"data/gfs/gfs_temp_global_f{forecast_hour:03d}.json"
    )

    output_file = (
        f"data/gfs/temperature_f{forecast_hour:03d}.png"
    )

    print()
    print(
        f"Creating temperature PNG +{forecast_hour:03d} h"
    )

    subprocess.run(
        [
            "python",
            "processing/create_temperature_png.py",
            input_file,
            output_file
        ],
        check=True
    )


print()
print("All temperature PNGs created")
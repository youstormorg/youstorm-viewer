import subprocess
import shutil
import os

gdal_translate = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin\gdal_translate.exe"
)

gdalwarp = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin\gdalwarp.exe"
)

gdal = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin\gdal.exe"
)


forecast_hours = [
    0, 3, 6, 9, 12, 15, 18, 21, 24
]


for forecast_hour in forecast_hours:

    suffix = (
        f"f{forecast_hour:03d}"
    )

    png_file = (
        f"data/gfs/temperature_{suffix}.png"
    )

    wgs84_file = (
        f"data/gfs/temperature_{suffix}_wgs84_auto.tif"
    )

    webmercator_file = (
        f"data/gfs/temperature_{suffix}_webmercator_auto.tif"
    )

    tile_folder = (
        f"data/gfs/temperature_tiles_{suffix}_auto"
    )


    print()
    print("================================")
    print(f"Processing +{forecast_hour:03d} h")
    print("================================")


    # ----------------------------------------------
    # PNG → WGS84 GeoTIFF
    # ----------------------------------------------

    print()
    print("PNG → WGS84 GeoTIFF")

    result = subprocess.run(
        [
            gdal_translate,
            "-of", "GTiff",
            "-a_srs", "EPSG:4326",
            "-a_ullr",
            "-180", "90",
            "180", "-90",
            png_file,
            wgs84_file
        ],
        capture_output=True,
        text=True
    )

    print(result.stdout)
    print(result.stderr)

    if result.returncode != 0:
        raise RuntimeError(
            f"PNG → WGS84 failed for +{forecast_hour:03d} h"
        )

    # Remove old Web Mercator file before regenerating
    if os.path.exists(webmercator_file):
        os.remove(webmercator_file)
    # ----------------------------------------------
    # WGS84 → Web Mercator
    # ----------------------------------------------

    print()
    print("WGS84 → Web Mercator")

    result = subprocess.run(
        [
            gdalwarp,
            "-s_srs", "EPSG:4326",
            "-t_srs", "EPSG:3857",
            "-r", "near",
            wgs84_file,
            webmercator_file
        ],
        capture_output=True,
        text=True
    )

    print(result.stdout)
    print(result.stderr)

    if result.returncode != 0:
        raise RuntimeError(
            f"WGS84 → Web Mercator failed for +{forecast_hour:03d} h"
        )


    # ----------------------------------------------
    # Web Mercator → XYZ tiles
    # ----------------------------------------------

    print()
    print("Web Mercator → XYZ tiles")
    # Remove old tiles before regenerating
    if os.path.exists(tile_folder):
        shutil.rmtree(tile_folder)
    result = subprocess.run(
        [
            gdal,
            "raster",
            "tile",
            webmercator_file,
            "--output", tile_folder,
            "--tiling-scheme", "WebMercatorQuad",
            "--min-zoom", "2",
            "--max-zoom", "4",
            "--resampling", "nearest"
        ],
        capture_output=True,
        text=True
    )

    print(result.stdout)
    print(result.stderr)

    if result.returncode != 0:
        raise RuntimeError(
            f"Tile generation failed for +{forecast_hour:03d} h"
        )


    print()
    print(f"+{forecast_hour:03d} h complete")


print()
print("================================")
print("ALL GFS GDAL PROCESSING COMPLETE")
print("================================")
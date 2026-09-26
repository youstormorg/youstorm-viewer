import subprocess
import shutil
import os
import time
import json 

gdal_translate = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin\gdal_translate.exe"
)

gdalwarp = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin\gdalwarp.exe"
)

gdal = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin\gdal.exe"
)


forecast_hours = list(
    range(0, 145, 3)
)

precipitation_hours = list(
    range(3, 145, 3)
)

temperature_start_time = time.perf_counter()

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

    start_time = time.perf_counter()

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

    elapsed = time.perf_counter() - start_time
    print(f"PNG → WGS84 took {elapsed:.3f} seconds")

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
    start_time = time.perf_counter()

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

    elapsed = time.perf_counter() - start_time
    print(f"WGS84 → Web Mercator took {elapsed:.3f} seconds")

    if result.returncode != 0:
        raise RuntimeError(
            f"WGS84 → Web Mercator failed for +{forecast_hour:03d} h"
        )


    # ----------------------------------------------
    # Web Mercator → XYZ tiles
    # ----------------------------------------------

    print()
    print("Web Mercator → XYZ tiles")

    start_time = time.perf_counter()

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

    elapsed = time.perf_counter() - start_time
    print(f"Web Mercator → XYZ tiles took {elapsed:.3f} seconds")

    if result.returncode != 0:
        raise RuntimeError(
            f"Tile generation failed for +{forecast_hour:03d} h"
        )


    print()
    print(f"+{forecast_hour:03d} h complete")

temperature_elapsed = time.perf_counter() - temperature_start_time

print()
print(
    f"Total temperature tile processing: "
    f"{temperature_elapsed / 60:.2f} minutes"
)

# ==================================================
# Process precipitation
# ==================================================

precipitation_start_time = time.perf_counter()

for forecast_hour in precipitation_hours:

    suffix = (
        f"f{forecast_hour:03d}"
    )

    png_file = (
        f"data/gfs/precipitation_{suffix}.png"
    )

    wgs84_file = (
        f"data/gfs/precipitation_{suffix}_wgs84_auto.tif"
    )

    webmercator_file = (
        f"data/gfs/precipitation_{suffix}_webmercator_auto.tif"
    )

    tile_folder = (
        f"data/gfs/precipitation_tiles_{suffix}_auto"
    )


    print()
    print("================================")
    print(f"Processing precipitation +{forecast_hour:03d} h")
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
            f"Precipitation PNG → WGS84 failed for +{forecast_hour:03d} h"
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
            f"Precipitation WGS84 → Web Mercator failed for +{forecast_hour:03d} h"
        )


    # ----------------------------------------------
    # Web Mercator → XYZ tiles
    # ----------------------------------------------

    print()
    print("Web Mercator → XYZ tiles")

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
            f"Precipitation tile generation failed for +{forecast_hour:03d} h"
        )


    print()
    print(f"Precipitation +{forecast_hour:03d} h complete")

precipitation_elapsed = time.perf_counter() - precipitation_start_time

print()
print(
    f"Total precipitation tile processing: "
    f"{precipitation_elapsed / 60:.2f} minutes"
)

print()
print("================================")
print("ALL GFS GDAL PROCESSING COMPLETE")
print("================================")

gdal_timing_file = "processing/.gdal_timing.json"

with open(gdal_timing_file, "w") as f:

    json.dump(
        {
            "temperature": temperature_elapsed,
            "precipitation": precipitation_elapsed
        },
        f
    )
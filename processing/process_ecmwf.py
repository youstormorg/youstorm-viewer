import subprocess
import sys
from pathlib import Path


gdal_translate = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin"
    r"\gdal_translate.exe"
)

gdalwarp = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin"
    r"\gdalwarp.exe"
)

gdal = (
    r"C:\Users\youstorm\AppData\Local\Programs\OSGeo4W\bin"
    r"\gdal.exe"
)


if len(sys.argv) != 2:
    print("Usage:")
    print("python process_ecmwf.py FORECAST_HOUR")
    sys.exit(1)


forecast_hour = int(sys.argv[1])

hour = f"{forecast_hour:03d}"

input_file = (
    Path("data/ecmwf")
    / f"ecmwf_2t_f{hour}.grib2"
)

wgs84_file = (
    Path("data/ecmwf")
    / f"ecmwf_2t_f{hour}_wgs84.tif"
)

webmercator_file = (
    Path("data/ecmwf")
    / f"ecmwf_2t_f{hour}_webmercator.tif"
)

colored_file = (
    Path("data/ecmwf")
    / f"ecmwf_2t_f{hour}_colored.tif"
)

tile_folder = (
    Path("data/ecmwf")
    / f"ecmwf_temperature_tiles_f{hour}_auto"
)
if tile_folder.exists():
    import shutil
    shutil.rmtree(tile_folder)

print()
print(f"Processing ECMWF +{hour} h")
print()


print("Step 1: GRIB2 → GeoTIFF")

subprocess.run(
    [
        gdal_translate,
        "-of",
        "GTiff",
        str(input_file),
        str(wgs84_file)
    ],
    check=True
)

print()
print("Step 2: Kelvin → Celsius")

celsius_file = (
    Path("data/ecmwf")
    / f"ecmwf_2t_f{hour}_celsius.tif"
)

subprocess.run(
    [
        gdal_translate,
        "-scale",
        "0",
        "1",
        "-273.15",
        "-272.15",
        "-ot",
        "Float32",
        str(wgs84_file),
        str(celsius_file)
    ],
    check=True
)

print()
print("Step 2: Celsius → Web Mercator")

subprocess.run(
    [
        gdalwarp,
        "-t_srs",
        "EPSG:3857",
        "-overwrite",
       "-te_srs",
        "EPSG:4326",
        "-te",
        "-180",
        "-85",
        "180",
        "85",
        str(celsius_file),
        str(webmercator_file)
    ],
    check=True
)


print()
print("Step 3: Apply temperature colours")

subprocess.run(
    [
        gdal,
        "raster",
        "color-map",
        "--color-map",
        "data/ecmwf/ecmwf_temperature.txt",
        "--add-alpha",
        "--overwrite",
        "-f",
        "GTiff",
        str(webmercator_file),
        str(colored_file)
    ],
    check=True
)


print()
print("Step 4: Create XYZ tiles")

subprocess.run(
    [
        gdal,
        "raster",
        "tile",
        "--tiling-scheme",
        "WebMercatorQuad",
        "--convention",
        "xyz",
        "--min-zoom",
        "2",
        "--max-zoom",
        "4",
        "--resampling",
        "nearest",
        "--output",
        str(tile_folder),
        str(colored_file)
    ],
    check=True
)


print()
print(f"ECMWF +{hour} h processing complete")
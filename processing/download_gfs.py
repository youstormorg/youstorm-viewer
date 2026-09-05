import requests
from pathlib import Path


# --------------------------------------------------
# Settings
# --------------------------------------------------

date = "20260904"
cycle = "12"

forecast_hours = [
    0, 3, 6, 9, 12, 15, 18, 21, 24
]

left_lon = -15
right_lon = 40
top_lat = 72
bottom_lat = 30


output_dir = Path("data/gfs")
output_dir.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# Download forecasts
# --------------------------------------------------

for forecast_hour in forecast_hours:

    filename = (
        f"gfs.t{cycle}z.pgrb2.0p25."
        f"f{forecast_hour:03d}"
    )

    params = {
        "file": filename,
        "var_TMP": "on",
        "lev_2_m_above_ground": "on",
        "subregion": "",
        "leftlon": left_lon,
        "rightlon": right_lon,
        "toplat": top_lat,
        "bottomlat": bottom_lat,
        "dir": f"/gfs.{date}/{cycle}/atmos"
    }

    url = (
        "https://nomads.ncep.noaa.gov/"
        "cgi-bin/filter_gfs_0p25.pl"
    )

    output_file = (
        output_dir /
        f"gfs_temp_europe_f{forecast_hour:03d}.grib2"
    )

    print()
    print(
        f"Downloading +{forecast_hour:03d} h"
    )

    response = requests.get(
        url,
        params=params,
        timeout=60
    )

    response.raise_for_status()

    output_file.write_bytes(
        response.content
    )

    print(
        f"Saved: {output_file}"
    )

print()
print("GFS download complete")
import requests
from pathlib import Path
from datetime import datetime, timezone, timedelta


# --------------------------------------------------
# Settings
# --------------------------------------------------

from datetime import datetime, timezone, timedelta

now = datetime.now(timezone.utc)

forecast_hours = [
    0, 3, 6, 9, 12, 15, 18, 21, 24
]

left_lon = -15
right_lon = 40
top_lat = 72
bottom_lat = 30

def find_latest_cycle():

    now = datetime.now(timezone.utc)

    cycle_hour = (
        now.hour // 6
    ) * 6

    for cycle_offset in range(5):

        candidate_hour = (
            cycle_hour -
            cycle_offset * 6
        )

        candidate_date = now

        if candidate_hour < 0:
            candidate_hour += 24
            candidate_date -= timedelta(days=1)

        date = candidate_date.strftime("%Y%m%d")
        cycle = f"{candidate_hour:02d}"

        filename = (
            f"gfs.t{cycle}z.pgrb2.0p25.f000"
        )

        params = {
            "file": filename,
            "dir": f"/gfs.{date}/{cycle}/atmos"
        }

        url = (
            "https://nomads.ncep.noaa.gov/"
            "cgi-bin/filter_gfs_0p25.pl"
        )

        response = requests.head(
            url,
            params=params,
            timeout=30
        )

        if response.status_code == 200:
            print()
            print(
                f"Latest available GFS cycle: "
                f"{date} {cycle}Z"
            )
            return date, cycle

        print(
            f"GFS cycle {date} {cycle}Z "
            f"not available"
        )

    raise RuntimeError(
        "No recent GFS cycle could be found"
    )
if __name__ == "__main__":
    date, cycle = find_latest_cycle()

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
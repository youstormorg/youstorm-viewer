import sys
sys.dont_write_bytecode = True

import subprocess
import json
from pathlib import Path

def get_local_gfs_cycle():

    json_file = Path(
        "data/gfs/gfs_temp_global_f000.json"
    )

    if not json_file.exists():
        return None

    with open(json_file) as f:
        data = json.load(f)

    initialisation = data["initialisation"]

    return (
    initialisation[0:4] +
    initialisation[5:7] +
    initialisation[8:10],
    initialisation[11:13]
)

def get_local_ecmwf_cycle():

    json_file = Path(
        "data/ecmwf/ecmwf_temperature_metadata.json"
    )

    if not json_file.exists():
        return None

    with open(json_file) as f:
        data = json.load(f)

    if not data:
        return None

    initialisation = data[0]["initialisation"]

    return (
        initialisation[0:4] +
        initialisation[5:7] +
        initialisation[8:10],
        initialisation[11:13]
    )

if __name__ == "__main__":

    print("Starting YouStorm viewer update")
    print("============================")


    print()
    print("Checking for a new GFS cycle...")

    from download_gfs import find_latest_cycle

    latest_date, latest_cycle = find_latest_cycle()

    local_cycle = get_local_gfs_cycle()

    from download_ecmwf import get_latest_ecmwf_cycle

    latest_ecmwf_datetime = get_latest_ecmwf_cycle()

    latest_ecmwf_cycle = (
        latest_ecmwf_datetime.strftime("%Y%m%d"),
        latest_ecmwf_datetime.strftime("%H")
    )

    local_ecmwf_cycle = get_local_ecmwf_cycle()

    print(
        f"Latest available: {latest_date} {latest_cycle}Z"
    )

    print(
        f"Local GFS cycle:  "
        f"{local_cycle[0]} {local_cycle[1]}Z"
        if local_cycle
        else "Local GFS cycle: none"
    )

    print(
        f"Latest ECMWF cycle: "
        f"{latest_ecmwf_cycle}"
    )

    print(
        f"Local ECMWF cycle:  "
        f"{local_ecmwf_cycle[0]} {local_ecmwf_cycle[1]}Z"
        if local_ecmwf_cycle
        else "Local ECMWF cycle: none"
    )

    gfs_needs_update = (
    local_cycle != (latest_date, latest_cycle)
)

ecmwf_needs_update = (
    local_ecmwf_cycle != latest_ecmwf_cycle
)

print()

if gfs_needs_update:

    print("GFS update required.")

else:

    print("GFS is already up to date.")


if ecmwf_needs_update:

    print("ECMWF update required.")

else:

    print("ECMWF is already up to date.")

if gfs_needs_update:

    print()
    print("New GFS cycle detected.")
    print("Starting GFS download...")

    subprocess.run(
        ["python", "processing/download_gfs.py"],
        check=True
    )


    print()
    print("GFS download complete")


    subprocess.run(
        ["python", "processing/convert_all_gfs.py"],
        check=True
    )


    print()
    print("GFS conversion complete")


    subprocess.run(
        ["python", "processing/create_all_temperature_pngs.py"],
        check=True
    )


    print()
    print("Temperature PNG creation complete")

    subprocess.run(
        ["python", "processing/create_all_precipitation_pngs.py"],
        check=True
    )


    print()
    print("Precipitation PNG creation complete")

    subprocess.run(
        ["python", "processing/process_all_gdal.py"],
        check=True
    )


    print()
    print("GFS map tile processing complete")

if ecmwf_needs_update:

    print()
    print("New ECMWF cycle detected.")
    print("Starting ECMWF download...")

    subprocess.run(
        ["python", "processing/download_ecmwf.py"],
        check=True
    )

    print()
    print("ECMWF download complete")

    subprocess.run(
        ["python", "processing/convert_ecmwf.py"],
        check=True
    )

    print()
    print("ECMWF conversion complete")

    subprocess.run(
        ["python", "processing/process_all_ecmwf.py"],
        check=True
    )

    print()
    print("ECMWF map tile processing complete")

    subprocess.run(
        ["python", "processing/create_ecmwf_metadata.py"],
        check=True
    )

    print()
    print("ECMWF metadata creation complete")

print()
print("============================")
print("YouStorm viewer update complete")
print("============================")

print()
print("Checking Git status...")

subprocess.run(
    ["git", "status"],
    check=True
)

print()
print("Adding viewer files to Git...")

subprocess.run(
    [
        "git", "add", "-A",
        "data/gfs",
        "data/ecmwf",
        "processing/update_gfs.py",
        "processing/update_viewer.py",
        "processing/download_gfs.py",
        "processing/download_ecmwf.py"
    ],
    check=True
)

print("Viewer files added to Git")

print()
print("Checking for changes to commit...")

result = subprocess.run(
    ["git", "status", "--porcelain"],
    capture_output=True,
    text=True,
    check=True
)

if result.stdout.strip():

    print("Changes detected.")

    print()
    print("Committing GFS update...")

    subprocess.run(
        ["git", "commit", "-m", "Update GFS forecast"],
        check=True
    )

    print()
    print("Pushing GFS update to GitHub...")

    subprocess.run(
        ["git", "push"],
        check=True
    )

    print()
    print("GFS update pushed to GitHub")

else:

    print("No changes detected.")
    print("Nothing to commit or push.")


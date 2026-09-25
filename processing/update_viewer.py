import sys
sys.dont_write_bytecode = True

import subprocess
import json
import time

from pathlib import Path


stage_times = {}


def run_timed_stage(name, command):

    print()
    print(f"Starting: {name}")

    start_time = time.perf_counter()

    subprocess.run(
        command,
        check=True
    )

    elapsed = time.perf_counter() - start_time

    stage_times[name] = elapsed

    print()
    print(f"{name} completed in {elapsed / 60:.2f} minutes")

    return elapsed

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

    total_start_time = time.perf_counter()

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

    run_timed_stage(
        "GFS download",
        ["python", "processing/download_gfs.py"]
    )

    print()
    print("GFS download complete")

    run_timed_stage(
        "GFS conversion",
        ["python", "processing/convert_all_gfs.py"]
    )

    print()
    print("GFS conversion complete")

    run_timed_stage(
        "Temperature PNG creation",
        ["python", "processing/create_all_temperature_pngs.py"]
    )

    print()
    print("Temperature PNG creation complete")

    run_timed_stage(
        "Precipitation PNG creation",
        ["python", "processing/create_all_precipitation_pngs.py"]
    )

    print()
    print("Precipitation PNG creation complete")

    run_timed_stage(
        "GFS map tile processing",
        ["python", "processing/process_all_gdal.py"]
    )

    print()
    print("GFS map tile processing complete")


if ecmwf_needs_update:

    print()
    print("New ECMWF cycle detected.")
    print("Starting ECMWF download...")

    run_timed_stage(
        "ECMWF download",
        ["python", "processing/download_ecmwf.py"]
    )

    print()
    print("ECMWF download complete")

    run_timed_stage(
        "ECMWF conversion",
        ["python", "processing/convert_ecmwf.py"]
    )

    print()
    print("ECMWF conversion complete")

    run_timed_stage(
        "ECMWF map tile processing",
        ["python", "processing/process_all_ecmwf.py"]
    )

    print()
    print("ECMWF map tile processing complete")

    run_timed_stage(
        "ECMWF metadata creation",
        ["python", "processing/create_ecmwf_metadata.py"]
    )

    print()
    print("ECMWF metadata creation complete")

total_elapsed = time.perf_counter() - total_start_time

print()
print("============================")
print("YouStorm viewer update complete")
print("============================")

print()
print("PERFORMANCE SUMMARY")
print("----------------------------")

stage_order = [
    "GFS download",
    "GFS conversion",
    "Temperature PNG creation",
    "Precipitation PNG creation",
    "GFS map tile processing",
    "ECMWF download",
    "ECMWF conversion",
    "ECMWF map tile processing",
    "ECMWF metadata creation",
    "Git add",
    "Git commit",
    "Git push"
]

for stage in stage_order:

    if stage in stage_times:

        print(
            f"{stage}: "
            f"{stage_times[stage] / 60:.2f} minutes"
        )

    else:

        print(
            f"{stage}: "
            f"not run"
        )

print("----------------------------")
print(
    f"Total update time: "
    f"{total_elapsed / 60:.2f} minutes"
)


print()
print("Checking Git status...")

result = subprocess.run(
    ["git", "status", "--porcelain"],
    capture_output=True,
    text=True,
    check=True
)

if result.stdout.strip():
    print("Git working tree contains changes.")
else:
    print("Git working tree is clean.")

print()
print("Adding viewer files to Git...")

run_timed_stage(
    "Git add",
    [
        "git", "add", "-A",
        "data/gfs",
        "data/ecmwf",
        "processing/update_viewer.py",
        "processing/download_gfs.py",
        "processing/download_ecmwf.py"
    ]
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

    run_timed_stage(
        "Git commit",
        ["git", "commit", "-m", "Update GFS forecast"]
    )

    print()
    print("Pushing GFS update to GitHub...")

    run_timed_stage(
        "Git push",
        ["git", "push"]
    )

    print()
    print("GFS update pushed to GitHub")

else:

    print("No changes detected.")
    print("Nothing to commit or push.")


## TRIGGER COMMENT
import sys
sys.dont_write_bytecode = True

import subprocess
import json
import time

force_update = "--force" in sys.argv

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
        "data/gfs/gfs_temperature_metadata.json"
    )

    if not json_file.exists():
        return None

    with open(json_file) as f:
        data = json.load(f)

    initialisation = data[0]["initialisation"]

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


    if force_update:

        print()
        print("Force update requested.")
        print("Skipping local forecast cycle checks.")

        gfs_needs_update = True
        ecmwf_needs_update = True

    else:

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
        "ECMWF precipitation conversion",
        ["python", "processing/convert_all_ecmwf_precip.py"]
    )

    print()
    print("ECMWF precipitation conversion complete")

    run_timed_stage(
        "ECMWF metadata creation",
        ["python", "processing/create_ecmwf_metadata.py"]
    )

    print()
    print("ECMWF metadata creation complete")

    run_timed_stage(
        "ECMWF precipitation metadata creation",
        ["python", "processing/create_ecmwf_precip_metadata.py"]
    )

    print()
    print("ECMWF precipitation metadata creation complete")

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
    "ECMWF download",
    "ECMWF conversion",
    "ECMWF metadata creation",
    "ECMWF precipitation conversion",
    "ECMWF precipitation metadata creation",
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
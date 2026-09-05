import subprocess
import json
from pathlib import Path

def get_local_gfs_cycle():

    json_file = Path(
        "data/gfs/gfs_temp_europe_f000.json"
    )

    if not json_file.exists():
        return None

    with open(json_file) as f:
        data = json.load(f)

    initialisation = data["initialisation"]

    return (
        initialisation[0:10],
        initialisation[11:13]
    )

print("Starting YouStorm GFS update")
print("============================")


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
    ["python", "processing/process_all_gdal.py"],
    check=True
)


print()
print("GFS map tile processing complete")


print()
print("============================")
print("YouStorm GFS update complete")
print("============================")

print()
print("Checking Git status...")

subprocess.run(
    ["git", "status"],
    check=True
)

print()
print("Adding GFS files to Git...")

subprocess.run(
    ["git", "add", "data/gfs", "processing/update_gfs.py"],
    check=True
)

print("GFS files added to Git")

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


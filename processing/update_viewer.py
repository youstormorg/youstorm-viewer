import sys
sys.dont_write_bytecode = True

import json
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

force_update = "--force" in sys.argv

DATA_DIR = Path("data")

MODEL_SETTINGS = {
    "gfs": {
        "staging": DATA_DIR / "gfs_staging",
        "temperature_metadata": "gfs_temperature_metadata.json",
        "precipitation_metadata": "gfs_precipitation_metadata.json",
        "temperature_hours": list(range(0, 145, 3)),
        "precipitation_hours": list(range(3, 145, 3)),
        "temperature_pattern": "gfs_temp_global_f{hour:03d}.bin",
        "precipitation_pattern": "gfs_precip_global_f{hour:03d}_u16.bin",
    },
    "ecmwf": {
        "staging": DATA_DIR / "ecmwf_staging",
        "temperature_metadata": "ecmwf_temperature_metadata.json",
        "precipitation_metadata": "ecmwf_precipitation_metadata.json",
        "temperature_hours": list(range(0, 145, 3)),
        "precipitation_hours": list(range(3, 145, 3)),
        "temperature_pattern": "ecmwf_2t_f{hour:03d}.bin",
        "precipitation_pattern": "ecmwf_precip_f{hour:03d}_u16.bin",
        "wind_metadata": "ecmwf_wind_metadata.json",
        "wind_hours": list(range(0, 145, 3)),
        "wind_pattern": "ecmwf_{component}_f{hour:03d}.bin",
    },
}

stage_times = {}


def run_timed_stage(name, command):
    print()
    print(f"Starting: {name}")

    start = time.perf_counter()

    subprocess.run(command, check=True)

    elapsed = time.perf_counter() - start
    stage_times[name] = elapsed

    print()
    print(f"{name} completed in {elapsed / 60:.2f} minutes")

    return elapsed


def get_local_cycle(model):
    settings = MODEL_SETTINGS[model]
    metadata_file = DATA_DIR / model / settings["temperature_metadata"]

    if not metadata_file.exists():
        return None

    with open(metadata_file, encoding="utf-8") as f:
        data = json.load(f)

    if not data:
        return None

    initialisation = data[0].get("initialisation")

    if not initialisation:
        return None

    return (
        initialisation[0:4] + initialisation[5:7] + initialisation[8:10],
        initialisation[11:13],
    )


def prepare_staging_directory(model):
    staging = MODEL_SETTINGS[model]["staging"]

    # Remove leftovers from an earlier incomplete attempt.
    if staging.exists():
        shutil.rmtree(staging)

    staging.mkdir(parents=True)

    return staging


def validate_model(model):
    settings = MODEL_SETTINGS[model]
    staging = settings["staging"]

    print()
    print(f"Validating staged {model.upper()} forecast...")

    expected_files = []

    for hour in settings["temperature_hours"]:
        expected_files.append(
            staging / settings["temperature_pattern"].format(hour=hour)
        )

    for hour in settings["precipitation_hours"]:
        expected_files.append(
            staging / settings["precipitation_pattern"].format(hour=hour)
        )

    if model == "ecmwf":
        for component in ("10u", "10v"):
            for hour in settings["wind_hours"]:
                expected_files.append(
                    staging / settings["wind_pattern"].format(
                        component=component,
                        hour=hour,
                    )
                )

    for filename in (
        settings["temperature_metadata"],
        settings["precipitation_metadata"],
    ):
        expected_files.append(staging / filename)

    if model == "ecmwf":
        expected_files.append(
            staging / settings["wind_metadata"]
        )

    missing = [
        path for path in expected_files
        if not path.is_file()
    ]

    empty = [
        path for path in expected_files
        if path.is_file() and path.stat().st_size == 0
    ]

    if missing or empty:
        if missing:
            print("Missing expected files:")
            for path in missing:
                print(f"  {path}")

        if empty:
            print("Empty expected files:")
            for path in empty:
                print(f"  {path}")

        raise RuntimeError(
            f"{model.upper()} staging validation failed"
        )
    metadata_initialisations = {}
    metadata_checks = [
        (settings["temperature_metadata"], settings["temperature_hours"]),
        (settings["precipitation_metadata"], settings["precipitation_hours"]),
    ]

    if model == "ecmwf":
        metadata_checks.append(
            (settings["wind_metadata"], settings["wind_hours"])
        )

    for metadata_name, expected_hours in metadata_checks:
        metadata_file = staging / metadata_name

        with open(metadata_file, encoding="utf-8") as f:
            entries = json.load(f)

        if not isinstance(entries, list):
            raise RuntimeError(
                f"Invalid metadata format: {metadata_file}"
            )

        actual_hours = [
            entry.get("forecast_hour")
            for entry in entries
        ]

        if actual_hours != expected_hours:
            raise RuntimeError(
                f"Unexpected forecast hours in {metadata_file}"
            )

        if any(
            not entry.get("initialisation")
            or not entry.get("valid_time")
            for entry in entries
        ):
            raise RuntimeError(
                f"Incomplete time metadata in {metadata_file}"
            )

        initialisations = {
            entry["initialisation"]
            for entry in entries
        }

        if len(initialisations) != 1:
            raise RuntimeError(
                f"Mixed forecast initialisations in {metadata_file}"
            )
        metadata_initialisations[metadata_name] = next(iter(initialisations))
    if len(set(metadata_initialisations.values())) != 1:
        raise RuntimeError(
            f"{model.upper()} metadata belongs to different "
            "forecast initialisations"
        )
    print(
        f"{model.upper()} validation passed: "
        f"{len(settings['temperature_hours'])} temperature files, "
        f"{len(settings['precipitation_hours'])} precipitation files, "
        "and both metadata files."
    )


def build_gfs():
    staging = prepare_staging_directory("gfs")

    run_timed_stage(
        "GFS download",
        [
            sys.executable,
            "processing/download_gfs.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "GFS conversion",
        [
            sys.executable,
            "processing/convert_all_gfs.py",
            str(staging),
        ],
    )

    validate_model("gfs")


def build_ecmwf():
    staging = prepare_staging_directory("ecmwf")

    run_timed_stage(
        "ECMWF download",
        [
            sys.executable,
            "processing/download_ecmwf.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "ECMWF temperature conversion",
        [
            sys.executable,
            "processing/convert_ecmwf.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "ECMWF precipitation conversion",
        [
            sys.executable,
            "processing/convert_all_ecmwf_precip.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "ECMWF wind conversion",
        [
            sys.executable,
            "processing/convert_ecmwf_wind.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "ECMWF temperature metadata creation",
        [
            sys.executable,
            "processing/create_ecmwf_metadata.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "ECMWF precipitation metadata creation",
        [
            sys.executable,
            "processing/create_ecmwf_precip_metadata.py",
            str(staging),
        ],
    )

    run_timed_stage(
        "ECMWF wind metadata creation",
        [
            sys.executable,
            "processing/create_ecmwf_wind_metadata.py",
            str(staging),
        ],
    )

    validate_model("ecmwf")


def promote_models(models):
    backups = {}
    promoted = []

    try:
        for model in models:
            active = DATA_DIR / model
            staging = MODEL_SETTINGS[model]["staging"]

            backup = None

            if active.exists():
                backup = Path(
                    tempfile.mkdtemp(
                        prefix=f".{model}_backup_",
                        dir=DATA_DIR,
                    )
                )
                backup.rmdir()

                active.rename(backup)
                backups[active] = backup

            try:
                staging.rename(active)
                promoted.append((active, staging))

            except Exception:
                if (
                    backup is not None
                    and backup.exists()
                    and not active.exists()
                ):
                    backup.rename(active)

                raise

    except Exception:
        print()
        print("Promotion failed; attempting to restore active forecasts.")

        for active, staging in reversed(promoted):
            if active.exists() and not staging.exists():
                active.rename(staging)

            backup = backups.get(active)

            if (
                backup is not None
                and backup.exists()
                and not active.exists()
            ):
                backup.rename(active)

        # Also restore any directory moved aside immediately before
        # a failed staging-directory rename.
        for active, backup in backups.items():
            if backup.exists() and not active.exists():
                backup.rename(active)

        raise

    # All requested promotions succeeded. Old directories can now
    # be removed; cleanup failure must not trigger a rollback.
    for backup in backups.values():
        if backup.exists():
            try:
                shutil.rmtree(backup)
            except OSError as error:
                print(
                    f"Warning: could not remove old forecast backup "
                    f"{backup}: {error}"
                )


def main():
    total_start = time.perf_counter()

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
        print("Checking for new forecast cycles...")

        from download_gfs import find_latest_cycle
        from download_ecmwf import get_latest_ecmwf_cycle

        latest_gfs_cycle = find_latest_cycle()
        latest_ecmwf_datetime = get_latest_ecmwf_cycle()

        latest_ecmwf_cycle = (
            latest_ecmwf_datetime.strftime("%Y%m%d"),
            latest_ecmwf_datetime.strftime("%H"),
        )

        local_gfs_cycle = get_local_cycle("gfs")
        local_ecmwf_cycle = get_local_cycle("ecmwf")

        print(f"Latest GFS cycle: {latest_gfs_cycle}")
        print(f"Local GFS cycle:  {local_gfs_cycle}")
        print(f"Latest ECMWF cycle: {latest_ecmwf_cycle}")
        print(f"Local ECMWF cycle:  {local_ecmwf_cycle}")

        gfs_needs_update = local_gfs_cycle != latest_gfs_cycle
        ecmwf_needs_update = local_ecmwf_cycle != latest_ecmwf_cycle

    print()
    print(f"GFS update required: {gfs_needs_update}")
    print(f"ECMWF update required: {ecmwf_needs_update}")

    models_to_promote = []

    # Build and validate all requested forecasts before replacing
    # either active model directory.
    if gfs_needs_update:
        build_gfs()
        models_to_promote.append("gfs")

    if ecmwf_needs_update:
        build_ecmwf()
        models_to_promote.append("ecmwf")

    if models_to_promote:
        print()
        print("All requested forecasts validated.")
        print("Promoting completed forecasts...")

        promote_models(models_to_promote)

        print("Forecast promotion complete.")

    total_elapsed = time.perf_counter() - total_start

    print()
    print("============================")
    print("YouStorm viewer update complete")
    print("============================")

    print()
    print("PERFORMANCE SUMMARY")
    print("----------------------------")

    for stage, elapsed in stage_times.items():
        print(f"{stage}: {elapsed / 60:.2f} minutes")

    print("----------------------------")
    print(f"Total update time: {total_elapsed / 60:.2f} minutes")


if __name__ == "__main__":
    main()
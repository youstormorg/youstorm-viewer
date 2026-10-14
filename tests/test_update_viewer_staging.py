import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from processing import update_viewer


def make_metadata(hours, initialisation="2026-10-14T00:00:00Z"):
    return [
        {
            "forecast_hour": hour,
            "initialisation": initialisation,
            "valid_time": f"2026-10-14T{hour:02d}:00:00Z",
        }
        for hour in hours
    ]


def prepare_test_model(directory):
    staging = directory / "gfs_staging"
    staging.mkdir()

    settings = {
        "staging": staging,
        "temperature_metadata": "temperature.json",
        "precipitation_metadata": "precipitation.json",
        "temperature_hours": [0, 3],
        "precipitation_hours": [3],
        "temperature_pattern": "temperature_f{hour:03d}.bin",
        "precipitation_pattern": "precipitation_f{hour:03d}.bin",
    }

    for hour in settings["temperature_hours"]:
        (staging / settings["temperature_pattern"].format(hour=hour)).write_bytes(
            b"test"
        )

    for hour in settings["precipitation_hours"]:
        (staging / settings["precipitation_pattern"].format(hour=hour)).write_bytes(
            b"test"
        )

    (staging / settings["temperature_metadata"]).write_text(
        json.dumps(make_metadata(settings["temperature_hours"])),
        encoding="utf-8",
    )
    (staging / settings["precipitation_metadata"]).write_text(
        json.dumps(make_metadata(settings["precipitation_hours"])),
        encoding="utf-8",
    )

    return staging, settings


def test_valid_staging_passes():
    with TemporaryDirectory() as temporary_directory:
        directory = Path(temporary_directory)
        staging, settings = prepare_test_model(directory)

        original_settings = update_viewer.MODEL_SETTINGS
        try:
            update_viewer.MODEL_SETTINGS = {
                **original_settings,
                "gfs": settings,
            }

            update_viewer.validate_model("gfs")
        finally:
            update_viewer.MODEL_SETTINGS = original_settings


def test_mismatched_initialisations_fail():
    with TemporaryDirectory() as temporary_directory:
        directory = Path(temporary_directory)
        staging, settings = prepare_test_model(directory)

        (staging / settings["precipitation_metadata"]).write_text(
            json.dumps(
                make_metadata(
                    settings["precipitation_hours"],
                    initialisation="2026-10-14T06:00:00Z",
                )
            ),
            encoding="utf-8",
        )

        original_settings = update_viewer.MODEL_SETTINGS
        try:
            update_viewer.MODEL_SETTINGS = {
                **original_settings,
                "gfs": settings,
            }

            try:
                update_viewer.validate_model("gfs")
            except RuntimeError as error:
                assert "different forecast initialisations" in str(error)
            else:
                raise AssertionError(
                    "Mismatched initialisations should fail validation"
                )
        finally:
            update_viewer.MODEL_SETTINGS = original_settings




def test_successful_promotion_replaces_active_directory():
    with TemporaryDirectory() as temporary_directory:
        root = Path(temporary_directory)
        data_dir = root / "data"
        active = data_dir / "gfs"
        staging = data_dir / "gfs_staging"

        active.mkdir(parents=True)
        staging.mkdir()
        (active / "old.txt").write_text("old forecast", encoding="utf-8")
        (staging / "new.txt").write_text("new forecast", encoding="utf-8")

        original_data_dir = update_viewer.DATA_DIR
        original_settings = update_viewer.MODEL_SETTINGS
        try:
            update_viewer.DATA_DIR = data_dir
            update_viewer.MODEL_SETTINGS = {
                **original_settings,
                "gfs": {
                    **original_settings["gfs"],
                    "staging": staging,
                },
            }

            update_viewer.promote_models(["gfs"])

            assert not (active / "old.txt").exists()
            assert (active / "new.txt").read_text(encoding="utf-8") == "new forecast"
            assert not staging.exists()
            assert not list(data_dir.glob(".gfs_backup_*"))
        finally:
            update_viewer.DATA_DIR = original_data_dir
            update_viewer.MODEL_SETTINGS = original_settings

def test_failed_promotion_restores_active_directory():
    with TemporaryDirectory() as temporary_directory:
        root = Path(temporary_directory)
        data_dir = root / "data"
        active = data_dir / "gfs"
        staging = data_dir / "gfs_staging"

        active.mkdir(parents=True)
        staging.mkdir()
        (active / "old.txt").write_text("old forecast", encoding="utf-8")
        (staging / "new.txt").write_text("new forecast", encoding="utf-8")

        original_data_dir = update_viewer.DATA_DIR
        original_settings = update_viewer.MODEL_SETTINGS
        original_rename = Path.rename

        def fail_staging_promotion(path, target):
            if path == staging and target == active:
                raise OSError("simulated promotion failure")
            return original_rename(path, target)

        try:
            update_viewer.DATA_DIR = data_dir
            update_viewer.MODEL_SETTINGS = {
                **original_settings,
                "gfs": {
                    **original_settings["gfs"],
                    "staging": staging,
                },
            }

            with patch.object(Path, "rename", fail_staging_promotion):
                try:
                    update_viewer.promote_models(["gfs"])
                except OSError as error:
                    assert "simulated promotion failure" in str(error)
                else:
                    raise AssertionError("Promotion should have failed")

            assert (active / "old.txt").read_text(encoding="utf-8") == "old forecast"
            assert not (active / "new.txt").exists()
            assert staging.exists()
            assert (staging / "new.txt").read_text(encoding="utf-8") == "new forecast"
            assert not list(data_dir.glob(".gfs_backup_*"))
        finally:
            update_viewer.DATA_DIR = original_data_dir
            update_viewer.MODEL_SETTINGS = original_settings

def test_second_model_failure_restores_both_active_directories():
    with TemporaryDirectory() as temporary_directory:
        root = Path(temporary_directory)
        data_dir = root / "data"

        gfs_active = data_dir / "gfs"
        ecmwf_active = data_dir / "ecmwf"
        gfs_staging = data_dir / "gfs_staging"
        ecmwf_staging = data_dir / "ecmwf_staging"

        for directory in (
            gfs_active,
            ecmwf_active,
            gfs_staging,
            ecmwf_staging,
        ):
            directory.mkdir(parents=True)

        (gfs_active / "old.txt").write_text(
            "old GFS forecast", encoding="utf-8"
        )
        (ecmwf_active / "old.txt").write_text(
            "old ECMWF forecast", encoding="utf-8"
        )
        (gfs_staging / "new.txt").write_text(
            "new GFS forecast", encoding="utf-8"
        )
        (ecmwf_staging / "new.txt").write_text(
            "new ECMWF forecast", encoding="utf-8"
        )

        original_data_dir = update_viewer.DATA_DIR
        original_settings = update_viewer.MODEL_SETTINGS
        original_rename = Path.rename

        def fail_ecmwf_promotion(path, target):
            if path == ecmwf_staging and target == ecmwf_active:
                raise OSError("simulated ECMWF promotion failure")
            return original_rename(path, target)

        try:
            update_viewer.DATA_DIR = data_dir
            update_viewer.MODEL_SETTINGS = {
                **original_settings,
                "gfs": {
                    **original_settings["gfs"],
                    "staging": gfs_staging,
                },
                "ecmwf": {
                    **original_settings["ecmwf"],
                    "staging": ecmwf_staging,
                },
            }

            with patch.object(Path, "rename", fail_ecmwf_promotion):
                try:
                    update_viewer.promote_models(["gfs", "ecmwf"])
                except OSError as error:
                    assert "simulated ECMWF promotion failure" in str(error)
                else:
                    raise AssertionError(
                        "Promotion should have failed"
                    )

            assert (gfs_active / "old.txt").read_text(
                encoding="utf-8"
            ) == "old GFS forecast"
            assert (ecmwf_active / "old.txt").read_text(
                encoding="utf-8"
            ) == "old ECMWF forecast"

            assert gfs_staging.exists()
            assert (gfs_staging / "new.txt").read_text(
                encoding="utf-8"
            ) == "new GFS forecast"
            assert ecmwf_staging.exists()
            assert (ecmwf_staging / "new.txt").read_text(
                encoding="utf-8"
            ) == "new ECMWF forecast"

            assert not list(data_dir.glob(".gfs_backup_*"))
            assert not list(data_dir.glob(".ecmwf_backup_*"))

        finally:
            update_viewer.DATA_DIR = original_data_dir
            update_viewer.MODEL_SETTINGS = original_settings

if __name__ == "__main__":
    test_valid_staging_passes()
    test_mismatched_initialisations_fail()
    test_successful_promotion_replaces_active_directory()
    test_failed_promotion_restores_active_directory()
    test_second_model_failure_restores_both_active_directories()
    print("All five staging tests passed.")

import json
import urllib.request
from pathlib import Path

BASE_URL = (
    "https://youstormorg.github.io/"
    "youstorm-viewer/data/ecmwf/"
)

EXPECTED_BINARY_SIZE = 1440 * 721 * 2
FORECAST_HOURS = range(0, 145, 3)

# This script is in tests/ecmwf_wind/.
# parents[2] is the repository root.
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "ecmwf"
METADATA_NAME = "ecmwf_wind_metadata.json"


def valid_metadata(path):
    try:
        metadata = json.loads(path.read_text(encoding="utf-8"))
        return isinstance(metadata, list) and len(metadata) == 49
    except (OSError, json.JSONDecodeError):
        return False


def download_file(filename, expected_size=None, validator=None):
    destination = DATA_DIR / filename

    if destination.exists():
        if validator is not None and validator(destination):
            print(f"Already valid: {filename}")
            return True

        if expected_size is not None:
            if destination.stat().st_size == expected_size:
                print(f"Already valid: {filename}")
                return True

    url = BASE_URL + filename
    temporary = destination.with_name(destination.name + ".download")

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "YouStorm local data downloader"},
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status != 200:
                raise RuntimeError(
                    f"HTTP status {response.status}"
                )
            data = response.read()

        if expected_size is not None and len(data) != expected_size:
            raise ValueError(
                f"Expected {expected_size:,} bytes, "
                f"received {len(data):,}"
            )

        temporary.write_bytes(data)

        if validator is not None and not validator(temporary):
            raise ValueError("Downloaded metadata failed validation")

        temporary.replace(destination)
        print(f"Downloaded: {filename}")
        return True

    except Exception as error:
        print(f"FAILED: {filename}: {error}")
        return False

    finally:
        if temporary.exists():
            temporary.unlink()


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Saving files to: {DATA_DIR}")
    print("Downloading ECMWF wind metadata first...")

    failures = []

    if not download_file(
        METADATA_NAME,
        validator=valid_metadata,
    ):
        print(
            "\nMetadata download failed. "
            "No wind binaries were attempted."
        )
        return

    total = 2 * len(FORECAST_HOURS)
    completed = 0

    for hour in FORECAST_HOURS:
        for component in ("10u", "10v"):
            filename = f"ecmwf_{component}_f{hour:03d}.bin"

            if not download_file(
                filename,
                expected_size=EXPECTED_BINARY_SIZE,
            ):
                failures.append(filename)

            completed += 1
            print(f"Progress: {completed}/{total}")

    print("\nDownload summary")
    print(f"Binary files expected: {total}")
    print(f"Binary files failed:   {len(failures)}")

    if failures:
        print("\nFiles to retry:")
        for filename in failures:
            print(f"  {filename}")
    else:
        print("All ECMWF wind binaries are present and valid.")


if __name__ == "__main__":
    main()

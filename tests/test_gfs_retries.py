import sys
from pathlib import Path
from unittest.mock import patch

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from processing.download_gfs import request_with_retries


def test_timeout_then_success():
    success = requests.Response()
    success.status_code = 200

    with (
        patch(
            "processing.download_gfs.requests.request",
            side_effect=[requests.Timeout("temporary timeout"), success],
        ) as mock_request,
        patch("processing.download_gfs.time.sleep") as mock_sleep,
    ):
        result = request_with_retries(
            "GET", "https://example.invalid", params={}, timeout=10
        )

    assert result.status_code == 200
    assert mock_request.call_count == 2
    mock_sleep.assert_called_once_with(2)


def test_head_404_is_returned():
    not_found = requests.Response()
    not_found.status_code = 404

    with patch(
        "processing.download_gfs.requests.request",
        return_value=not_found,
    ):
        result = request_with_retries(
            "HEAD", "https://example.invalid", params={}, timeout=10
        )

    assert result.status_code == 404


def test_get_404_raises_without_retry():
    not_found = requests.Response()
    not_found.status_code = 404

    with (
        patch(
            "processing.download_gfs.requests.request",
            return_value=not_found,
        ) as mock_request,
        patch("processing.download_gfs.time.sleep") as mock_sleep,
    ):
        try:
            request_with_retries(
                "GET", "https://example.invalid", params={}, timeout=10
            )
        except requests.HTTPError:
            pass
        else:
            raise AssertionError("GET 404 should raise HTTPError")

    mock_request.assert_called_once()
    mock_sleep.assert_not_called()

def test_server_error_then_success():
    server_error = requests.Response()
    server_error.status_code = 503

    success = requests.Response()
    success.status_code = 200

    with (
        patch(
            "processing.download_gfs.requests.request",
            side_effect=[server_error, success],
        ) as mock_request,
        patch("processing.download_gfs.time.sleep") as mock_sleep,
    ):
        result = request_with_retries(
            "GET", "https://example.invalid", params={}, timeout=10
        )

    assert result.status_code == 200
    assert mock_request.call_count == 2
    mock_sleep.assert_called_once_with(2)

if __name__ == "__main__":
    test_timeout_then_success()
    test_head_404_is_returned()
    test_get_404_raises_without_retry()
    test_server_error_then_success()
    print("All four GFS retry tests passed.")

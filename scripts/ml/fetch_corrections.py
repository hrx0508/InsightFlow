import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_URL = os.getenv(
    "INSIGHTFLOW_API_URL",
    "http://localhost:5000",
)


def fetch_corrections():
    url = f"{API_URL.rstrip('/')}/api/ai/corrections"

    request = Request(
        url,
        headers={"Accept": "application/json"},
        method="GET",
    )

    try:
        with urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))

    except HTTPError as error:
        raise RuntimeError(
            f"API returned HTTP {error.code}"
        ) from error

    except URLError as error:
        raise RuntimeError(
            "Unable to connect to InsightFlow API. "
            "Make sure the backend is running."
        ) from error

    if not data.get("success"):
        raise RuntimeError(
            data.get("message", "Unable to retrieve corrections.")
        )

    return data.get("corrections", [])


def main():
    try:
        corrections = fetch_corrections()

        # Only explicitly verified corrections should be used
        # for training. The GET endpoint will enforce this.
        print(json.dumps(corrections, indent=2))

    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
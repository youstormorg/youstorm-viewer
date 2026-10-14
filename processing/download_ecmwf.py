import sys
from ecmwf.opendata import Client
from pathlib import Path

client = Client(
    source="google"
)

forecast_hours = list(
    range(0, 145, 3)
)

precipitation_hours = list(
    range(3, 145, 3)
)

def get_latest_ecmwf_cycle():

    return client.latest(
        type="fc",
        stream="oper",
        levtype="sfc",
        param="2t",
        step=24
    )


def download_ecmwf(data_dir="data/ecmwf"):

    Path(data_dir).mkdir(
        parents=True,
        exist_ok=True
    )

    for forecast_hour in forecast_hours:

        print()
        print(
            f"Downloading ECMWF +{forecast_hour:03d} h"
        )

        client.retrieve(
            type="fc",
            stream="oper",
            levtype="sfc",
            param="2t",
            step=forecast_hour,
            target=(
                f"{data_dir}/"
                f"ecmwf_2t_f{forecast_hour:03d}.grib2"
            )
        )

        print(
            f"ECMWF +{forecast_hour:03d} h download complete"
        )

        if forecast_hour in precipitation_hours:

            print(
                f"Downloading ECMWF precipitation "
                f"+{forecast_hour:03d} h"
            )

            client.retrieve(
                type="fc",
                stream="oper",
                levtype="sfc",
                param="tp",
                step=forecast_hour,
                target=(
                    f"{data_dir}/"
                    f"ecmwf_tp_f{forecast_hour:03d}.grib2"
                )
            )

            print(
                f"ECMWF precipitation "
                f"+{forecast_hour:03d} h download complete"
            )
        for wind_component in ("10u", "10v"):

            print(
                f"Downloading ECMWF {wind_component} "
                f"+{forecast_hour:03d} h"
            )

            client.retrieve(
                type="fc",
                stream="oper",
                levtype="sfc",
                param=wind_component,
                step=forecast_hour,
                target=(
                    f"{data_dir}/"
                    f"ecmwf_{wind_component}_f{forecast_hour:03d}.grib2"
                )
            )

            print(
                f"ECMWF {wind_component} "
                f"+{forecast_hour:03d} h download complete"
            )
    print()
    print("All ECMWF downloads complete")

if __name__ == "__main__":

    if len(sys.argv) not in (1, 2):
        print(
            "Usage: python download_ecmwf.py [DATA_DIR]"
        )
        sys.exit(1)

    data_dir = (
        sys.argv[1]
        if len(sys.argv) == 2
        else "data/ecmwf"
    )

    download_ecmwf(data_dir)

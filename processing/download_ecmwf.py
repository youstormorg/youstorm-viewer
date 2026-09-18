from ecmwf.opendata import Client


client = Client(
    source="google"
)


forecast_hours = list(
    range(0, 145, 3)
)


def get_latest_ecmwf_cycle():

    return client.latest(
        type="fc",
        stream="oper",
        levtype="sfc",
        param="2t",
        step=24
    )


def download_ecmwf():

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
                f"data/ecmwf/"
                f"ecmwf_2t_f{forecast_hour:03d}.grib2"
            )
        )

        print(
            f"ECMWF +{forecast_hour:03d} h download complete"
        )

    print()
    print("All ECMWF downloads complete")

if __name__ == "__main__":

    download_ecmwf()
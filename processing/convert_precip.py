import xarray as xr
import json
import sys


# Get forecast hour from command line
forecast_hour = int(sys.argv[1])


# Create filenames from forecast hour
input_file = (
    f"data/gfs/gfs_precip_global_f{forecast_hour:03d}.grib2"
)

output_file = (
    f"data/gfs/gfs_precip_global_f{forecast_hour:03d}.json"
)


# Open GFS GRIB2 file
ds = xr.open_dataset(
    input_file,
    engine="cfgrib"
)


# Extract total precipitation
precipitation = ds["tp"]


# Build web data structure
output = {

    "model": "GFS",

    "variable": "precipitation",

    "forecast_hour": forecast_hour,

    "initialisation":
        str(ds["time"].values)[:19] + "Z",

    "valid_time":
        str(ds["valid_time"].values)[:19] + "Z",

    "latitude":
        ds["latitude"].values.tolist(),

    "longitude":
        ds["longitude"].values.tolist(),

    "values":
        precipitation.values.tolist()

}


# Write JSON
with open(
    output_file,
    "w"
) as f:

    json.dump(
        output,
        f
    )


print(
    f"Created {output_file}"
)
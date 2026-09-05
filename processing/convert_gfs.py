import xarray as xr
import json
import sys


# Get forecast hour from command line
forecast_hour = int(sys.argv[1])


# Create filenames from forecast hour
input_file = (
    f"data/gfs/gfs_temp_europe_f{forecast_hour:03d}.grib2"
)

output_file = (
    f"data/gfs/gfs_temp_europe_f{forecast_hour:03d}.json"
)


# Open GFS GRIB2 file
ds = xr.open_dataset(
    input_file,
    engine="cfgrib"
)


# Extract 2-metre temperature
temperature = ds["t2m"]


# Convert Kelvin to Celsius
temperature_c = temperature - 273.15


# Build web data structure
output = {

    "model": "GFS",

    "variable": "temperature_2m",

    "unit": "C",

    "forecast_hour": forecast_hour,

    "initialisation": str(ds["time"].values)[:19] + "Z",
    "valid_time": str(ds["valid_time"].values)[:19] + "Z",

    "grid": {

        "lat_min":
            float(temperature.latitude.min()),

        "lat_max":
            float(temperature.latitude.max()),

        "lon_min":
            float(temperature.longitude.min()),

        "lon_max":
            float(temperature.longitude.max()),

        "lat_step": 0.25,

        "lon_step": 0.25

    },

    "temperature":
        temperature_c.values.tolist()
}


# Write JSON
with open(output_file, "w") as f:

    json.dump(output, f)


print("GFS conversion complete")
print("-----------------------")
print(f"Forecast: +{forecast_hour:03d} h")
print(f"Input:    {input_file}")
print(f"Output:   {output_file}")
print(
    f"Grid:     "
    f"{temperature.shape[0]} x "
    f"{temperature.shape[1]}"
)
print(
    f"Min:      "
    f"{float(temperature_c.min()):.2f} °C"
)
print(
    f"Max:      "
    f"{float(temperature_c.max()):.2f} °C"
)
print(
    f"Mean:     "
    f"{float(temperature_c.mean()):.2f} °C"
)
print(
    f"Valid:    "
    f"{ds['valid_time'].values}"
)
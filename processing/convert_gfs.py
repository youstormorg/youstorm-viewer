import xarray as xr
import sys


# Get forecast hour from command line
forecast_hour = int(sys.argv[1])


# Create filenames from forecast hour
input_file = (
    f"data/gfs/gfs_temp_global_f{forecast_hour:03d}.grib2"
)

binary_output_file = (
    f"data/gfs/gfs_temp_global_f{forecast_hour:03d}.bin"
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

# Create compact binary temperature data
binary_temperature = \
    (temperature_c.values * 10).round().astype("int16")

binary_temperature.tofile(
    binary_output_file
)

print("GFS conversion complete")
print("-----------------------")
print(f"Forecast: +{forecast_hour:03d} h")
print(f"Input:    {input_file}")
print(f"Binary:   {binary_output_file}")
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
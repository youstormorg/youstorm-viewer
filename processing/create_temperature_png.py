import json
import sys
import numpy as np
from PIL import Image


# --------------------------------------------------
# Get input and output filenames
# --------------------------------------------------

if len(sys.argv) != 3:
    print("Usage:")
    print("python create_temperature_png.py INPUT_JSON OUTPUT_PNG")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]


# --------------------------------------------------
# Load GFS temperature data
# --------------------------------------------------

with open(input_file) as f:
    data = json.load(f)

temperatures = np.array(data["temperature"])


# --------------------------------------------------
# Temperature colour scale
# --------------------------------------------------

def temperature_colour(temp):

    colour_stops = [
        (0,  (75, 108, 183)),
        (5,  (111, 168, 220)),
        (10, (159, 197, 232)),
        (15, (182, 215, 168)),
        (20, (255, 217, 102)),
        (25, (246, 178, 107)),
        (30, (224, 102, 102)),
        (35, (204, 0, 0)),
        (40, (153, 0, 0))
    ]

    if temp <= colour_stops[0][0]:
        return colour_stops[0][1]

    if temp >= colour_stops[-1][0]:
        return colour_stops[-1][1]

    for i in range(len(colour_stops) - 1):

        temp1, colour1 = colour_stops[i]
        temp2, colour2 = colour_stops[i + 1]

        if temp < temp2:

            fraction = (temp - temp1) / (temp2 - temp1)

            return tuple(
                round(
                    colour1[channel] +
                    fraction *
                    (colour2[channel] - colour1[channel])
                )
                for channel in range(3)
            )


# --------------------------------------------------
# Create image
# --------------------------------------------------

height, width = temperatures.shape

print(f"Input: {input_file}")
print(f"Output: {output_file}")
print(f"Grid: {width} x {height}")

image = np.zeros(
    (height, width, 3),
    dtype=np.uint8
)

for row in range(height):

    for col in range(width):

        image[row, col] = temperature_colour(
            temperatures[row, col]
        )


# --------------------------------------------------
# Correct latitude and longitude orientation
# --------------------------------------------------

image = np.flipud(image)

# Shift longitude from 0–360° to -180–180°
image = np.roll(image, width // 2, axis=1)


# --------------------------------------------------
# Save PNG
# --------------------------------------------------

output = Image.fromarray(image)

output.save(output_file)

print("Temperature PNG created")
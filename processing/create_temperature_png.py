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

    if temp < 0:
        return (75, 108, 183)

    if temp < 5:
        return (111, 168, 220)

    if temp < 10:
        return (159, 197, 232)

    if temp < 15:
        return (182, 215, 168)

    if temp < 20:
        return (255, 217, 102)

    if temp < 25:
        return (246, 178, 107)

    if temp < 30:
        return (224, 102, 102)

    if temp < 35:
        return (204, 0, 0)

    return (153, 0, 0)


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
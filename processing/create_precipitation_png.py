import json
import sys
import numpy as np
from PIL import Image


# --------------------------------------------------
# Get input and output filenames
# --------------------------------------------------

if len(sys.argv) != 3:
    print("Usage:")
    print("python create_precipitation_png.py INPUT_JSON OUTPUT_PNG")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]


# --------------------------------------------------
# Load GFS precipitation data
# --------------------------------------------------

with open(input_file) as f:
    data = json.load(f)

precipitation = np.array(data["values"])


# --------------------------------------------------
# Precipitation colour scale
# --------------------------------------------------

def precipitation_colour(mm):

    if mm < 0.1:
        return (255, 255, 255)

    if mm < 1:
        return (220, 245, 255)

    if mm < 2.5:
        return (170, 220, 250)

    if mm < 5:
        return (100, 180, 240)

    if mm < 10:
        return (30, 130, 220)

    if mm < 20:
        return (20, 170, 100)

    if mm < 30:
        return (255, 230, 60)

    if mm < 50:
        return (255, 150, 30)

    if mm < 75:
        return (240, 60, 30)

    return (180, 0, 0)


# --------------------------------------------------
# Create image
# --------------------------------------------------

height, width = precipitation.shape

print(f"Input: {input_file}")
print(f"Output: {output_file}")
print(f"Grid: {width} x {height}")

image = np.zeros(
    (height, width, 3),
    dtype=np.uint8
)

for row in range(height):

    for col in range(width):

        image[row, col] = precipitation_colour(
            precipitation[row, col]
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

print("Precipitation PNG created")
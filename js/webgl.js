const vertexShaderSource = `
    attribute vec2 position;

    varying float vMercatorY;
    varying float vLongitude;

    uniform vec2 mapOrigin;
    uniform vec2 mapScale;
    uniform float worldOffset;

    void main() {

        float longitude =
            position.x;

        float latitude =
            position.y;

        float latitudeRadians =
            latitude *
            3.14159265359 /
            180.0;

        float mercatorY =
            log(
                tan(
                    3.14159265359 / 4.0 +
                    latitudeRadians / 2.0
                )
            );

        vec2 projectedPosition =
            vec2(
                longitude / 180.0,
                mercatorY
            );

        vec2 screenPosition =
            projectedPosition *
            mapScale +
            mapOrigin;

        screenPosition.x +=
            worldOffset;

        vMercatorY =
            mercatorY;

        vLongitude =
            longitude;

        gl_Position =
            vec4(
                screenPosition,
                0.0,
                1.0
            );
    }
`;

const coastlineVertexShaderSource = `
    attribute vec2 position;

    uniform vec2 mapOrigin;
    uniform vec2 mapScale;
    uniform float worldOffset;

    void main() {

        float longitude =
            position.x;

        float latitude =
            position.y;

        float latitudeRadians =
            latitude *
            3.14159265359 /
            180.0;

        float mercatorY =
            log(
                tan(
                    3.14159265359 / 4.0 +
                    latitudeRadians / 2.0
                )
            );

        vec2 projectedPosition =
            vec2(
                longitude / 180.0,
                mercatorY
            );

        vec2 screenPosition =
            projectedPosition *
            mapScale +
            mapOrigin;

        screenPosition.x +=
            worldOffset;

        gl_Position =
            vec4(
                screenPosition,
                0.0,
                1.0
            );

    }
`;

const fragmentShaderSource = `
    precision mediump float;

    varying float vMercatorY;
    varying float vLongitude;

    uniform sampler2D temperatureDataTexture;
    uniform sampler2D precipitationDataTexture;
    uniform sampler2D windUDataTexture;
    uniform sampler2D windVDataTexture;
    uniform float flipLatitude;
    uniform float shiftLongitude;
    uniform float weatherField;
    uniform float weatherOpacity;
    uniform float precipitationRenderMode;
    uniform float temperatureRenderMode;
    uniform float windRenderMode;
    float readTemperatureCell(vec2 cell) {
        float x = mod(cell.x, 1440.0);
        float y = clamp(cell.y, 0.0, 720.0);

        vec2 cellCentre =
            (vec2(x, y) + vec2(0.5, 0.5))
            / vec2(1440.0, 721.0);

        return texture2D(
            temperatureDataTexture,
            cellCentre
        ).r;
    }
    float readWindUCell(vec2 cell) {
        float x = mod(cell.x, 1440.0);
        float y = clamp(cell.y, 0.0, 720.0);

        vec2 cellCentre =
            (vec2(x, y) + vec2(0.5, 0.5))
            / vec2(1440.0, 721.0);

        return texture2D(
            windUDataTexture,
            cellCentre
        ).r;
    }

    float readWindVCell(vec2 cell) {
        float x = mod(cell.x, 1440.0);
        float y = clamp(cell.y, 0.0, 720.0);

        vec2 cellCentre =
            (vec2(x, y) + vec2(0.5, 0.5))
            / vec2(1440.0, 721.0);

        return texture2D(
            windVDataTexture,
            cellCentre
        ).r;
    }
    float readPrecipitationCell(vec2 cell) {
        float x = mod(cell.x, 1440.0);
        float y = clamp(cell.y, 0.0, 720.0);

        vec2 cellCentre =
            (vec2(x, y) + vec2(0.5, 0.5))
            / vec2(1440.0, 721.0);

        return texture2D(
            precipitationDataTexture,
            cellCentre
        ).r;
    }

    void main() {

    float latitudeRadians =
        atan(
            (
                exp(vMercatorY) -
                exp(-vMercatorY)
            ) / 2.0
        );

    float latitude =
        latitudeRadians *
        180.0 /
        3.14159265359;

    vec2 texCoord =
        vec2(
            (vLongitude + 180.0) / 360.0,
            (latitude + 90.0) / 180.0
        );

    float dataY =
        flipLatitude > 0.5
            ? 1.0 - texCoord.y
            : texCoord.y;

    float dataX =
        shiftLongitude > 0.5
            ? fract(texCoord.x + 0.5)
            : texCoord.x;

    vec2 dataTexCoord =
        vec2(
            dataX,
            dataY
        );

    float temperature =
        texture2D(
            temperatureDataTexture,
            dataTexCoord
        ).r;

    if (temperatureRenderMode > 0.5) {
        vec2 gridPosition =
            dataTexCoord * vec2(1440.0, 721.0)
            - vec2(0.5, 0.5);

        vec2 baseCell = floor(gridPosition);
        vec2 fraction = fract(gridPosition);

        float a = readTemperatureCell(baseCell);
        float b = readTemperatureCell(
            baseCell + vec2(1.0, 0.0)
        );
        float c = readTemperatureCell(
            baseCell + vec2(0.0, 1.0)
        );
        float d = readTemperatureCell(
            baseCell + vec2(1.0, 1.0)
        );

        float top = mix(a, b, fraction.x);
        float bottom = mix(c, d, fraction.x);

        temperature = mix(
            top,
            bottom,
            fraction.y
        );
    }

    float precipitationValue =
        texture2D(
            precipitationDataTexture,
            dataTexCoord
        ).r;

    float windU =
        texture2D(
            windUDataTexture,
            dataTexCoord
        ).r;

    float windV =
        texture2D(
            windVDataTexture,
            dataTexCoord
        ).r;

    if (windRenderMode > 0.5) {
        vec2 gridPosition =
            dataTexCoord * vec2(1440.0, 721.0)
            - vec2(0.5, 0.5);

        vec2 baseCell = floor(gridPosition);
        vec2 fraction = fract(gridPosition);

        float u00 = readWindUCell(baseCell);
        float u10 = readWindUCell(
            baseCell + vec2(1.0, 0.0)
        );
        float u01 = readWindUCell(
            baseCell + vec2(0.0, 1.0)
        );
        float u11 = readWindUCell(
            baseCell + vec2(1.0, 1.0)
        );

        float v00 = readWindVCell(baseCell);
        float v10 = readWindVCell(
            baseCell + vec2(1.0, 0.0)
        );
        float v01 = readWindVCell(
            baseCell + vec2(0.0, 1.0)
        );
        float v11 = readWindVCell(
            baseCell + vec2(1.0, 1.0)
        );

        float uTop = mix(u00, u10, fraction.x);
        float uBottom = mix(u01, u11, fraction.x);
        windU = mix(uTop, uBottom, fraction.y);

        float vTop = mix(v00, v10, fraction.x);
        float vBottom = mix(v01, v11, fraction.x);
        windV = mix(vTop, vBottom, fraction.y);
    }

    float windSpeed = length(vec2(windU, windV));

    float wetMask = 0.0;
    float mode5PrecipitationValue = precipitationValue;

    if (precipitationRenderMode > 0.5) {
        vec2 gridPosition =
            dataTexCoord * vec2(1440.0, 721.0)
            - vec2(0.5, 0.5);

        vec2 baseCell = floor(gridPosition);
        vec2 fraction = fract(gridPosition);

        float a = readPrecipitationCell(baseCell);
        float b = readPrecipitationCell(
            baseCell + vec2(1.0, 0.0)
        );
        float c = readPrecipitationCell(
            baseCell + vec2(0.0, 1.0)
        );
        float d = readPrecipitationCell(
            baseCell + vec2(1.0, 1.0)
        );

        float wetA = a >= 0.1 ? 1.0 : 0.0;
        float wetB = b >= 0.1 ? 1.0 : 0.0;
        float wetC = c >= 0.1 ? 1.0 : 0.0;
        float wetD = d >= 0.1 ? 1.0 : 0.0;

        wetMask = mix(
            mix(wetA, wetB, fraction.x),
            mix(wetC, wetD, fraction.x),
            fraction.y
        );

        float allWet = wetA * wetB * wetC * wetD;
        float allDry =
            (1.0 - wetA) * (1.0 - wetB)
            * (1.0 - wetC) * (1.0 - wetD);

        float top = mix(a, b, fraction.x);
        float bottom = mix(c, d, fraction.x);
        float interpolated = mix(top, bottom, fraction.y);

        if (allDry > 0.5) {
            mode5PrecipitationValue = 0.0;
        } else if (allWet > 0.5) {
            mode5PrecipitationValue = interpolated;
        }
    }
    float fieldValue =
        weatherField < 0.5
            ? temperature
            : precipitationValue;

    if (precipitationRenderMode > 0.5) {
        precipitationValue = mode5PrecipitationValue;

        if (wetMask >= 0.5) {
            precipitationValue = max(
                precipitationValue,
                0.1
            );
        }
    }

vec3 colour;

if (weatherField < 0.5) {

    if (temperature < -40.0) {

        colour = vec3(49.0/255.0, 54.0/255.0, 149.0/255.0);

    } else if (temperature < -30.0) {

        float t = (temperature + 40.0) / 10.0;

        colour = mix(
            vec3(49.0/255.0, 54.0/255.0, 149.0/255.0),
            vec3(69.0/255.0, 117.0/255.0, 180.0/255.0),
            t
        );

    } else if (temperature < -20.0) {

        float t = (temperature + 30.0) / 10.0;

        colour = mix(
            vec3(69.0/255.0, 117.0/255.0, 180.0/255.0),
            vec3(116.0/255.0, 173.0/255.0, 209.0/255.0),
            t
        );

    } else if (temperature < -10.0) {

        float t = (temperature + 20.0) / 10.0;

        colour = mix(
            vec3(116.0/255.0, 173.0/255.0, 209.0/255.0),
            vec3(171.0/255.0, 217.0/255.0, 233.0/255.0),
            t
        );

    } else if (temperature < 0.0) {

        float t = (temperature + 10.0) / 10.0;

        colour = mix(
            vec3(171.0/255.0, 217.0/255.0, 233.0/255.0),
            vec3(224.0/255.0, 243.0/255.0, 248.0/255.0),
            t
        );

    } else if (temperature < 5.0) {

        float t = temperature / 5.0;

        colour = mix(
            vec3(224.0/255.0, 243.0/255.0, 248.0/255.0),
            vec3(199.0/255.0, 233.0/255.0, 192.0/255.0),
            t
        );

    } else if (temperature < 10.0) {

        float t = (temperature - 5.0) / 5.0;

        colour = mix(
            vec3(199.0/255.0, 233.0/255.0, 192.0/255.0),
            vec3(127.0/255.0, 205.0/255.0, 187.0/255.0),
            t
        );

    } else if (temperature < 15.0) {

        float t = (temperature - 10.0) / 5.0;

        colour = mix(
            vec3(127.0/255.0, 205.0/255.0, 187.0/255.0),
            vec3(65.0/255.0, 171.0/255.0, 93.0/255.0),
            t
        );

    } else if (temperature < 20.0) {

        float t = (temperature - 15.0) / 5.0;

        colour = mix(
            vec3(65.0/255.0, 171.0/255.0, 93.0/255.0),
            vec3(217.0/255.0, 239.0/255.0, 139.0/255.0),
            t
        );

    } else if (temperature < 25.0) {

        float t = (temperature - 20.0) / 5.0;

        colour = mix(
            vec3(217.0/255.0, 239.0/255.0, 139.0/255.0),
            vec3(254.0/255.0, 224.0/255.0, 139.0/255.0),
            t
        );

    } else if (temperature < 30.0) {

        float t = (temperature - 25.0) / 5.0;

        colour = mix(
            vec3(254.0/255.0, 224.0/255.0, 139.0/255.0),
            vec3(253.0/255.0, 174.0/255.0, 97.0/255.0),
            t
        );

    } else if (temperature < 35.0) {

        float t = (temperature - 30.0) / 5.0;

        colour = mix(
            vec3(253.0/255.0, 174.0/255.0, 97.0/255.0),
            vec3(244.0/255.0, 109.0/255.0, 67.0/255.0),
            t
        );

    } else if (temperature < 40.0) {

        float t = (temperature - 35.0) / 5.0;

        colour = mix(
            vec3(244.0/255.0, 109.0/255.0, 67.0/255.0),
            vec3(215.0/255.0, 48.0/255.0, 39.0/255.0),
            t
        );

    } else if (temperature < 45.0) {

        float t = (temperature - 40.0) / 5.0;

        colour = mix(
            vec3(215.0/255.0, 48.0/255.0, 39.0/255.0),
            vec3(165.0/255.0, 0.0, 38.0/255.0),
            t
        );

    } else if (temperature < 50.0) {

        float t = (temperature - 45.0) / 5.0;

        colour = mix(
            vec3(165.0/255.0, 0.0, 38.0/255.0),
            vec3(127.0/255.0, 0.0, 0.0),
            t
        );

    } else {

        colour = vec3(127.0/255.0, 0.0, 0.0);

    }
} else if (weatherField < 1.5) {

    if (precipitationValue < 0.1) {

        colour =
            vec3(
                1.0,
                1.0,
                1.0
            );

    } else if (precipitationValue < 1.0) {

        colour =
            vec3(
                220.0 / 255.0,
                245.0 / 255.0,
                255.0 / 255.0
            );

    } else if (precipitationValue < 2.5) {

        colour =
            vec3(
                170.0 / 255.0,
                220.0 / 255.0,
                250.0 / 255.0
            );

    } else if (precipitationValue < 5.0) {

        colour =
            vec3(
                100.0 / 255.0,
                180.0 / 255.0,
                240.0 / 255.0
            );

    } else if (precipitationValue < 10.0) {

        colour =
            vec3(
                30.0 / 255.0,
                130.0 / 255.0,
                220.0 / 255.0
            );

    } else if (precipitationValue < 20.0) {

        colour =
            vec3(
                20.0 / 255.0,
                170.0 / 255.0,
                100.0 / 255.0
            );

    } else if (precipitationValue < 30.0) {

        colour =
            vec3(
                255.0 / 255.0,
                230.0 / 255.0,
                60.0 / 255.0
            );

    } else if (precipitationValue < 50.0) {

        colour =
            vec3(
                255.0 / 255.0,
                150.0 / 255.0,
                30.0 / 255.0
            );

    } else if (precipitationValue < 75.0) {

        colour =
            vec3(
                240.0 / 255.0,
                60.0 / 255.0,
                30.0 / 255.0
            );

    } else {

        colour =
            vec3(
                180.0 / 255.0,
                0.0,
                0.0
            );
    }
} else {

    if (windSpeed < 5.0) {

        float t = windSpeed / 5.0;

        colour = mix(
            vec3(0.55, 0.80, 1.00),
            vec3(0.20, 0.75, 0.55),
            t
        );

    } else if (windSpeed < 10.0) {

        float t = (windSpeed - 5.0) / 5.0;

        colour = mix(
            vec3(0.20, 0.75, 0.55),
            vec3(1.00, 0.90, 0.20),
            t
        );

    } else if (windSpeed < 15.0) {

        float t = (windSpeed - 10.0) / 5.0;

        colour = mix(
            vec3(1.00, 0.90, 0.20),
            vec3(1.00, 0.50, 0.10),
            t
        );

    } else if (windSpeed < 20.0) {

        float t = (windSpeed - 15.0) / 5.0;

        colour = mix(
            vec3(1.00, 0.50, 0.10),
            vec3(0.85, 0.10, 0.15),
            t
        );

    } else if (windSpeed < 25.0) {

        float t = (windSpeed - 20.0) / 5.0;

        colour = mix(
            vec3(0.85, 0.10, 0.15),
            vec3(0.55, 0.00, 0.25),
            t
        );

    } else if (windSpeed < 30.0) {

        float t = (windSpeed - 25.0) / 5.0;

        colour = mix(
            vec3(0.55, 0.00, 0.25),
            vec3(0.35, 0.00, 0.45),
            t
        );

    } else if (windSpeed < 35.0) {

        float t = (windSpeed - 30.0) / 5.0;

        colour = mix(
            vec3(0.35, 0.00, 0.45),
            vec3(0.75, 0.45, 0.85),
            t
        );

    } else {

        colour = vec3(0.75, 0.45, 0.85);

    }
}

    float alpha = weatherOpacity;

    if (weatherField >= 0.5 && weatherField < 1.5) {
        if (precipitationRenderMode > 0.5) {
            alpha = wetMask >= 0.5
                ? weatherOpacity
                : 0.0;
        } else if (precipitationValue < 0.1) {
            alpha = 0.0;
        }
    }

    gl_FragColor =
        vec4(
            colour,
            alpha
        );

    }
`;

const coastlineFragmentShaderSource = `
    precision mediump float;

    uniform vec4 lineColor;

    void main() {

        gl_FragColor = lineColor;

    }
`;

const windParticleVertexShaderSource = `
    attribute vec2 position;
    attribute vec2 particleOffset;

    uniform vec2 mapOrigin;
    uniform vec2 mapScale;
    uniform float worldOffset;

    void main() {

        float longitude = position.x;
        float latitude = position.y;

        float latitudeRadians =
            latitude * 3.14159265359 / 180.0;

        float mercatorY =
            log(
                tan(
                    3.14159265359 / 4.0 +
                    latitudeRadians / 2.0
                )
            );

        vec2 projectedPosition =
            vec2(longitude / 180.0, mercatorY);

        vec2 screenPosition =
            projectedPosition * mapScale +
            mapOrigin;

        screenPosition.x += worldOffset;
        screenPosition += particleOffset;

        gl_Position =
            vec4(screenPosition, 0.0, 1.0);
    }
`;

const windParticleFragmentShaderSource = `
    precision mediump float;

    void main() {
        gl_FragColor =
            vec4(
                0.90,
                0.95,
                1.00,
                0.95
            );
    }
`;

export function initialiseWebGL(map) {

    const canvas =
        document.getElementById("weatherWebGL");

    const gl =
        canvas.getContext(
            "webgl",
            {
                alpha: true
            }
        );

    const floatTextureExtension =
        gl.getExtension(
            "OES_texture_float"
        );

    console.log(
        "WebGL floating-point textures:",
        Boolean(floatTextureExtension)
    );

    const indexExtension =
        gl.getExtension(
            "OES_element_index_uint"
        );

    if (!indexExtension) {

        throw new Error(
            "WebGL 32-bit index support is unavailable."
        );

    }
    if (!gl) {

        console.warn(
            "WebGL is not available."
        );

        return null;

    }

console.log(
    "WebGL is available."
);

console.log(
    "WebGL maximum texture size:",
    gl.getParameter(
        gl.MAX_TEXTURE_SIZE
    )
);

function prepareQuadVertexData() {

    return new Float32Array([
        -180, -85.05112878,
         180, -85.05112878,
        -180,  85.05112878,
         180,  85.05112878
    ]);

}

function prepareQuadIndexData() {

    return new Uint16Array([
        0, 1, 2,
        2, 1, 3
    ]);

}

function prepareCoastlineVertexData(
    data
) {

    const vertices = [];

    function addLine(
        line
    ) {

        for (
            let i = 0;
            i < line.length - 1;
            i++
        ) {

            const start =
                line[i];

            const end =
                line[i + 1];

            vertices.push(
                start[0],
                start[1],
                end[0],
                end[1]
            );

        }

    }

    data.features.forEach(
        feature => {

            const geometry =
                feature.geometry;

            if (
                geometry.type ===
                "LineString"
            ) {

                addLine(
                    geometry.coordinates
                );

            }

            if (
                geometry.type ===
                "MultiLineString"
            ) {

                geometry.coordinates.forEach(
                    line => {

                        addLine(
                            line
                        );

                    }
                );

            }

        }
    );

    return new Float32Array(
        vertices
    );

}

function prepareWindDirectionVertexData(
    uData,
    vData
) {
    const vertices = [];

    const seedSpacing = 24;
    const minimumSpeed = 0.5;
    const stepLength = 0.7;
    const maximumSteps = 28;

    function latitudeFromMercatorY(y) {
        return (
            2 * Math.atan(
                Math.exp(y * Math.PI / 180)
            ) -
            Math.PI / 2
        ) * 180 / Math.PI;
    }

    function mercatorYFromLatitude(latitude) {
        const radians = latitude * Math.PI / 180;

        return Math.log(
            Math.tan(Math.PI / 4 + radians / 2)
        ) * 180 / Math.PI;
    }

    function sampleWind(longitude, mercatorY) {
        const latitude =
            latitudeFromMercatorY(mercatorY);

        if (Math.abs(latitude) > 85) {
            return null;
        }

        const row = (90 - latitude) / 0.25;
        const column =
            ((longitude + 180) / 0.25 + 1440) % 1440;

        const row0 = Math.floor(row);
        const row1 = Math.min(row0 + 1, 720);
        const col0 = Math.floor(column) % 1440;
        const col1 = (col0 + 1) % 1440;

        const fy = row - row0;
        const fx = column - Math.floor(column);

        const i00 = row0 * 1440 + col0;
        const i10 = row0 * 1440 + col1;
        const i01 = row1 * 1440 + col0;
        const i11 = row1 * 1440 + col1;

        function interpolate(data) {
            const top =
                data[i00] * (1 - fx) +
                data[i10] * fx;

            const bottom =
                data[i01] * (1 - fx) +
                data[i11] * fx;

            return top * (1 - fy) + bottom * fy;
        }

        const u = interpolate(uData);
        const v = interpolate(vData);
        const speed = Math.hypot(u, v);

        if (
            !Number.isFinite(speed) ||
            speed < minimumSpeed
        ) {
            return null;
        }

        return { u, v, speed };
    }

    function traceDirection(
        startLongitude,
        startY,
        direction
    ) {
        const points = [
            [startLongitude, startY]
        ];

        let longitude = startLongitude;
        let y = startY;

        for (let step = 0; step < maximumSteps; step++) {
            const wind1 = sampleWind(longitude, y);

            if (!wind1) {
                break;
            }

            const dx1 =
                direction * wind1.u / wind1.speed;

            const dy1 =
                direction * wind1.v / wind1.speed;

            const midpointLongitude =
                longitude + dx1 * stepLength * 0.5;

            const midpointY =
                y + dy1 * stepLength * 0.5;

            if (
                midpointLongitude <= -179.5 ||
                midpointLongitude >= 179.5
            ) {
                break;
            }

            const wind2 = sampleWind(
                midpointLongitude,
                midpointY
            );

            if (!wind2) {
                break;
            }

            longitude +=
                direction *
                wind2.u / wind2.speed *
                stepLength;

            y +=
                direction *
                wind2.v / wind2.speed *
                stepLength;

            if (
                longitude <= -179.5 ||
                longitude >= 179.5
            ) {
                break;
            }

            points.push([longitude, y]);
        }

        return points;
    }

    function addStreamline(points) {
        for (let i = 1; i < points.length; i++) {
            const [x1, y1] = points[i - 1];
            const [x2, y2] = points[i];

            vertices.push(
                x1,
                latitudeFromMercatorY(y1),
                x2,
                latitudeFromMercatorY(y2)
            );
        }
    }

    for (
        let row = 24;
        row < 697;
        row += seedSpacing
    ) {
        const latitude = 90 - row * 0.25;
        const seedY =
            mercatorYFromLatitude(latitude);

        for (
            let column = 24;
            column < 1416;
            column += seedSpacing
        ) {
            const longitude = -180 + column * 0.25;

            if (!sampleWind(longitude, seedY)) {
                continue;
            }

            const backward = traceDirection(
                longitude,
                seedY,
                -1
            );

            const forward = traceDirection(
                longitude,
                seedY,
                1
            );

            backward.reverse();

            addStreamline(
                backward.concat(forward.slice(1))
            );
        }
    }

    return new Float32Array(vertices);
}

function loadWebGLCoastline() {

    fetch(
        "data/coastline/ne_50m_coastline.geojson"
    )
        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Coastline GeoJSON could not be loaded."
                );

            }

            return response.json();

        })
        .then(data => {

            const coastlineVertices =
                prepareCoastlineVertexData(
                    data
                );

            coastlineBuffer =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                coastlineBuffer
            );

            gl.bufferData(
                gl.ARRAY_BUFFER,
                coastlineVertices,
                gl.STATIC_DRAW
            );

            coastlineVertexCount =
                coastlineVertices.length / 2;

            console.log(
                "WebGL coastline vertices:",
                coastlineVertexCount
            );

        })
        .catch(error => {

            console.error(
                "WebGL coastline loading failed:",
                error
            );

        });

}

function loadWebGLPrecipitation(
    forecastHour,
    onLoaded = null,
    precipitationType = "threeHour"
) {

    let filename;
    let previousFilename = null;

    const reconstructThreeHour =
        currentModel === "ECMWF" &&
        precipitationType !== "total";

    if (currentModel === "ECMWF") {

        if (reconstructThreeHour) {

            // The current cumulative total.
            filename =
                "data/ecmwf/ecmwf_precip_total_f" +
                String(forecastHour).padStart(3, "0") +
                "_u16.bin";

            // At +3, the cumulative total is itself the
            // first three-hour precipitation amount.
            if (forecastHour > 3) {
                previousFilename =
                    "data/ecmwf/ecmwf_precip_total_f" +
                    String(forecastHour - 3).padStart(3, "0") +
                    "_u16.bin";
            }

        } else {

            const accumulationType =
                precipitationType === "total"
                    ? "precip_total_"
                    : "precip_";

            filename =
                "data/ecmwf/ecmwf_" +
                accumulationType +
                "f" +
                String(forecastHour).padStart(3, "0") +
                "_u16.bin";
        }

    } else {

        // Preserve the existing GFS loading behaviour.
        filename =
            "data/gfs/gfs_precip_global_f" +
            String(forecastHour).padStart(3, "0") +
            "_u16.bin";
    }

    console.log(
        "Loading WebGL precipitation:",
        filename,
        previousFilename ? "minus " + previousFilename : ""
    );

    function fetchPackedPrecipitation(file) {
        return fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(
                        `WebGL precipitation file not found: ${file}`
                    );
                }

                return response.arrayBuffer();
            })
            .then(data => new Uint16Array(data));
    }

    const currentPromise =
        fetchPackedPrecipitation(filename);

    const previousPromise = previousFilename
        ? fetchPackedPrecipitation(previousFilename)
        : Promise.resolve(null);

    Promise.all([currentPromise, previousPromise])
        .then(([currentPacked, previousPacked]) => {

            precipitation =
                new Float32Array(currentPacked.length);

            for (let i = 0; i < currentPacked.length; i++) {

                const currentValue = currentPacked[i];

                if (reconstructThreeHour && previousPacked) {

                    const previousValue = previousPacked[i];

                    // Match the existing display's treatment of
                    // missing data, and avoid subtracting its
                    // 65535 missing-value marker.
                    if (
                        currentValue === 65535 ||
                        previousValue === 65535
                    ) {
                        precipitation[i] = 0;
                    } else {
                        precipitation[i] =
                            Math.max(
                                0,
                                currentValue - previousValue
                            ) / 10;
                    }

                } else {

                    // Preserve existing original and total decoding.
                    precipitation[i] =
                        currentValue === 65535
                            ? 0
                            : currentValue / 10;
                }
            }

            precipitationDataTexture =
                gl.createTexture();

            gl.activeTexture(gl.TEXTURE2);

            gl.bindTexture(
                gl.TEXTURE_2D,
                precipitationDataTexture
            );

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.LUMINANCE,
                1440,
                721,
                0,
                gl.LUMINANCE,
                gl.FLOAT,
                precipitation
            );

            console.log(
                "WebGL error after precipitation texture upload:",
                gl.getError()
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl.NEAREST
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl.NEAREST
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );

            gl.activeTexture(gl.TEXTURE0);

            draw();

            if (typeof onLoaded === "function") {
                onLoaded();
            }
        })
        .catch(error => {
            console.error(
                "Failed to load WebGL precipitation:",
                error
            );
        });
}


function loadWebGLWind(
    forecastHour,
    onLoaded = null
) {

    const hour =
        String(forecastHour).padStart(3, "0");

    const filenames = {
        u: `data/ecmwf/ecmwf_10u_f${hour}.bin`,
        v: `data/ecmwf/ecmwf_10v_f${hour}.bin`
    };

    console.log(
        "Loading ECMWF wind components:",
        filenames.u,
        filenames.v
    );

    Promise.all([
        fetch(filenames.u),
        fetch(filenames.v)
    ])
    .then(responses => {

        for (let i = 0; i < responses.length; i++) {
            if (!responses[i].ok) {
                throw new Error(
                    `Wind file not found: ${
                        i === 0 ? filenames.u : filenames.v
                    }`
                );
            }
        }

        return Promise.all(
            responses.map(response => response.arrayBuffer())
        );
    })
    .then(buffers => {

        const encodedU = new Int16Array(buffers[0]);
        const encodedV = new Int16Array(buffers[1]);

        if (
            encodedU.length !== 1440 * 721 ||
            encodedV.length !== 1440 * 721
        ) {
            throw new Error(
                "Unexpected ECMWF wind grid dimensions"
            );
        }

        windU = new Float32Array(encodedU.length);
        windV = new Float32Array(encodedV.length);

        for (let i = 0; i < encodedU.length; i++) {
            windU[i] = encodedU[i] / 10;
            windV[i] = encodedV[i] / 10;
        }

        const windDirectionVertices =
            prepareWindDirectionVertexData(
                windU,
                windV
            );

        if (windDirectionBuffer) {
            gl.deleteBuffer(windDirectionBuffer);
        }

        windDirectionBuffer = gl.createBuffer();

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            windDirectionBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            windDirectionVertices,
            gl.STATIC_DRAW
        );

        windDirectionVertexCount =
            windDirectionVertices.length / 2;

        // Initialise independent moving wind particles.

        windParticlePositions.length = 0;

        for (
            let i = 0;
            i < windParticleCount;
            i++
        ) {
            const particle = {
                longitude: 0,
                mercatorY: 0,
                age: 0
            };

            resetWindParticle(particle);

            windParticlePositions.push(particle);
        }

        if (windParticleBuffer) {
            gl.deleteBuffer(windParticleBuffer);
        }

        windParticleBuffer = gl.createBuffer();

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            windParticleBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(0),
            gl.DYNAMIC_DRAW
        );

        windParticleVertexCount = 0;

        function uploadWindTexture(data, textureUnit) {

            const texture = gl.createTexture();

            gl.activeTexture(textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.LUMINANCE,
                1440,
                721,
                0,
                gl.LUMINANCE,
                gl.FLOAT,
                data
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl.NEAREST
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl.NEAREST
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );

            return texture;
        }

        windUDataTexture =
            uploadWindTexture(windU, gl.TEXTURE3);

        windVDataTexture =
            uploadWindTexture(windV, gl.TEXTURE4);

        gl.activeTexture(gl.TEXTURE0);

        console.log(
            "ECMWF wind textures uploaded:",
            "u =", windU.length,
            "v =", windV.length,
            "WebGL error =", gl.getError()
        );

        startWindParticleAnimation();

        draw();

        if (typeof onLoaded === "function") {
            onLoaded();
        }
    })
    .catch(error => {
        console.error(
            "Failed to load ECMWF wind:",
            error
        );
    });
}


function loadWebGLForecast(
    forecastHour,
    model = "GFS",
    onLoaded = null
) {
    currentModel =
        model;

    let filename;

    if (model === "ECMWF") {

        filename =
            "data/ecmwf/ecmwf_2t_f" +
            String(forecastHour).padStart(3, "0") +
            ".bin";

    } else {

        filename =
            "data/gfs/gfs_temp_global_f" +
            String(forecastHour).padStart(3, "0") +
            ".bin";

    }

    console.log(
        "Loading WebGL forecast:",
        filename
    );

    console.log(
        "WebGL model:",
        model,
        "forecast hour:",
        forecastHour
    );    

    fetch(filename)
    .then(response => {

        if (!response.ok) {

            throw new Error(
                `WebGL forecast file not found: ${filename}`
            );

        }

        return response.arrayBuffer();

    })
    .then(data => {

            const encoded =
                new Int16Array(data);

            temperatures = [];

            for (
                let row = 0;
                row < 721;
                row++
            ) {

                temperatures.push(
                    Array.from(
                        encoded.slice(
                            row * 1440,
                            (row + 1) * 1440
                        ),
                        value => value / 10
                    )
                );

            }
              
            const quadIndexData =
                prepareQuadIndexData();
          
            indexBuffer =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                indexBuffer
            );

            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                quadIndexData,
                gl.STATIC_DRAW
            );

 
            // NEW: numerical temperature texture

            temperatureDataTexture =
                gl.createTexture();

            gl.activeTexture(
                gl.TEXTURE1
            );

            gl.bindTexture(
                gl.TEXTURE_2D,
                temperatureDataTexture
            );

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.LUMINANCE,
                temperatures[0].length,
                temperatures.length,
                0,
                gl.LUMINANCE,
                gl.FLOAT,
                new Float32Array(
                    temperatures.flat()
                )
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl.NEAREST
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl.NEAREST
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );

            gl.activeTexture(
                gl.TEXTURE0
            );            

            draw();

            if (typeof onLoaded === "function") {
                onLoaded();
            }
        });

}

canvas.width =
    canvas.clientWidth;

canvas.height =
    canvas.clientHeight;

gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);

    // -------------------------
    // Create vertex shader
    // -------------------------

    const vertexShader =
        gl.createShader(
            gl.VERTEX_SHADER
        );

    gl.shaderSource(
        vertexShader,
        vertexShaderSource
    );

    gl.compileShader(
        vertexShader
    );


    // -------------------------
    // Create fragment shader
    // -------------------------

    const fragmentShader =
        gl.createShader(
            gl.FRAGMENT_SHADER
        );

    gl.shaderSource(
        fragmentShader,
        fragmentShaderSource
    );

    gl.compileShader(
        fragmentShader
    );


    // -------------------------
    // Create shader program
    // -------------------------

    const program =
        gl.createProgram();

    gl.attachShader(
        program,
        vertexShader
    );

    gl.attachShader(
        program,
        fragmentShader
    );

    gl.linkProgram(
        program
    );

    // -------------------------
    // Create coastline shaders
    // -------------------------

    const coastlineVertexShader =
        gl.createShader(
            gl.VERTEX_SHADER
        );

    gl.shaderSource(
        coastlineVertexShader,
        coastlineVertexShaderSource
    );

    gl.compileShader(
        coastlineVertexShader
    );

    if (
        !gl.getShaderParameter(
            coastlineVertexShader,
            gl.COMPILE_STATUS
        )
    ) {

        throw new Error(
            gl.getShaderInfoLog(
                coastlineVertexShader
            )
        );

    }


    const coastlineFragmentShader =
        gl.createShader(
            gl.FRAGMENT_SHADER
        );

    gl.shaderSource(
        coastlineFragmentShader,
        coastlineFragmentShaderSource
    );

    gl.compileShader(
        coastlineFragmentShader
    );

    if (
        !gl.getShaderParameter(
            coastlineFragmentShader,
            gl.COMPILE_STATUS
        )
    ) {

        throw new Error(
            gl.getShaderInfoLog(
                coastlineFragmentShader
            )
        );

    }


    // -------------------------
    // Create coastline program
    // -------------------------

    const coastlineProgram =
        gl.createProgram();

    gl.attachShader(
        coastlineProgram,
        coastlineVertexShader
    );

    gl.attachShader(
        coastlineProgram,
        coastlineFragmentShader
    );

    gl.linkProgram(
        coastlineProgram
    );

    if (
        !gl.getProgramParameter(
            coastlineProgram,
            gl.LINK_STATUS
        )
    ) {

        throw new Error(
            gl.getProgramInfoLog(
                coastlineProgram
            )
        );

    }

    console.log(
        "WebGL coastline shader program ready."
    );

    const coastlinePosition =
        gl.getAttribLocation(
            coastlineProgram,
            "position"
        );

    const coastlineMapOrigin =
        gl.getUniformLocation(
            coastlineProgram,
            "mapOrigin"
        );

    const coastlineMapScale =
        gl.getUniformLocation(
            coastlineProgram,
            "mapScale"
        );

    const coastlineWorldOffset =
        gl.getUniformLocation(
            coastlineProgram,
            "worldOffset"
        );

    const coastlineLineColor =
        gl.getUniformLocation(
            coastlineProgram,
            "lineColor"
        );
    // -------------------------
    // Create wind particle program
    // -------------------------

    const windParticleVertexShader =
        gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(
        windParticleVertexShader,
        windParticleVertexShaderSource
    );

    gl.compileShader(windParticleVertexShader);

    if (
        !gl.getShaderParameter(
            windParticleVertexShader,
            gl.COMPILE_STATUS
        )
    ) {
        throw new Error(
            gl.getShaderInfoLog(windParticleVertexShader)
        );
    }

    const windParticleFragmentShader =
        gl.createShader(
            gl.FRAGMENT_SHADER
        );

    gl.shaderSource(
        windParticleFragmentShader,
        windParticleFragmentShaderSource
    );

    gl.compileShader(
        windParticleFragmentShader
    );

    if (
        !gl.getShaderParameter(
            windParticleFragmentShader,
            gl.COMPILE_STATUS
        )
    ) {
        throw new Error(
            gl.getShaderInfoLog(
                windParticleFragmentShader
            )
        );
    }

    const windParticleProgram =
        gl.createProgram();

    gl.attachShader(
        windParticleProgram,
        windParticleVertexShader
    );

    gl.attachShader(
        windParticleProgram,
        windParticleFragmentShader
    );

    gl.linkProgram(
        windParticleProgram
    );

    if (
        !gl.getProgramParameter(
            windParticleProgram,
            gl.LINK_STATUS
        )
    ) {
        throw new Error(
            gl.getProgramInfoLog(
                windParticleProgram
            )
        );
    }

    const windParticlePosition =
        gl.getAttribLocation(
            windParticleProgram,
            "position"
        );

    const windParticleOffset =
        gl.getAttribLocation(
            windParticleProgram,
            "particleOffset"
        );

    const windParticleMapOrigin =
        gl.getUniformLocation(
            windParticleProgram,
            "mapOrigin"
        );

    const windParticleMapScale =
        gl.getUniformLocation(
            windParticleProgram,
            "mapScale"
        );

    const windParticleWorldOffset =
        gl.getUniformLocation(
            windParticleProgram,
            "worldOffset"
        );

    // -------------------------
    // Find shader attributes
    // -------------------------

    const position =
        gl.getAttribLocation(
            program,
            "position"
        );

    const mapOrigin =
        gl.getUniformLocation(
            program,
            "mapOrigin"
        );

    const mapScale =
        gl.getUniformLocation(
            program,
            "mapScale"
        );

    const worldOffset =
        gl.getUniformLocation(
            program,
            "worldOffset"
        );

    const temperatureDataTextureLocation =
        gl.getUniformLocation(
            program,
            "temperatureDataTexture"
        );

    const precipitationDataTextureLocation =
        gl.getUniformLocation(
            program,
            "precipitationDataTexture"
        );

    const windUDataTextureLocation =
        gl.getUniformLocation(
            program,
            "windUDataTexture"
        );

    const windVDataTextureLocation =
        gl.getUniformLocation(
            program,
            "windVDataTexture"
        );

    const weatherFieldLocation =
        gl.getUniformLocation(
            program,
            "weatherField"
        );   

    const weatherOpacityLocation =
        gl.getUniformLocation(
            program,
            "weatherOpacity"
        );        

    const precipitationRenderModeLocation =
        gl.getUniformLocation(
            program,
            "precipitationRenderMode"
        );
    const temperatureRenderModeLocation =
        gl.getUniformLocation(
            program,
            "temperatureRenderMode"
        );
    const windRenderModeLocation =
        gl.getUniformLocation(
            program,
            "windRenderMode"
        );
    const flipLatitudeLocation =
        gl.getUniformLocation(
            program,
            "flipLatitude"
        );   

    const shiftLongitudeLocation =
        gl.getUniformLocation(
            program,
            "shiftLongitude"
        );

    let temperatures = null;
    let precipitation = null;
    let windU = null;
    let windV = null;
    let temperatureVisible = false;
    let precipitationVisible = false;
    let precipitationRenderMode = 5;
    let temperatureRenderMode = 1;
    let windRenderMode = 1;
    let weatherOpacity = 1.0;
    let windVisible = false;
    let windParticlesVisible = false;
    let indexBuffer = null;
    let temperatureDataTexture = null;
    let precipitationDataTexture = null;
    let windUDataTexture = null;
    let windVDataTexture = null;    
    let currentModel = "GFS";
    function temperatureColour(
        temperature
    ) {

        const minimum = -5;
        const maximum = 35;

        let t =
            (temperature - minimum) /
            (maximum - minimum);

        t =
            Math.max(
                0,
                Math.min(1, t)
            );

        if (t < 0.33) {

            const p =
                t / 0.33;

            return [
                0.1 + p * 0.2,
                0.2 + p * 0.5,
                0.8 + p * 0.1
            ];

        }

        if (t < 0.66) {

            const p =
                (t - 0.33) / 0.33;

            return [
                0.3 + p * 0.6,
                0.7 + p * 0.1,
                0.9 - p * 0.6
            ];

        }

        const p =
            (t - 0.66) / 0.34;

        return [
            0.9 + p * 0.0,
            0.8 - p * 0.6,
            0.3 - p * 0.2
        ];

    }


    const buffer =
        gl.createBuffer();

    const quadVertexData =
        prepareQuadVertexData();

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        buffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        quadVertexData,
        gl.STATIC_DRAW
    );        

    let coastlineBuffer = null;

    let coastlineVertexCount = 0;

    let coastlineVisible = true;

    let windDirectionBuffer = null;

    let windDirectionVertexCount = 0;

    let windDirectionVisible = true;

    let windParticleBuffer = null;

    let windParticleVertexCount = 0;

    const windParticleCount = 3000;

    const windParticlePositions = [];

    let windParticleAnimationFrame = null;

    let windParticleLastTime = 0;

    let particleMapScaleX = 1;
    let particleMapScaleY = 1;

    function sampleParticleWind(longitude, mercatorY) {

        const latitude =
            (2 * Math.atan(
                Math.exp(mercatorY * Math.PI / 180)
            ) - Math.PI / 2) * 180 / Math.PI;

        if (
            !windU ||
            !windV ||
            Math.abs(latitude) > 85
        ) {
            return null;
        }

        const row = (90 - latitude) / 0.25;

        const column =
            ((longitude + 180) / 0.25 + 1440) % 1440;

        const row0 = Math.floor(row);
        const row1 = Math.min(row0 + 1, 720);

        const col0 = Math.floor(column) % 1440;
        const col1 = (col0 + 1) % 1440;

        const fy = row - row0;
        const fx = column - Math.floor(column);

        const i00 = row0 * 1440 + col0;
        const i10 = row0 * 1440 + col1;
        const i01 = row1 * 1440 + col0;
        const i11 = row1 * 1440 + col1;

        function interpolate(data) {

            const top =
                data[i00] * (1 - fx) +
                data[i10] * fx;

            const bottom =
                data[i01] * (1 - fx) +
                data[i11] * fx;

            return top * (1 - fy) + bottom * fy;
        }

        const u = interpolate(windU);
        const v = interpolate(windV);
        const speed = Math.hypot(u, v);

        if (
            !Number.isFinite(speed) ||
            speed < 0.5
        ) {
            return null;
        }

        return { u, v, speed };
    }

    function resetWindParticle(particle) {

        particle.longitude =
            -180 + Math.random() * 360;

        particle.mercatorY =
            -179 + Math.random() * 358;

        particle.age = Math.random() * 100;
    }

    function updateWindParticles(deltaTime) {

const vertices = [];

const movementScale = 0.012;
const dashLength = 20.0;
const halfWidthPixels = 1.0;

const canvasWidth = Math.max(canvas.clientWidth, 1);
const canvasHeight = Math.max(canvas.clientHeight, 1);

function latitudeFromMercatorY(y) {
    return (
        2 * Math.atan(
            Math.exp(y * Math.PI / 180)
        ) - Math.PI / 2
    ) * 180 / Math.PI;
}

function addParticleQuad(
    startLongitude,
    startY,
    endLongitude,
    endY
) {
    const startLatitude =
        latitudeFromMercatorY(startY);

    const endLatitude =
        latitudeFromMercatorY(endY);

    const startMercator =
        Math.log(
            Math.tan(
                Math.PI / 4 +
                startLatitude * Math.PI / 360
            )
        );

    const endMercator =
        Math.log(
            Math.tan(
                Math.PI / 4 +
                endLatitude * Math.PI / 360
            )
        );

    const dxPixels =
        (
            (endLongitude - startLongitude) / 180
        ) * particleMapScaleX * canvasWidth / 2;

    const dyPixels =
        (endMercator - startMercator) *
        particleMapScaleY * canvasHeight / 2;

    const length = Math.hypot(dxPixels, dyPixels);

    if (length < 0.001) {
        return;
    }

    const offsetX =
        (-dyPixels / length) *
        halfWidthPixels * 2 / canvasWidth;

    const offsetY =
        (dxPixels / length) *
        halfWidthPixels * 2 / canvasHeight;

    function vertex(longitude, latitude, side) {
        vertices.push(
            longitude,
            latitude,
            offsetX * side,
            offsetY * side
        );
    }

    // Two triangles forming one thick dash.
    vertex(startLongitude, startLatitude, 1);
    vertex(startLongitude, startLatitude, -1);
    vertex(endLongitude, endLatitude, 1);

    vertex(endLongitude, endLatitude, 1);
    vertex(startLongitude, startLatitude, -1);
    vertex(endLongitude, endLatitude, -1);
}

        for (const particle of windParticlePositions) {

            const wind = sampleParticleWind(
                particle.longitude,
                particle.mercatorY
            );

            if (!wind) {
                resetWindParticle(particle);
                continue;
            }

            const speedFactor =
                Math.min(wind.speed, 30);

            const dx =
                wind.u / wind.speed *
                speedFactor *
                movementScale *
                deltaTime;

            const dy =
                wind.v / wind.speed *
                speedFactor *
                movementScale *
                deltaTime;

            particle.longitude += dx;
            particle.mercatorY += dy;
            particle.age += deltaTime;

            const particleLatitude =
                (2 * Math.atan(
                    Math.exp(particle.mercatorY * Math.PI / 180)
                ) - Math.PI / 2) * 180 / Math.PI;

            if (
                particle.longitude < -180 ||
                particle.longitude > 180 ||
                Math.abs(particleLatitude) > 85 ||
                particle.age > 180
            ) {
                resetWindParticle(particle);
                continue;
            }

        const trailSpeedFactor =
            Math.sqrt(Math.max(wind.speed, 1));

        const tailLongitude =
            particle.longitude - dx * dashLength / trailSpeedFactor;

        const tailMercatorY =
            particle.mercatorY - dy * dashLength / trailSpeedFactor;

        addParticleQuad(
            tailLongitude,
            tailMercatorY,
            particle.longitude,
            particle.mercatorY
        );
        }

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            windParticleBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            gl.DYNAMIC_DRAW
        );

        windParticleVertexCount =
            vertices.length / 4;
    }

    function animateWindParticles(timestamp) {

        windParticleAnimationFrame = null;

        if (
            !windParticlesVisible ||
            !windU ||
            !windV ||
            !windParticleBuffer
        ) {
            return;
        }

        if (windParticleLastTime === 0) {
            windParticleLastTime = timestamp;
        }

        const deltaTime = Math.min(
            (timestamp - windParticleLastTime) / 16.67,
            3
        );

        windParticleLastTime = timestamp;

        updateWindParticles(deltaTime);

        draw();

        windParticleAnimationFrame =
            requestAnimationFrame(
                animateWindParticles
            );
    }

    function startWindParticleAnimation() {

        if (
            windParticleAnimationFrame === null &&
            windParticlesVisible &&
            windU &&
            windV &&
            windParticleBuffer
        ) {
            windParticleLastTime = 0;

            windParticleAnimationFrame =
                requestAnimationFrame(
                    animateWindParticles
                );
        }
    }

    function stopWindParticleAnimation() {

        if (windParticleAnimationFrame !== null) {

            cancelAnimationFrame(
                windParticleAnimationFrame
            );

            windParticleAnimationFrame = null;
        }

        windParticleLastTime = 0;
    }

    function draw() {

        if (
            !temperatures &&
            !precipitationDataTexture
        ) {
            return;
        }

        const width =
            canvas.clientWidth;

        const height =
            canvas.clientHeight;


        canvas.width = width;
        canvas.height = height;

        gl.viewport(
            0,
            0,
            width,
            height
        );

        gl.clearColor(
            0.0,
            0.0,
            0.0,
            0.0,
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT
        );

        gl.useProgram(
            program
        );

        gl.enable(
            gl.BLEND
        );

        gl.blendFuncSeparate(
            gl.SRC_ALPHA,
            gl.ONE_MINUS_SRC_ALPHA,
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA
        );

        gl.uniform1i(
            temperatureDataTextureLocation,
            1
        );

        gl.uniform1i(
            precipitationDataTextureLocation,
            2
        );    
        gl.uniform1i(
            windUDataTextureLocation,
            3
        );

        gl.uniform1i(
            windVDataTextureLocation,
            4
        );

        gl.uniform1f(
            weatherFieldLocation,
            0.0
        );  
        
        gl.uniform1f(
            weatherOpacityLocation,
            weatherOpacity
        );        

        gl.uniform1f(
            precipitationRenderModeLocation,
            0.0
        );

        console.log(
            "WebGL layers:",
            "temperature =", temperatureVisible,
            "precipitation =", precipitationVisible
        );
        gl.uniform1f(
            flipLatitudeLocation,
            currentModel === "ECMWF"
                ? 1.0
                : 0.0
        );    

        gl.uniform1f(
            shiftLongitudeLocation,
            currentModel === "ECMWF"
                ? 0.0
                : 1.0
        );

        const zoom =
            map.getZoom();

        const originPoint =
            map.latLngToContainerPoint(
                [0, 0]
            );

        const projectedOrigin =
            map.project(
                [0, 0],
                zoom
            );

        const projectedLongitude =
            map.project(
                [0, 1],
                zoom
            );

        const projectedLatitude =
            map.project(
                [1, 0],
                zoom
            );

        const mapOriginX =
            (originPoint.x / width) * 2 - 1;

        const mapOriginY =
            1 -
            (originPoint.y / height) * 2;

        const mapScaleX =
            (
                (projectedLongitude.x -
                    projectedOrigin.x) /
                width
            ) * 2 * 180;

        const worldWidth =
            mapScaleX * 2;

        const mapScaleY =
            -(
                (projectedLatitude.y -
                    projectedOrigin.y) /
                height
            ) * 2 * 57.295779513;

        particleMapScaleX = mapScaleX;
        particleMapScaleY = mapScaleY;

        gl.uniform2f(
            mapOrigin,
            mapOriginX,
            mapOriginY
        );

        gl.uniform2f(
            mapScale,
            mapScaleX,
            mapScaleY
        );

        gl.uniform1f(
            worldOffset,
            0.0
        );
 
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            buffer
        );

        gl.enableVertexAttribArray(
            position
        );

        gl.vertexAttribPointer(
            position,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        if (!indexBuffer) {

            indexBuffer =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                indexBuffer
            );

            const quadIndexData =
                prepareQuadIndexData();

            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                quadIndexData,
                gl.STATIC_DRAW
            );

        } else {

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                indexBuffer
            );

        }

        if (temperatureVisible) {
            gl.uniform1f(
                temperatureRenderModeLocation,
                temperatureRenderMode
            );
            gl.uniform1f(
                worldOffset,
                -worldWidth
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.uniform1f(
                worldOffset,
                0.0
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.uniform1f(
                worldOffset,
                worldWidth
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );
        }

       if (
            windVisible &&
            windUDataTexture &&
            windVDataTexture
        ) {

            gl.uniform1f(
                weatherFieldLocation,
                2.0
            );
            gl.uniform1f(
                windRenderModeLocation,
                windRenderMode
            );
            gl.uniform1f(
                precipitationRenderModeLocation,
                0.0
            );

            gl.uniform1f(
                worldOffset,
                -worldWidth
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.uniform1f(
                worldOffset,
                0.0
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.uniform1f(
                worldOffset,
                worldWidth
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );
        }

        if (
            precipitationVisible &&
            precipitationDataTexture
        ) {

            gl.uniform1f(
                weatherFieldLocation,
                1.0
            );

            gl.uniform1f(
                precipitationRenderModeLocation,
                precipitationRenderMode
            );

            gl.uniform1f(
                worldOffset,
                -worldWidth
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.uniform1f(
                worldOffset,
                0.0
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.uniform1f(
                worldOffset,
                worldWidth
            );

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );
        }

        if (
            windDirectionVisible &&
            windDirectionBuffer &&
            windDirectionVertexCount > 0
        ) {
            gl.useProgram(coastlineProgram);

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                windDirectionBuffer
            );

            gl.enableVertexAttribArray(
                coastlinePosition
            );

            gl.vertexAttribPointer(
                coastlinePosition,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );

            gl.uniform2f(
                coastlineMapOrigin,
                mapOriginX,
                mapOriginY
            );

            gl.uniform2f(
                coastlineMapScale,
                mapScaleX,
                mapScaleY
            );

            gl.uniform4f(
                coastlineLineColor,
                0.45,
                0.45,
                0.45,
                0.55
            );

            gl.uniform1f(
                coastlineWorldOffset,
                -worldWidth
            );

            gl.drawArrays(
                gl.LINES,
                0,
                windDirectionVertexCount
            );

            gl.uniform1f(
                coastlineWorldOffset,
                0.0
            );

            gl.drawArrays(
                gl.LINES,
                0,
                windDirectionVertexCount
            );

            gl.uniform1f(
                coastlineWorldOffset,
                worldWidth
            );

            gl.drawArrays(
                gl.LINES,
                0,
                windDirectionVertexCount
            );
        }

        // -------------------------
        // Draw wind particle dashes
        // -------------------------

        if (
            windParticlesVisible &&
            windParticleBuffer &&
            windParticleVertexCount > 0
        ) {
            gl.useProgram(windParticleProgram);

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                windParticleBuffer
            );

            gl.enableVertexAttribArray(
                windParticlePosition
            );

            gl.vertexAttribPointer(
                windParticlePosition,
                2,
                gl.FLOAT,
                false,
                16,
                0
            );

            gl.enableVertexAttribArray(
                windParticleOffset
            );

            gl.vertexAttribPointer(
                windParticleOffset,
                2,
                gl.FLOAT,
                false,
                16,
                8
            );

            gl.uniform2f(
                windParticleMapOrigin,
                mapOriginX,
                mapOriginY
            );

            gl.uniform2f(
                windParticleMapScale,
                mapScaleX,
                mapScaleY
            );

            gl.uniform1f(
                windParticleWorldOffset,
                -worldWidth
            );

            gl.drawArrays(
                gl.TRIANGLES,
                0,
                windParticleVertexCount
            );

            gl.uniform1f(
                windParticleWorldOffset,
                0.0
            );

            gl.drawArrays(
                gl.TRIANGLES,
                0,
                windParticleVertexCount
            );

            gl.uniform1f(
                windParticleWorldOffset,
                worldWidth
            );

            gl.drawArrays(
                gl.TRIANGLES,
                0,
                windParticleVertexCount
            );
        }

        if (coastlineVisible && coastlineBuffer) {

            gl.useProgram(
                coastlineProgram
            );

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                coastlineBuffer
            );

            gl.enableVertexAttribArray(
                coastlinePosition
            );

            gl.vertexAttribPointer(
                coastlinePosition,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );

            gl.uniform2f(
                coastlineMapOrigin,
                mapOriginX,
                mapOriginY
            );

            gl.uniform2f(
                coastlineMapScale,
                mapScaleX,
                mapScaleY
            );

            gl.uniform4f(
                coastlineLineColor,
                0.05,
                0.05,
                0.05,
                0.55
            );

            gl.uniform1f(
                coastlineWorldOffset,
                -worldWidth
            );

            gl.drawArrays(
                gl.LINES,
                0,
                coastlineVertexCount
            );

            gl.uniform1f(
                coastlineWorldOffset,
                0.0
            );

            gl.drawArrays(
                gl.LINES,
                0,
                coastlineVertexCount
            );

            gl.uniform1f(
                coastlineWorldOffset,
                worldWidth
            );

            gl.drawArrays(
                gl.LINES,
                0,
                coastlineVertexCount
            );

        }        

    }

    loadWebGLCoastline();

    if (temperatures) {

        draw();

    }

    function getWeatherValue(
        row,
        column,
        variable
    ) {

        if (variable === "temperature") {

            if (!temperatures) {
                return null;
            }

            return temperatures[row][column];

        }


        if (variable === "precipitation") {

            if (!precipitation) {
                return null;
            }

            return precipitation[
                row * 1440 + column
            ];

        }

        if (variable === "wind") {

            if (!windU || !windV) {
                return null;
            }

            const index = row * 1440 + column;

            const u = windU[index];
            const v = windV[index];

            return Math.sqrt(u * u + v * v);

        }

        return null;

    }

    map.on("move", draw);
    map.on("zoom", draw);

    return {
        gl: gl,
        loadForecast: loadWebGLForecast,

        loadPrecipitation:
            loadWebGLPrecipitation,
        loadWind: loadWebGLWind,
        setOpacity:
            (opacity) => {
                weatherOpacity = opacity;

                draw();
            },

        getWeatherValue:
            getWeatherValue,

        getModel:
            () => {
                return currentModel;
            },

        setModel:
            (model) => {
                currentModel =
                    model;

                precipitationDataTexture =
                    null;
            },

        getVisibleLayers: () => {
            return {
                temperature: temperatureVisible,
                precipitation: precipitationVisible,
                wind: windVisible
            };
        },

        setTemperatureVisible:
            (visible) => {
                temperatureVisible =
                    visible;

                draw();
            },

        setPrecipitationVisible:
            (visible) => {
                precipitationVisible =
                    visible;

                draw();
            },

        setWindVisible: (visible) => {
            windVisible = visible;
            draw();
        },

        setWindParticlesVisible: (visible) => {
            windParticlesVisible = visible;

            if (visible) {
                startWindParticleAnimation();
            } else {
                stopWindParticleAnimation();
            }

            draw();
        },

        setWindDirectionVisible: (visible) => {
            windDirectionVisible = visible;
            draw();
        },

        setPrecipitationRenderMode:
            (mode) => {
                precipitationRenderMode =
                    mode;

                draw();
            },
        setTemperatureRenderMode:
            (mode) => {
                temperatureRenderMode =
                    mode;

                draw();
            },

        setWindRenderMode:
            (mode) => {
                windRenderMode =
                    mode;

                draw();
            },

        setCoastlineVisible:
            (visible) => {
                coastlineVisible =
                    visible;

                draw();
            }
    };
}
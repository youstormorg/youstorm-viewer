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
    uniform float flipLatitude;
    uniform float shiftLongitude;
    uniform float weatherField;
    uniform float weatherOpacity;
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

    float precipitationValue =
        texture2D(
            precipitationDataTexture,
            dataTexCoord
        ).r;

    float fieldValue =
        weatherField < 0.5
            ? temperature
            : precipitationValue;

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
} else {

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
}

    gl_FragColor =
        vec4(
            colour,
            weatherOpacity
        );

    }
`;

const coastlineFragmentShaderSource = `
    precision mediump float;

    void main() {

        gl_FragColor =
            vec4(
                0.05,
                0.05,
                0.05,
                0.9
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
    onLoaded = null
) {

    let filename;

    if (currentModel === "ECMWF") {

        filename =
            "data/ecmwf/ecmwf_precip_f" +
            String(forecastHour).padStart(3, "0") +
            "_u16.bin";

    } else {

        filename =
            "data/gfs/gfs_precip_global_f" +
            String(forecastHour).padStart(3, "0") +
            "_u16.bin";
    }

    console.log(
        "Loading WebGL precipitation:",
        filename
    );

    fetch(filename)
        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `WebGL precipitation file not found: ${filename}`
                );

            }

            return response.arrayBuffer();

        })
        .then(data => {

            const packedPrecipitation =
                new Uint16Array(data);

            precipitation =
                new Float32Array(
                    packedPrecipitation.length
                );

            for (
                let i = 0;
                i < packedPrecipitation.length;
                i++
            ) {

                precipitation[i] =
                    packedPrecipitation[i] === 65535
                        ? 0
                        : packedPrecipitation[i] / 10;
            }

            precipitationDataTexture =
                gl.createTexture();

            gl.activeTexture(
                gl.TEXTURE2
            );

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

            gl.activeTexture(
                gl.TEXTURE0
            );

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

    let temperatureVisible = false;
    let precipitationVisible = false;
    let weatherOpacity = 1.0;

    let indexBuffer = null;
    let temperatureDataTexture = null;
    let precipitationDataTexture = null;
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

        gl.blendFunc(
            gl.SRC_ALPHA,
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
        
        gl.uniform1f(
            weatherFieldLocation,
            0.0
        );  
        
        gl.uniform1f(
            weatherOpacityLocation,
            weatherOpacity
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

        if (coastlineBuffer) {

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

        return null;
    }

    map.on("move", draw);
    map.on("zoom", draw);

    return {
        gl: gl,
        loadForecast: loadWebGLForecast,

        loadPrecipitation:
            loadWebGLPrecipitation,

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

        getVisibleLayers:
            () => {
                return {
                    temperature:
                        temperatureVisible,

                    precipitation:
                        precipitationVisible
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
            }
    };
}
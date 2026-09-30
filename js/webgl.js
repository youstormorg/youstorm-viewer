const vertexShaderSource = `
    attribute vec2 position;

    varying float vMercatorY;
    varying float vLongitude;

    uniform vec2 mapOrigin;
    uniform vec2 mapScale;

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


const fragmentShaderSource = `
    precision mediump float;

    varying float vMercatorY;
    varying float vLongitude;

    uniform sampler2D temperatureDataTexture;
    uniform sampler2D precipitationDataTexture;
    uniform float flipLatitude;
    uniform float shiftLongitude;
    uniform float weatherField;
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

    float minimum =
        -5.0;

    float maximum =
        35.0;

    float t =
        (temperature - minimum) /
        (maximum - minimum);

    t =
        clamp(
            t,
            0.0,
            1.0
        );

    if (t < 0.33) {

        float p =
            t / 0.33;

        colour =
            vec3(
                0.1 + p * 0.2,
                0.2 + p * 0.5,
                0.8 + p * 0.1
            );

    } else if (t < 0.66) {

        float p =
            (t - 0.33) / 0.33;

        colour =
            vec3(
                0.3 + p * 0.6,
                0.7 + p * 0.1,
                0.9 - p * 0.6
            );

    } else {

        float p =
            (t - 0.66) / 0.34;

        colour =
            vec3(
                0.9,
                0.8 - p * 0.6,
                0.3 - p * 0.2
            );
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
            1.0
        );

    }
`;


export function initialiseWebGL(map) {

    const canvas =
        document.getElementById("weatherWebGL");

    const gl =
        canvas.getContext("webgl");

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

function loadWebGLPrecipitation(
    forecastHour
) {

    const filename =
        "data/gfs/gfs_precip_global_f" +
        String(forecastHour).padStart(3, "0") +
        ".bin";

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

            precipitation =
                new Float32Array(data);

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

            console.log(
                "WebGL precipitation texture uploaded:",
                1440,
                "×",
                721
            );

            console.log(
                "WebGL precipitation loaded:",
                precipitation
            );

            console.log(
                "WebGL precipitation values:",
                precipitation.length
            );

            console.log(
                "WebGL precipitation first value:",
                precipitation[0]
            );

            let precipitationMaximum =
                0;

            for (
                let i = 0;
                i < precipitation.length;
                i++
            ) {

                if (
                    precipitation[i] >
                    precipitationMaximum
                ) {

                    precipitationMaximum =
                        precipitation[i];

                }

            }

            console.log(
                "WebGL precipitation maximum:",
                precipitationMaximum
            );

            draw();
        });

}

function loadWebGLForecast(
    forecastHour,
    model = "GFS"
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

            console.log(
                "WebGL forecast loaded:",
                data
            );

            if (model === "ECMWF") {

                console.log(
                    "ECMWF binary values:",
                    new Int16Array(data).length
                );

            }

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
              
            const quadVertexData =
                prepareQuadVertexData();

            console.log(
                "WebGL quad vertex buffer size:",
                quadVertexData.byteLength,
                "bytes"
            );

            const quadIndexData =
                prepareQuadIndexData();

            console.log(
                "WebGL quad index buffer size:",
                quadIndexData.byteLength,
                "bytes"
            );           

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                buffer
            );

            gl.bufferData(
                gl.ARRAY_BUFFER,
                quadVertexData,
                gl.STATIC_DRAW
            );   
            
            console.log(
                "WebGL temperature texture data size:",
                temperatures.length *
                temperatures[0].length *
                3,
                "bytes"
            );            

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

            const dataTextureUploadStart =
                performance.now();

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

            console.log(
                "Numerical texture upload time:",
                (performance.now() - dataTextureUploadStart).toFixed(1),
                "ms"
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

            console.log(
                "Temperature texture uploaded:",
                temperatures[0].length,
                "×",
                temperatures.length
            );


            console.log(
                "WebGL forecast first temperature:",
                temperatures[0][0]
            );
            console.log(
                "WebGL grid:",
                temperatures.length,
                "rows ×",
                temperatures[0].length,
                "columns"
            );

            draw();
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
        
    console.log(
        "weatherField uniform location:",
        weatherFieldLocation
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


    function draw() {

        if (
            !temperatures &&
            !precipitationDataTexture
        ) {
            return;
        }

        console.log(
            "WebGL draw triggered"
        );
        const drawStart =
            performance.now();

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
            1,
            1,
            1,
            0,
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

            gl.drawElements(
                gl.TRIANGLES,
                6,
                gl.UNSIGNED_SHORT,
                0
            );

        }

        console.log(
            "WebGL draw time:",
            (performance.now() - drawStart).toFixed(1),
            "ms"
        );        

    }

    if (temperatures) {

        draw();

    }

    map.on("move", draw);
    map.on("zoom", draw);

    return {
        gl: gl,
        loadForecast: loadWebGLForecast,

        loadPrecipitation:
            loadWebGLPrecipitation,

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
const vertexShaderSource = `
    attribute vec2 position;
    attribute vec3 colour;

    varying vec3 vColour;

    void main() {

        gl_Position =
            vec4(position, 0.0, 1.0);

        vColour = colour;

    }
`;


const fragmentShaderSource = `
    precision mediump float;

    varying vec3 vColour;

    void main() {

        gl_FragColor =
            vec4(vColour, 1.0);

    }
`;


export function initialiseWebGL(map) {

    const canvas =
        document.getElementById("weatherWebGL");

    const gl =
        canvas.getContext("webgl");

    if (!gl) {

        console.warn(
            "WebGL is not available."
        );

        return null;

    }

console.log(
    "WebGL is available."
);

function loadWebGLForecast(
    forecastHour
) {

    const filename =
        "data/gfs/gfs_temp_global_f" +
        String(forecastHour).padStart(3, "0") +
        ".json";

    console.log(
        "Loading WebGL forecast:",
        filename
    );

    fetch(filename)
    .then(response => {

        if (!response.ok) {

            throw new Error(
                `WebGL forecast file not found: ${filename}`
            );

        }

        return response.json();

    })
    .then(data => {

            console.log(
                "WebGL forecast loaded:",
                data
            );
            temperatures =
                data.temperature;
            console.log(
                "WebGL forecast first temperature:",
                temperatures[0][0]
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

    const colour =
        gl.getAttribLocation(
            program,
            "colour"
        );


    let temperatures = null;
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
            0.0
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT
        );


        gl.useProgram(
            program
        );


        const vertices = [];
        const colours = [];


        const west = 0;
        const east = 359.75;
        const south = -90;
        const north = 90;


        const rows =
    temperatures.length;

        const columns =
            temperatures[0].length;
        const longitudeOffset =
            Math.floor(columns / 2);
        const cellRows =
            rows - 1;

        const cellColumns =
            columns - 1;


        for (
            let row = 0;
            row < cellRows;
            row++
        ) {

            for (
                let column = 0;
                column < cellColumns;
                column++
            ) {

                const lon1 =
                    -180 +
                    360 *
                    column /
                    cellColumns;

                const lon2 =
                    -180 +
                    360 *
                    (column + 1) /
                    cellColumns;

                const lat1 =
                    south +
                    (north - south) *
                    row /
                    cellRows;

                const lat2 =
                    south +
                    (north - south) *
                    (row + 1) /
                    cellRows;


                const p1 =
                    map.latLngToContainerPoint(
                        [lat1, lon1]
                    );

                const p2 =
                    map.latLngToContainerPoint(
                        [lat2, lon2]
                    );


                const x1 =
                    (p1.x / width) * 2 - 1;

                const x2 =
                    (p2.x / width) * 2 - 1;

                const y1 =
                    1 -
                    (p1.y / height) * 2;

                const y2 =
                    1 -
                    (p2.y / height) * 2;


                const shiftedColumn =
                    (column - longitudeOffset + columns) % columns;

                const shiftedColumnNext =
                    (column + 1 - longitudeOffset + columns) % columns;

                const colour1 =
                    temperatureColour(
                        temperatures[row][shiftedColumn]
                    );

                const colour2 =
                    temperatureColour(
                        temperatures[row][shiftedColumnNext]
                    );

                const colour3 =
                    temperatureColour(
                        temperatures[row + 1][shiftedColumn]
                    );

                const colour4 =
                    temperatureColour(
                        temperatures[row + 1][shiftedColumnNext]
                    );


                vertices.push(

                    x1, y2,
                    x2, y2,
                    x1, y1,

                    x1, y1,
                    x2, y2,
                    x2, y1

                );


                colours.push(
                    ...colour3,
                    ...colour4,
                    ...colour1,

                    ...colour1,
                    ...colour4,
                    ...colour2
                );

            }

        }


        const vertexData =
            new Float32Array(
                vertices
            );

        const colourData =
            new Float32Array(
                colours
            );


        // Position buffer

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            buffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            vertexData,
            gl.DYNAMIC_DRAW
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


        // Colour buffer

        const colourBuffer =
            gl.createBuffer();

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            colourBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            colourData,
            gl.DYNAMIC_DRAW
        );

        gl.enableVertexAttribArray(
            colour
        );

        gl.vertexAttribPointer(
            colour,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );


        gl.drawArrays(
            gl.TRIANGLES,
            0,
            vertices.length / 2
        );

    }

    if (temperatures) {

        draw();

    }

    map.on(
        "move",
        draw
    );

    map.on(
        "zoom",
        draw
    );

    map.on(
        "zoomanim",
        draw
    );

    return {
        gl: gl,
        loadForecast: loadWebGLForecast
    };
}

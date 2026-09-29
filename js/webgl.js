const vertexShaderSource = `
    attribute vec2 position;
    attribute vec3 colour;

    varying vec3 vColour;

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

        gl_Position =
            vec4(
                screenPosition,
                0.0,
                1.0
            );

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

function prepareColourData() {

    const rows =
        temperatureColours.length;

    const columns =
        temperatureColours[0].length;

    const longitudeOffset =
        Math.floor(columns / 2);

    const cellRows =
        rows - 1;

    const cellColumns =
        columns - 1;

    const data =
        new Float32Array(
            cellRows *
            cellColumns *
            6 *
            3
        );

    let index = 0;

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

            const shiftedColumn =
                (column -
                    longitudeOffset +
                    columns) %
                columns;

            const shiftedColumnNext =
                (column + 1 -
                    longitudeOffset +
                    columns) %
                columns;

            const colour1 =
                temperatureColours[
                    row
                ][
                    shiftedColumn
                ];

            const colour2 =
                temperatureColours[
                    row
                ][
                    shiftedColumnNext
                ];

            const colour3 =
                temperatureColours[
                    row + 1
                ][
                    shiftedColumn
                ];

            const colour4 =
                temperatureColours[
                    row + 1
                ][
                    shiftedColumnNext
                ];

            data.set(
                colour3,
                index
            );
            index += 3;

            data.set(
                colour4,
                index
            );
            index += 3;

            data.set(
                colour1,
                index
            );
            index += 3;

            data.set(
                colour1,
                index
            );
            index += 3;

            data.set(
                colour4,
                index
            );
            index += 3;

            data.set(
                colour2,
                index
            );
            index += 3;

        }

    }

    return data;
}

function prepareGridColourData() {

    const rows =
        temperatureColours.length;

    const columns =
        temperatureColours[0].length;

    const longitudeOffset =
        Math.floor(columns / 2);

    const data =
        new Float32Array(
            rows *
            columns *
            3
        );

    let index = 0;

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            const shiftedColumn =
                (column -
                    longitudeOffset +
                    columns) %
                columns;

            const colour =
                temperatureColours[
                    row
                ][
                    shiftedColumn
                ];

            data.set(
                colour,
                index
            );

            index += 3;
        }
    }

    return data;
}

function prepareIndexData(
    rows,
    columns
) {

    const cellRows =
        rows - 1;

    const cellColumns =
        columns - 1;

    const indices =
        new Uint32Array(
            cellRows *
            cellColumns *
            6
        );

    let index = 0;

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

            const topLeft =
                row * columns + column;

            const topRight =
                topLeft + 1;

            const bottomLeft =
                (row + 1) * columns + column;

            const bottomRight =
                bottomLeft + 1;

            indices[index++] =
                topLeft;

            indices[index++] =
                topRight;

            indices[index++] =
                bottomLeft;

            indices[index++] =
                bottomLeft;

            indices[index++] =
                topRight;

            indices[index++] =
                bottomRight;

        }

    }

    return indices;
}

function prepareGridVertexData(
    rows,
    columns
) {

    const data =
        new Float32Array(
            rows *
            columns *
            2
        );

    let index = 0;

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        const latitude =
            -90 +
            180 *
            row /
            (rows - 1);

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            const longitude =
                -180 +
                360 *
                column /
                (columns - 1);

            data[index++] =
                longitude;

            data[index++] =
                latitude;

        }

    }

    return data;
}

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

            temperatureColours =
                temperatures.map(
                    row =>
                        row.map(
                            temperature =>
                                temperatureColour(
                                    temperature
                                )
                        )
                );   

            colourData =
                prepareGridColourData();

            indexData =
                prepareIndexData(
                    temperatures.length,
                    temperatures[0].length
                );
            gridVertexData =
                prepareGridVertexData(
                    temperatures.length,
                    temperatures[0].length
                );  
                
            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                buffer
            );

            gl.bufferData(
                gl.ARRAY_BUFFER,
                gridVertexData,
                gl.STATIC_DRAW
            );                

            indexBuffer =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                indexBuffer
            );

            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                indexData,
                gl.STATIC_DRAW
            );

            colourBuffer =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                colourBuffer
            );

            gl.bufferData(
                gl.ARRAY_BUFFER,
                colourData,
                gl.STATIC_DRAW
            );

            console.log(
                "Colour buffer uploaded:",
                colourData.length
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

    const colour =
        gl.getAttribLocation(
            program,
            "colour"
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

    let temperatures = null;
    let temperatureColours = null;
    let weatherVertexData = null;
    let colourBuffer = null;
    let colourData = null;
    let indexBuffer = null;
    let indexData = null;
    let gridVertexData = null;
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
        if (!temperatures) {
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


        // Colour buffer

        if (!colourBuffer) {

            colourBuffer =
                gl.createBuffer();

        }

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            colourBuffer
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

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            indexBuffer
        );

        gl.drawElements(
            gl.TRIANGLES,
            indexData.length,
            gl.UNSIGNED_INT,
            0
        );
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
        loadForecast: loadWebGLForecast
    };
}

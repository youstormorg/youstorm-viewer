let weatherData = null;
let precipitationData = null;
let temperatureImageLayer = null;
let precipitationImageLayer = null;
let ecmwfMetadata = null;
let selectedTemperatureModel = "GFS";
export function setTemperatureModel(model) {

    selectedTemperatureModel = model;

    console.log(
        `Temperature model set to: ${selectedTemperatureModel}`
    );

}
export function getTemperatureForecastCount() {

    if (selectedTemperatureModel === "ECMWF") {

        return ecmwfMetadata.length;

    }

    return weatherData.length;

}

// Forecast hours currently available
const forecastHours = [
    ...Array.from(
        { length: 49 },
        (_, i) => i * 3
    )
];

const precipitationHours = [
    ...Array.from(
        { length: 48 },
        (_, i) => (i + 1) * 3
    )
];

// Temperature colour scale
const temperatureScale = [
    { colour: "#4b6cb7", label: "< 0°C" },
    { colour: "#6fa8dc", label: "0–5°C" },
    { colour: "#9fc5e8", label: "5–10°C" },
    { colour: "#b6d7a8", label: "10–15°C" },
    { colour: "#ffd966", label: "15–20°C" },
    { colour: "#f6b26b", label: "20–25°C" },
    { colour: "#e06666", label: "25–30°C" },
    { colour: "#cc0000", label: "30–35°C" },
    { colour: "#990000", label: "≥ 35°C" }
];

const precipitationScale = [
    { colour: "#ffffff", label: "< 0.1 mm" },
    { colour: "#dcf5ff", label: "0.1–1 mm" },
    { colour: "#aadcfa", label: "1–2.5 mm" },
    { colour: "#64b4f0", label: "2.5–5 mm" },
    { colour: "#1e82dc", label: "5–10 mm" },
    { colour: "#14aa64", label: "10–20 mm" },
    { colour: "#ffe63c", label: "20–30 mm" },
    { colour: "#ff961e", label: "30–50 mm" },
    { colour: "#f03c1e", label: "50–75 mm" },
    { colour: "#b40000", label: "≥ 75 mm" }
];

// Load a single GFS forecast
async function loadForecast(forecastHour) {

const filename =
    `./data/gfs/gfs_temp_global_f${forecastHour
        .toString()
        .padStart(3, "0")}.json`;

    const response = await fetch(filename);

    if (!response.ok) {

        throw new Error(
            `Could not load GFS data: ${response.status}`
        );

    }

    return await response.json();
}


// Load all available forecasts
export async function loadTemperatureData() {

    weatherData = [];

    for (const forecastHour of forecastHours) {

        console.log(
            `Loading GFS forecast +${forecastHour
                .toString()
                .padStart(3, "0")} h`
        );

        const data =
            await loadForecast(forecastHour);

        weatherData.push(data);
    }

    console.log(
        `Loaded ${weatherData.length} GFS forecasts`
    );

    return weatherData;
}

export async function loadECMWFMetadata() {

    const filename =
        "./data/ecmwf/ecmwf_temperature_metadata.json";

    const response =
        await fetch(filename);

    if (!response.ok) {

        throw new Error(
            `Could not load ECMWF metadata: ${response.status}`
        );

    }

    ecmwfMetadata =
        await response.json();

    console.log(
        `Loaded ${ecmwfMetadata.length} ECMWF forecasts`
    );

    return ecmwfMetadata;
}

async function loadPrecipitationForecast(forecastHour) {

    const filename =
        `./data/gfs/gfs_precip_global_f${forecastHour
            .toString()
            .padStart(3, "0")}.json`;

    const response =
        await fetch(filename);

    if (!response.ok) {

        throw new Error(
            `Could not load precipitation data: ${response.status}`
        );

    }

    return await response.json();
}

export async function loadPrecipitationData() {

    precipitationData = [];

    for (const forecastHour of precipitationHours) {

        console.log(
            `Loading precipitation forecast +${forecastHour
                .toString()
                .padStart(3, "0")} h`
        );

        const data =
            await loadPrecipitationForecast(forecastHour);

        precipitationData.push(data);
    }

    console.log(
        `Loaded ${precipitationData.length} precipitation forecasts`
    );

    return precipitationData;
}

// Return a colour based on temperature
function temperatureColour(temp) {

    if (temp < 0) return "#4b6cb7";
    if (temp < 5) return "#6fa8dc";
    if (temp < 10) return "#9fc5e8";
    if (temp < 15) return "#b6d7a8";
    if (temp < 20) return "#ffd966";
    if (temp < 25) return "#f6b26b";
    if (temp < 30) return "#e06666";
    if (temp < 35) return "#cc0000";

    return "#990000";
}


// Display a particular forecast
export function displayTemperature(map, forecastIndex = 0) {

    if (!weatherData || weatherData.length === 0) {

        console.error(
            "Temperature data has not been loaded"
        );

        return;

    }


    
    let data;
let forecastHour;
let tileFolder;

if (selectedTemperatureModel === "ECMWF") {

    data = ecmwfMetadata[forecastIndex];

    forecastHour =
        Number(data.forecast_hour);

    tileFolder =
        `ecmwf_temperature_tiles_f${forecastHour
            .toString()
            .padStart(3, "0")}_auto`;

} else {

    data = weatherData[forecastIndex];

    forecastHour =
        Number(data.forecast_hour);

    tileFolder =
        `temperature_tiles_f${forecastHour
            .toString()
            .padStart(3, "0")}_auto`;

}

const temperaturePath =
    selectedTemperatureModel === "ECMWF"
        ? "./data/ecmwf"
        : "./data/gfs";

const newTemperatureLayer =
    L.tileLayer(
        `${temperaturePath}/${tileFolder}/{z}/{x}/{y}.png`,
        {
            minZoom: 2,
            maxZoom: 13,
            maxNativeZoom: 4,
            opacity: 0.65,
            tileSize: 256,
            interactive: false
        }
    );

   newTemperatureLayer.addTo(map);

const oldTemperatureLayer = temperatureImageLayer;

temperatureImageLayer = newTemperatureLayer;

setTimeout(() => {

    if (oldTemperatureLayer) {
        map.removeLayer(oldTemperatureLayer);
    }

}, 1000);

    updateForecastDisplay(data);


    console.log(
        `Temperature layer displayed: +${data.forecast_hour
            .toString()
            .padStart(3, "0")} h`
    );

}


// Update the forecast information in the footer
function updateForecastDisplay(data) {

    const forecastElement =
        document.getElementById("forecastHour");

    const timezoneElement =
        document.getElementById("timezone");


    // Forecast hour
    const forecastHour =
        Number(data.forecast_hour);


    forecastElement.textContent =
        `+${forecastHour
            .toString()
            .padStart(3, "0")} h`;


    // Valid time
    timezoneElement.textContent =
        formatValidTime(data.valid_time);

}


// Format the GFS valid time
function formatValidTime(validTime) {

    const date =
        new Date(validTime);


    return date.toLocaleString(
        "en-GB",
        {
            timeZone: "UTC",

            day: "2-digit",
            month: "short",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit",

            hour12: false,

            timeZoneName: "short"
        }
    );

}


// Create the temperature legend
export function createTemperatureLegend() {

    const legend =
        document.getElementById(
            "temperatureLegend"
        );


    if (!legend) {

        console.error(
            "Temperature legend element not found"
        );

        return;

    }


    legend.innerHTML = `
        <div class="legendTitle">
            Temperature
        </div>

        <div class="legendUnit">
            2 m above ground
        </div>
    `;


    temperatureScale.forEach(item => {

        const row =
            document.createElement("div");


        row.className =
            "legendRow";


        row.innerHTML = `
            <span
                class="legendColour"
                style="background:${item.colour}">
            </span>

            <span class="legendLabel">
                ${item.label}
            </span>
        `;


        legend.appendChild(row);

    });

}


// Return the number of available forecasts
export function getForecastCount() {

    return weatherData
        ? weatherData.length
        : 0;

}

export function displayPrecipitation(map, forecastIndex = 0) {

    if (!precipitationData || precipitationData.length === 0) {

        console.error(
            "Precipitation data has not been loaded"
        );

        return;

    }

    const data =
        precipitationData[forecastIndex];

    const forecastHour =
        Number(data.forecast_hour);

    const tileFolder =
        `precipitation_tiles_f${forecastHour
            .toString()
            .padStart(3, "0")}_auto`;

    const newPrecipitationLayer =
        L.tileLayer(
            `./data/gfs/${tileFolder}/{z}/{x}/{y}.png`,
            {
                minZoom: 2,
                maxZoom: 13,
                maxNativeZoom: 4,
                opacity: 0.65,
                tileSize: 256,
                interactive: false
            }
        );

    newPrecipitationLayer.addTo(map);

    const oldPrecipitationLayer =
        precipitationImageLayer;

    precipitationImageLayer =
        newPrecipitationLayer;

    setTimeout(() => {

        if (oldPrecipitationLayer) {
            map.removeLayer(oldPrecipitationLayer);
        }

    }, 1000);

    console.log(
        `Precipitation layer displayed: +${data.forecast_hour
            .toString()
            .padStart(3, "0")} h`
    );
}

export function hidePrecipitation(map) {

    if (precipitationImageLayer) {

        map.removeLayer(
            precipitationImageLayer
        );

    }

}

export function hideTemperature(map) {

    if (temperatureImageLayer) {

        map.removeLayer(
            temperatureImageLayer
        );

    }

}

export function showTemperature(map) {

    if (temperatureImageLayer) {

        temperatureImageLayer.addTo(
            map
        );

    }

}

export function showPrecipitation(map) {

    if (precipitationImageLayer) {

        precipitationImageLayer.addTo(
            map
        );

    } else {

        displayPrecipitation(
            map,
            0
        );

    }

}

 export function createPrecipitationLegend() {

    const legend =
        document.getElementById(
            "precipitationLegend"
        );


    if (!legend) {

        console.error(
            "Precipitation legend element not found"
        );

        return;

    }


    legend.innerHTML = `
        <div class="legendTitle">
            Precipitation
        </div>

        <div class="legendUnit">
            6-hour accumulation
        </div>
    `;


    precipitationScale.forEach(item => {

        const row =
            document.createElement("div");


        row.className =
            "legendRow";


        row.innerHTML = `
            <span
                class="legendColour"
                style="background:${item.colour}">
            </span>

            <span class="legendLabel">
                ${item.label}
            </span>
        `;


        legend.appendChild(row);

    });

}

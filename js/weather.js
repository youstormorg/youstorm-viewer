let weatherData = null;
let temperatureImageLayer = null;

// Forecast hours currently available
const forecastHours = [0, 3, 6, 9, 12, 15, 18, 21, 24];


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


// Load a single GFS forecast
async function loadForecast(forecastHour) {

const filename =
    `./data/gfs/gfs_temp_europe_f${forecastHour
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


    
    const data =
        weatherData[forecastIndex];

// TEMPERATURE TILE LAYER

const forecastHour =
    Number(data.forecast_hour);

const tileFolder =
    `temperature_tiles_f${forecastHour
        .toString()
        .padStart(3, "0")}_auto`;

if (temperatureImageLayer) {
    map.removeLayer(temperatureImageLayer);
}

temperatureImageLayer =
    L.tileLayer(
        `./data/gfs/${tileFolder}/{z}/{x}/{y}.png`,
        {
            minZoom: 2,
            maxZoom: 6,
            maxNativeZoom: 4,
            opacity: 0.65,
            tileSize: 256,
            interactive: false
        }
    );

temperatureImageLayer.addTo(map);

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
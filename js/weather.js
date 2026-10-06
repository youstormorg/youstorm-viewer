import {
    DEFAULT_MODEL,
    MODELS,
    FORECAST_HOURS,
    PRECIPITATION_HOURS,
    TEMPERATURE_SCALE,
    PRECIPITATION_SCALE
} from "./config.js";

let weatherData = null;
let precipitationData = null;
let ecmwfMetadata = null;
let selectedTemperatureModel = DEFAULT_MODEL;
export function setTemperatureModel(model) {

    selectedTemperatureModel = model;

    console.log(
        `Temperature model set to: ${selectedTemperatureModel}`
    );

}

export function getTemperatureModel() {

    return selectedTemperatureModel;

}

export function getTemperatureForecastCount() {

    if (selectedTemperatureModel === "ECMWF") {

        return ecmwfMetadata.length;

    }

    return weatherData.length;

}

const forecastHours = FORECAST_HOURS;
const precipitationHours = PRECIPITATION_HOURS;

// Temperature colour scale
const temperatureScale = TEMPERATURE_SCALE;
const precipitationScale = PRECIPITATION_SCALE;

// Load a single GFS forecast
async function loadForecastMetadata() {

    const filename =
        MODELS.GFS.temperatureMetadata;

    const response =
        await fetch(filename);

    if (!response.ok) {

        throw new Error(
            `Could not load GFS metadata: ${response.status}`
        );

    }

    return await response.json();
}


// Load all available forecasts
export async function loadTemperatureData() {

    weatherData =
        await loadForecastMetadata();
        
    console.log(
        "First GFS forecast:",
        weatherData[0]
    );

    console.log(
        `Loaded ${weatherData.length} GFS forecast metadata records`
    );

    return weatherData;
}

export function getTemperatureMetadata() {

    return weatherData;

}

export function getECMWFMetadata() {

    return ecmwfMetadata;

}

export async function loadECMWFMetadata() {

    const filename =
        MODELS.ECMWF.temperatureMetadata;

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

async function loadPrecipitationMetadata() {

    const filename =
        MODELS[selectedTemperatureModel].precipitationMetadata;

    const response =
        await fetch(filename);

    if (!response.ok) {

        throw new Error(
            `Could not load precipitation metadata: ${response.status}`
        );

    }

    return await response.json();
}

export async function loadPrecipitationData() {

    precipitationData =
        await loadPrecipitationMetadata();

    console.log(
        `Loaded ${precipitationData.length} precipitation forecast metadata records`
    );

    return precipitationData;
}

export function getPrecipitationMetadata() {
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

// Update the forecast information in the footer
export function updateForecastDisplay(data) {

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


    const legendItems =
        [...TEMPERATURE_SCALE]
            .reverse()
            .map(item => `
                <div class="temperatureLegendItem">
                    <span
                        class="temperatureLegendColour"
                        style="background:${item.colour};"
                    ></span>

                    <span>
                        ${item.label}
                    </span>
                </div>
            `)
            .join("");


    legend.innerHTML = `
        <div class="legendTitle">
            Temperature
        </div>

        <div class="legendUnit">
            2 m above ground
        </div>

        <div class="temperatureLegendItems">
            ${legendItems}
        </div>
    `;

}

// Return the number of available forecasts
export function getForecastCount() {

    return weatherData
        ? weatherData.length
        : 0;

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
            3-hour accumulation
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

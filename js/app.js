import {
    initialiseMap,
    setCapitalLabelsVisible
} from "./map.js";
import { initialiseUI } from "./ui.js";
import { initialiseWebGL } from "./webgl.js";
import {
    loadTemperatureData,
    getTemperatureMetadata,
    getECMWFMetadata,
    loadECMWFMetadata,
    loadECMWFWindMetadata,
    getECMWFWindMetadata,
    setTemperatureModel,
    getTemperatureModel,
    getTemperatureForecastCount,
    loadPrecipitationData,
    getPrecipitationMetadata,
    createTemperatureLegend,
    createWindLegend,
    createPrecipitationLegend,
    makeLegendDraggable,
    getForecastCount,
    updateForecastDisplay,
} from "./weather.js";
let map;
let webgl;

function updateWeatherReadoutVisibility() {
    const visibleLayers = webgl.getVisibleLayers();

    const hasVisibleLayer =
        visibleLayers.temperature ||
        visibleLayers.precipitation;

    const readout =
        document.getElementById("weatherReadout");

    readout.style.display =
        probeEnabled && hasVisibleLayer
            ? "block"
            : "none";

    const fixedProbeReadout =
        document.getElementById("fixedProbeReadout");

    const fixedProbeMarker =
        document.getElementById("fixedProbeMarker");

    if (!hasVisibleLayer) {
        fixedProbeReadout.style.display = "none";
        fixedProbeMarker.style.display = "none";
    } else if (fixedProbeLatLon) {
        fixedProbeReadout.style.display = "block";
        fixedProbeMarker.style.display = "block";
    }
}

function updateWeatherReadout() {

    if (!lastMouseLatLon) {
        return;
    }

    const lat =
        lastMouseLatLon.lat;

    const lon =
        lastMouseLatLon.lon;

    const grid =
        latLonToGrid(
            lat,
            lon,
            webgl.getModel()
        );

    const visibleLayers =
        webgl.getVisibleLayers();

    let variable;

    if (visibleLayers.temperature) {

        variable =
            "temperature";

    } else if (visibleLayers.precipitation) {

        variable =
            "precipitation";

    } else {

        return;
    }

    const value =
        webgl.getWeatherValue(
            grid.row,
            grid.column,
            variable
        );

    const readoutLocation =
        document.getElementById(
            "weatherReadoutLocation"
        );

    const readoutValue =
        document.getElementById(
            "weatherReadoutValue"
        );

    let displayLon =
        lon;

    if (displayLon > 180) {
        displayLon -= 360;
    }

    if (displayLon < -180) {
        displayLon += 360;
    }

    const latDirection =
        lat >= 0 ? "N" : "S";

    const lonDirection =
        displayLon >= 0 ? "E" : "W";

    readoutLocation.textContent =
        `${Math.abs(lat).toFixed(2)}°${latDirection}, ` +
        `${Math.abs(displayLon).toFixed(2)}°${lonDirection}`;

    if (value === null) {

        readoutValue.textContent =
            "--";

    } else if (variable === "temperature") {

        readoutValue.textContent =
            `Temperature: ${value.toFixed(1)} °C`;

    } else if (variable === "precipitation") {

        readoutValue.textContent =
            `Precipitation: ${value.toFixed(1)} mm`;
    }
}

function updateFixedProbeReadout() {

    if (!fixedProbeLatLon) {
        return;
    }

    const lat = fixedProbeLatLon.lat;
    const lon = fixedProbeLatLon.lon;

    const grid = latLonToGrid(
        lat,
        lon,
        webgl.getModel()
    );

    const visibleLayers = webgl.getVisibleLayers();

    let variable;

    if (visibleLayers.precipitation) {
        variable = "precipitation";
    } else if (visibleLayers.wind) {
        variable = "wind";
    } else if (visibleLayers.temperature) {
        variable = "temperature";
    }

    const locationElement =
        document.getElementById("fixedProbeLocation");

    const timeElement =
        document.getElementById("fixedProbeTime");

    const valueElement =
        document.getElementById("fixedProbeValue");

    let displayLon = lon;

    if (displayLon > 180) displayLon -= 360;
    if (displayLon < -180) displayLon += 360;

    const latDirection = lat >= 0 ? "N" : "S";
    const lonDirection = displayLon >= 0 ? "E" : "W";

    locationElement.textContent =
        `${Math.abs(lat).toFixed(2)}°${latDirection}, ` +
        `${Math.abs(displayLon).toFixed(2)}°${lonDirection}`;


    if (currentValidTime) {
        try {
            const forecastDate = new Date(currentValidTime);

            const localTimeInfo =
                window.timezoneturbo.getLocalTimeInfo(
                    [displayLon, lat],
                    { date: forecastDate }
                );

            const localDate = new Date(
                localTimeInfo.unixTimestamp * 1000
            );

            const localDateParts = new Intl.DateTimeFormat("en-GB", {
                timeZone: localTimeInfo.timezone,
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }).formatToParts(localDate);

            const parts = Object.fromEntries(
                localDateParts.map(part => [part.type, part.value])
            );

            const offset = localTimeInfo.localTime.match(/GMT[+-]\d+(?::\d+)?|EST|EDT|CST|CDT|MST|MDT|PST|PDT/);

            timeElement.textContent =
                `${parts.day} ${parts.month} ${parts.hour}:${parts.minute}` +
                (offset ? ` ${offset[0]}` : "");

        } catch (error) {
            timeElement.textContent = "Local time unavailable";
        }
    } else {
        timeElement.textContent = "Forecast time unavailable";
    }


    if (!variable) {
        valueElement.textContent = "No weather layer visible";
        return;
    }

    const value = webgl.getWeatherValue(
        grid.row,
        grid.column,
        variable
    );


    if (value === null) {
        valueElement.textContent = "--";
    } else if (variable === "temperature") {
        valueElement.textContent =
            `Temperature: ${value.toFixed(1)} °C`;
    } else if (variable === "wind") {
        valueElement.textContent =
            `Wind speed: ${value.toFixed(1)} m/s`;
    } else {
        valueElement.textContent =
            `Precipitation: ${value.toFixed(1)} mm`;
    }
}
let selectedModel = "ECMWF";
async function initialiseApplication() {

    map =
        initialiseMap();

    webgl =
        initialiseWebGL(map);

    makeLegendDraggable(
        document.getElementById(
            "weatherReadout"
        )
    );

    makeLegendDraggable(
        document.getElementById(
            "fixedProbeReadout"
        ),
        "#fixedProbeClose"
    );

    makeLegendDraggable(
        document.getElementById(
            "sidebar"
        ),
        "input, label, select, button"
    );

    document.getElementById(
        "probeToggle"
    ).addEventListener(
        "click",
        () => {

            const readout =
                document.getElementById(
                    "weatherReadout"
                );

            const probeButton =
                document.getElementById(
                    "probeToggle"
                );

            if (!probeEnabled) {

                probeEnabled =
                    true;

                readout.style.display =
                    "block";

                probeButton.classList.add(
                    "active"
                );

                updateWeatherReadout();

            } else {

                probeEnabled =
                    false;

                readout.style.display =
                    "none";

                probeButton.classList.remove(
                    "active"
                );
            }

        }
    );
document.getElementById(
    "temperatureRenderModeToggle"
).addEventListener(
    "click",
    (event) => {
        const button = event.currentTarget;
        const useNearest =
            button.dataset.mode !== "nearest";

        button.dataset.mode =
            useNearest ? "nearest" : "smooth";

        webgl.setTemperatureRenderMode(
            useNearest ? 0 : 1
        );

        button.title = useNearest
            ? "Switch to smooth rendering"
            : "Switch to nearest-neighbour rendering";

        button.setAttribute(
            "aria-label",
            useNearest
                ? "Switch temperature to smooth rendering"
                : "Switch temperature to nearest-neighbour rendering"
        );

        button.textContent =
            useNearest ? "S" : "N";
    }
);
document.getElementById(
    "windRenderModeToggle"
).addEventListener(
    "click",
    (event) => {
        const button = event.currentTarget;
        const useNearest =
            button.dataset.mode !== "nearest";

        button.dataset.mode =
            useNearest ? "nearest" : "smooth";

        webgl.setWindRenderMode(
            useNearest ? 0 : 1
        );

        button.title = useNearest
            ? "Switch to smooth rendering"
            : "Switch to nearest-neighbour rendering";

        button.setAttribute(
            "aria-label",
            useNearest
                ? "Switch wind to smooth rendering"
                : "Switch wind to nearest-neighbour rendering"
        );

        button.textContent =
            useNearest ? "S" : "N";
    }
);

document.getElementById(
    "precipitationRenderModeToggle"
).addEventListener(
    "click",
    (event) => {
        const button = event.currentTarget;
        const useNearest =
            button.dataset.mode !== "nearest";

        button.dataset.mode =
            useNearest ? "nearest" : "smooth";

        webgl.setPrecipitationRenderMode(
            useNearest ? 0 : 5
        );

        button.title = useNearest
            ? "Switch to smooth rendering"
            : "Switch to nearest-neighbour rendering";

        button.setAttribute(
            "aria-label",
            useNearest
                ? "Switch precipitation to smooth rendering"
                : "Switch precipitation to nearest-neighbour rendering"
        );

        button.textContent =
            useNearest ? "S" : "N";
    }
);
function updateWebGLCanvasVisibility() {

    const temperatureEnabled =
        document.getElementById(
            "webglTemperatureToggle"
        ).checked;

    const precipitationEnabled =
        document.getElementById(
            "webglPrecipitationToggle"
        ).checked;

    const windEnabled =
        document.getElementById(
            "webglWindToggle"
        ).checked;

    const streamlinesEnabled =
        document.getElementById(
            "webglStreamlinesToggle"
        ).checked;

    const particlesEnabled =
        document.getElementById(
            "webglWindParticlesToggle"
        ).checked;

    const contoursEnabled =
        document.getElementById(
            "webglMSLContoursToggle"
        ).checked;

    const anyLayerEnabled =
        temperatureEnabled ||
        precipitationEnabled ||
        (
            selectedModel === "ECMWF" &&
            (
                windEnabled ||
                streamlinesEnabled ||
                particlesEnabled ||
                contoursEnabled
            )
        );

    document.getElementById(
        "weatherWebGL"
    ).style.display =
        anyLayerEnabled ? "block" : "none";
}
        document.getElementById(
            "webglTemperatureToggle"
        ).addEventListener(
            "change",
            (event) => {

                const canvas =
                    document.getElementById(
                        "weatherWebGL"
                    );

                webgl.setTemperatureVisible(
                    event.target.checked
                );

                updateWeatherReadoutVisibility();

                updateWeatherReadout();

                updateFixedProbeReadout();

                document.getElementById(
                    "temperatureLegend"
                ).style.display =
                    event.target.checked
                        ? "block"
                        : "none";

                // Recheck all layer checkboxes so independent overlays
                // remain visible when temperature is switched off.
                updateWebGLCanvasVisibility();

                if (event.target.checked) {

                    const forecastIndex =
                        Number(
                            document.getElementById(
                                "forecastSlider"
                            ).value
                        );

                    const temperatureMetadata =
                        getTemperatureModel() === "ECMWF"
                            ? getECMWFMetadata()
                            : getTemperatureMetadata();

                    const temperatureData =
                        temperatureMetadata[forecastIndex];

                    webgl.loadForecast(
                        temperatureData.forecast_hour,
                        getTemperatureModel(),
                        updateFixedProbeReadout
                    );

                    document.getElementById(
                        "forecastControlLabel"
                    ).textContent =
                        `${Number(
                            temperatureData.forecast_hour
                        )
                            .toString()
                            .padStart(3, "0")} h`;
                }

                console.log(
                    "WebGL visibility:",
                    event.target.checked,
                    canvas.style.display
                );

            }
        );

    document.getElementById(
        "webglPrecipitationToggle"
    ).addEventListener(
        "change",
        (event) => {

            const canvas =
                document.getElementById(
                    "weatherWebGL"
                );

            if (event.target.checked) {

                const precipitationData =
                    findMetadataByValidTime(
                        getPrecipitationMetadata()
                    );

                if (precipitationData) {

                    webgl.loadPrecipitation(
                        precipitationData.forecast_hour,
                        updateFixedProbeReadout,
                        document.getElementById(
                            "precipitationTypeSelect"
                        ).value
                    );

                    document.getElementById(
                        "forecastControlLabel"
                    ).textContent =
                        `${Number(
                            precipitationData.forecast_hour
                        )
                            .toString()
                            .padStart(3, "0")} h`;

                    webgl.setPrecipitationVisible(
                        true
                    );

                } else {

                    webgl.setPrecipitationVisible(
                        false
                    );
                }

            } else {

                webgl.setPrecipitationVisible(
                    false
                );
            }

            document.getElementById(
                "precipitationLegend"
            ).style.display =
                event.target.checked
                    ? "block"
                    : "none";

            updateWeatherReadoutVisibility(); 
            
            updateWeatherReadout();

            updateFixedProbeReadout();

            // Keep the shared canvas visible if any enabled layer needs it.
            updateWebGLCanvasVisibility();

            console.log(
                "WebGL precipitation visibility:",
                event.target.checked
            );

        }
    );
// Get the precipitation menu elements.
const precipitationMenuForArrow =
    document.querySelector(
        ".precipitationMenu"
    );

const precipitationMenuToggleForArrow =
    document.getElementById(
        "precipitationMenuToggle"
    );

// Open or close the dropdown when the arrow is clicked.
precipitationMenuToggleForArrow.addEventListener(
    "click",
    () => {

        const isOpen =
            precipitationMenuForArrow.classList.toggle(
                "open"
            );

        precipitationMenuToggleForArrow.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    }
);

// Handle changes to the precipitation accumulation type.
document.getElementById(
    "precipitationTypeSelect"
).addEventListener(
    "change",
    (event) => {

        // Close the menu after a selection is made.
        precipitationMenuForArrow.classList.remove(
            "open"
        );

        precipitationMenuToggleForArrow.setAttribute(
            "aria-expanded",
            "false"
        );

        // The accumulation selector applies only to ECMWF.
        if (selectedModel !== "ECMWF") {
            return;
        }

        // Update the legend for the selected accumulation type.
        createPrecipitationLegend();

        // Reload precipitation only when its layer is enabled.
        const precipitationToggle =
            document.getElementById(
                "webglPrecipitationToggle"
            );

        if (!precipitationToggle.checked) {
            return;
        }

        const precipitationData =
            findMetadataByValidTime(
                getPrecipitationMetadata()
            );

        if (precipitationData) {

            webgl.loadPrecipitation(
                precipitationData.forecast_hour,
                updateFixedProbeReadout,
                event.target.value
            );

            webgl.setPrecipitationVisible(true);

        } else {

            webgl.setPrecipitationVisible(false);
        }

        updateWeatherReadoutVisibility();
        updateWeatherReadout();
        updateFixedProbeReadout();
    }
);

// Close the menu when the user clicks outside it.
document.addEventListener(
    "click",
    (event) => {

        if (
            !precipitationMenuForArrow.contains(
                event.target
            )
        ) {

            precipitationMenuForArrow.classList.remove(
                "open"
            );

            precipitationMenuToggleForArrow.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }
);

document.getElementById(
    "webglWindToggle"
).addEventListener(
    "change",
    (event) => {

        const canvas =
            document.getElementById(
                "weatherWebGL"
            );

        if (event.target.checked) {

            // Wind is currently supported only for ECMWF.
            if (selectedModel !== "ECMWF") {

                webgl.setWindVisible(false);

                console.log(
                    "Wind is available only for ECMWF."
                );

            } else {

                const windData =
                    findMetadataByValidTime(
                        getECMWFWindMetadata()
                    );

                if (windData) {

                    webgl.loadWind(
                        windData.forecast_hour,
                        updateFixedProbeReadout
                    );

                    webgl.setWindVisible(true);

                } else {

                    webgl.setWindVisible(false);

                    console.warn(
                        "No ECMWF wind forecast matches the selected time."
                    );
                }
            }

        } else {

            webgl.setWindVisible(false);
        }

        // Show the wind legend only when ECMWF wind is enabled.
        document.getElementById(
            "windLegend"
        ).style.display =
            event.target.checked &&
            selectedModel === "ECMWF"
                ? "block"
                : "none";

        // Recheck canvas visibility so streamlines, particles,
        // and MSLP contours can remain visible without temperature.
        updateWebGLCanvasVisibility();

        updateFixedProbeReadout();
        console.log(
            "WebGL wind visibility:",
            event.target.checked
        );
    }
);

// Show or hide the wind-direction streamlines independently
// of the temperature layer, and keep the shared canvas visible
// whenever another enabled layer needs it.
document.getElementById(
    "webglStreamlinesToggle"
).addEventListener(
    "change",
    (event) => {

        webgl.setWindDirectionVisible(
            event.target.checked
        );

        // Recheck visibility after the streamlines setting changes.
        updateWebGLCanvasVisibility();

    }
);

document.getElementById(
    "webglMSLContoursToggle"
).addEventListener(
    "change",
    (event) => {
        const visible =
            event.target.checked &&
            getTemperatureModel() === "ECMWF";

        webgl.setMSLContoursVisible(visible);

        if (visible) {
            const forecastIndex =
                Number(
                    document.getElementById(
                        "forecastSlider"
                    ).value
                );

            const forecastData =
                getECMWFMetadata()[forecastIndex];

            if (forecastData) {
                webgl.loadMSLContours(
                    forecastData.forecast_hour
                );
            }
            // Keep the canvas visible when contours are enabled,
            // even if temperature and precipitation are switched off.
            updateWebGLCanvasVisibility();

        }
    }
);

// Show or hide wind particles independently of the other layers.
// Keep the shared canvas visible while any enabled layer needs it.
document.getElementById(
    "webglWindParticlesToggle"
).addEventListener(
    "change",
    (event) => {

        webgl.setWindParticlesVisible(
            event.target.checked
        );

        // Recheck canvas visibility after the particle setting changes.
        updateWebGLCanvasVisibility();

    }
);

initialiseUI(map);

await loadTemperatureData();

document.getElementById(
    "webglCoastlineToggle"
).addEventListener(
    "change",
    (event) => {
        webgl.setCoastlineVisible(
            event.target.checked
        );
    }
);

document.getElementById(
    "capitalLabelsToggle"
).addEventListener(
    "change",
    (event) => {
        setCapitalLabelsVisible(
            event.target.checked
        );
    }
);

await loadECMWFMetadata();
await loadECMWFWindMetadata();
webgl.setModel(getTemperatureModel());

const temperatureToggle =
    document.getElementById("webglTemperatureToggle");

currentValidTime =
    getTemperatureModel() === "ECMWF"
        ? getECMWFMetadata()[0].valid_time
        : getTemperatureMetadata()[0].valid_time;

console.log(
    "Temperature metadata:",
    getTemperatureModel() === "ECMWF"
        ? getECMWFMetadata()
        : getTemperatureMetadata()
);
await loadPrecipitationData();

// Load wind data for overlays even when wind speed is hidden.
if (
    getTemperatureModel() === "ECMWF" &&
    (
        document.getElementById(
            "webglWindToggle"
        ).checked ||
        document.getElementById(
            "webglStreamlinesToggle"
        ).checked ||
        document.getElementById(
            "webglWindParticlesToggle"
        ).checked
    )
) {
    const windData =
        findMetadataByValidTime(
            getECMWFWindMetadata()
        );

    if (windData) {
        webgl.loadWind(
            windData.forecast_hour,
            updateFixedProbeReadout
        );

        webgl.setWindVisible(
            document.getElementById(
                "webglWindToggle"
            ).checked
        );
    }
}

// Initialise forecast legends.
createTemperatureLegend();
createWindLegend();

const precipitationTypeSelect =
    document.getElementById(
        "precipitationTypeSelect"
    );

// Get the wrapper containing the precipitation arrow and dropdown.
const precipitationMenu =
    document.querySelector(
        ".precipitationMenu"
    );

// Show the menu only when ECMWF is selected.
precipitationMenu.hidden =
    selectedModel !== "ECMWF";

// Keep the selector's existing model-dependent visibility.
precipitationTypeSelect.hidden =
    selectedModel !== "ECMWF";

createPrecipitationLegend(
    selectedModel === "ECMWF"
        ? precipitationTypeSelect.value
        : "threeHour"
);

// Hide legends for inactive forecast layers on initial load.
document.getElementById(
    "precipitationLegend"
).style.display =
    document.getElementById(
        "webglPrecipitationToggle"
    ).checked &&
    selectedModel === "ECMWF"
        ? "block"
        : "none";

document.getElementById(
    "windLegend"
).style.display = "none";

if (temperatureToggle.checked) {
    temperatureToggle.dispatchEvent(
        new Event("change")
    );
}

// Set up the forecast slider
initialiseForecastSlider(map);

console.log("YouStorm started");

}

function initialiseForecastSlider(map) {

    const slider =
        document.getElementById(
            "forecastSlider"
        );

    const label =
        document.getElementById(
            "forecastControlLabel"
        );


    if (!slider || !label) {

        console.error(
            "Forecast slider elements not found"
        );

        return;

    }


    // Set the slider range
    slider.min = 0;

    slider.max =
        getTemperatureForecastCount() - 1;

    slider.value = 0;


    // Update the forecast when the slider moves
    slider.addEventListener(
    "input",
    () => {

    const forecastIndex =
        Number(slider.value);

    const temperatureData =
        getTemperatureModel() === "ECMWF"
            ? getECMWFMetadata()[forecastIndex]
            : getTemperatureMetadata()[forecastIndex];

    setCurrentValidTime(
        temperatureData.valid_time
    );

const forecastDate =
    new Date(currentValidTime);

    document.getElementById(
        "forecastUTCTime"
    ).textContent =
        `${forecastDate.getUTCDate()} ${
            forecastDate.toLocaleString(
                "en-GB",
                { month: "short", timeZone: "UTC" }
            ).slice(0, 3)
        } ${
            forecastDate.getUTCHours()
                .toString()
                .padStart(2, "0")
        } UTC`;

    if (
        document.getElementById(
            "webglTemperatureToggle"
        ).checked
    ) {

        const data =
            getTemperatureModel() === "ECMWF"
                ? getECMWFMetadata()[forecastIndex]
                : getTemperatureMetadata()[forecastIndex];

        webgl.loadForecast(
            data.forecast_hour,
            getTemperatureModel(),
            updateFixedProbeReadout
        );

        updateForecastDisplay(
            data
        );

    }

if (
    document.getElementById(
        "webglPrecipitationToggle"
    ).checked
) {

    const precipitationData =
        findMetadataByValidTime(
            getPrecipitationMetadata()
        );

    if (precipitationData) {

        webgl.loadPrecipitation(
            precipitationData.forecast_hour,
            updateFixedProbeReadout,
            document.getElementById(
                "precipitationTypeSelect"
            ).value
        );

        webgl.setPrecipitationVisible(
            true
        );

        updateWeatherReadoutVisibility();

    } else {

        webgl.setPrecipitationVisible(
            false
        );

        updateWeatherReadoutVisibility();

    }

}
const windSpeedEnabled =
    document.getElementById(
        "webglWindToggle"
    ).checked;

const streamlinesEnabled =
    document.getElementById(
        "webglStreamlinesToggle"
    ).checked;

const windParticlesEnabled =
    document.getElementById(
        "webglWindParticlesToggle"
    ).checked;

if (
    getTemperatureModel() === "ECMWF" &&
    (
        windSpeedEnabled ||
        streamlinesEnabled ||
        windParticlesEnabled
    )
) {
    const windData =
        findMetadataByValidTime(
            getECMWFWindMetadata()
        );

    if (windData) {
        webgl.loadWind(
            windData.forecast_hour,
            updateFixedProbeReadout
        );

        webgl.setWindVisible(
            windSpeedEnabled
        );

        webgl.setWindParticlesVisible(
            windParticlesEnabled
        );
    } else {
        webgl.setWindVisible(false);

        webgl.setWindParticlesVisible(false);

        console.warn(
            "No ECMWF wind forecast matches the selected time."
        );
    }
} else {
    webgl.setWindVisible(false);
}

const mslContoursToggle =
    document.getElementById(
        "webglMSLContoursToggle"
    );

if (
    getTemperatureModel() === "ECMWF" &&
    mslContoursToggle.checked
) {
    webgl.setMSLContoursVisible(true);

    webgl.loadMSLContours(
        temperatureData.forecast_hour
    );
} else {
    webgl.setMSLContoursVisible(false);
}

    // Update the slider label
    let displayHour;

        if (
            document.getElementById(
                "webglPrecipitationToggle"
            ).checked &&
            getTemperatureModel() === "GFS"
        ) {

            const precipitationData =
                findMetadataByValidTime(
                    getPrecipitationMetadata()
                );

            displayHour =
                precipitationData
                    ? precipitationData.forecast_hour
                    : getTemperatureMetadata()[
                        forecastIndex
                    ].forecast_hour;

        } else {

        displayHour =
            getTemperatureModel() === "ECMWF"
                ? getECMWFMetadata()[
                    forecastIndex
                ].forecast_hour
                : getTemperatureMetadata()[
                    forecastIndex
                ].forecast_hour;
    }

    label.textContent =
        `${Number(displayHour)
            .toString()
            .padStart(3, "0")} h`;

        }
    );

    slider.dispatchEvent(
        new Event("input")
    );
}


initialiseApplication();

let currentValidTime = null;

function setCurrentValidTime(validTime) {

    currentValidTime =
        validTime;

}

function findMetadataByValidTime(
    metadata
) {

    return metadata.find(
        item =>
            item.valid_time ===
            currentValidTime
    );

}
// ==========================================
// MODEL SELECTION AND FORECAST INITIALISATION
// Handles GFS/ECMWF switching, resets the
// forecast slider, and loads the selected model.
// ==========================================



const modelButtons =
    document.querySelectorAll(".modelButton");

// Handle clicks on the GFS and ECMWF model buttons.
// Updates the selected model and initialises its forecast.

modelButtons.forEach(button => {

    button.addEventListener("click", async () => {

        modelButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const model =
    button.textContent.trim();

setTemperatureModel(model);
webgl.setModel(model);
await loadPrecipitationData();
selectedModel = model;

const precipitationTypeSelect =
    document.getElementById(
        "precipitationTypeSelect"
    );

precipitationTypeSelect.hidden =
    model !== "ECMWF";

createPrecipitationLegend(
    model === "ECMWF"
        ? precipitationTypeSelect.value
        : "threeHour"
);

const slider =
    document.getElementById(
        "forecastSlider"
    );

slider.max =
    getTemperatureForecastCount() - 1;

slider.value = 0;

const firstTemperatureData =
    model === "ECMWF"
        ? getECMWFMetadata()[0]
        : getTemperatureMetadata()[0];

setCurrentValidTime(
    firstTemperatureData.valid_time
);
// MSL pressure contours are available only for ECMWF.
const mslContoursToggle =
    document.getElementById(
        "webglMSLContoursToggle"
    );

mslContoursToggle.closest(
    ".weatherLayerRow"
).hidden = model !== "ECMWF";

if (model !== "ECMWF") {
    mslContoursToggle.checked = false;
    webgl.setMSLContoursVisible(false);
} else if (mslContoursToggle.checked) {
    webgl.setMSLContoursVisible(true);

    webgl.loadMSLContours(
        firstTemperatureData.forecast_hour
    );
}
// Wind data is currently available only for ECMWF.
const windToggle =
    document.getElementById(
        "webglWindToggle"
    );
windToggle.closest(".weatherLayerRow").hidden =
    model !== "ECMWF";
if (model !== "ECMWF") {

    windToggle.checked = false;
    webgl.setWindVisible(false);

} else if (windToggle.checked) {

    const windData =
        findMetadataByValidTime(
            getECMWFWindMetadata()
        );

    if (windData) {

        webgl.loadWind(
            windData.forecast_hour,
            updateFixedProbeReadout
        );

        webgl.setWindVisible(true);

    } else {

        webgl.setWindVisible(false);
    }
}

// Keep wind legend in sync with the selected model.
document.getElementById(
    "windLegend"
).style.display =
    model === "ECMWF" &&
    windToggle.checked
        ? "block"
        : "none";

const forecastDate =
    new Date(
        firstTemperatureData.valid_time
    );

document.getElementById(
    "forecastUTCTime"
).textContent =
    `${forecastDate.getUTCDate()} ${
        forecastDate.toLocaleString(
            "en-GB",
            { month: "short", timeZone: "UTC" }
        ).slice(0, 3)
    } ${
        forecastDate.getUTCHours()
            .toString()
            .padStart(2, "0")
    } UTC`;

if (
    document.getElementById(
        "webglPrecipitationToggle"
    ).checked
) {
    webgl.setPrecipitationVisible(false);
}

if (
    document.getElementById(
        "webglTemperatureToggle"
    ).checked
) {

    const forecastIndex =
        Number(
            document.getElementById(
                "forecastSlider"
            ).value
        );

    const forecastData =
        model === "ECMWF"
            ? getECMWFMetadata()[forecastIndex]
            : getTemperatureMetadata()[forecastIndex];

    webgl.loadForecast(
        forecastData.forecast_hour,
        model,
        updateFixedProbeReadout
    );

}

const firstForecastHour =
    model === "ECMWF"
        ? getECMWFMetadata()[0].forecast_hour
        : getTemperatureMetadata()[0].forecast_hour;

document.getElementById(
    "forecastControlLabel"
).textContent =
    `${Number(firstForecastHour)
        .toString()
        .padStart(3, "0")} h`;

    });

});
// End of model selection and forecast initialisation.
let animationTimer = null;

const forecastPlayButton =
    document.getElementById(
        "forecastPlayButton"
    );


function latLonToGrid(
    lat,
    lon,
    model
) {
    let row;
    let column;

    // Normalise longitude for any repeated map world.
    const normalisedLon =
        ((lon % 360) + 360) % 360;

    if (model === "GFS") {
        row = Math.round((lat + 90) / 0.25);

        column =
            Math.round(normalisedLon / 0.25) % 1440;
    } else {
        row = Math.round((90 - lat) / 0.25);

        column =
            Math.round(((normalisedLon + 180) % 360) / 0.25) % 1440;
    }

    return {
        row: row,
        column: column
    };
}


let probeEnabled =
    true;
let fixedProbeLatLon = null;
let lastMouseLatLon =
    null;

map.on(
    "mousemove",
    (event) => {

        const lat =
            event.latlng.lat;

        const lon =
            event.latlng.lng;

        lastMouseLatLon = {
            lat: lat,
            lon: lon
        };

        const grid =
            latLonToGrid(
                lat,
                lon,
                webgl.getModel()
            );

        let variable;

        const visibleLayers =
            webgl.getVisibleLayers();

        if (visibleLayers.precipitation) {
            variable = "precipitation";
        } else if (visibleLayers.wind) {
            variable = "wind";
        } else if (visibleLayers.temperature) {
            variable = "temperature";
        } else {
            return;
        }

        const value =
            webgl.getWeatherValue(
                grid.row,
                grid.column,
                variable
            );

        const readoutLocation =
            document.getElementById(
                "weatherReadoutLocation"
            );

        const readoutValue =
            document.getElementById(
                "weatherReadoutValue"
            );

        let displayLon =
            lon;

        if (displayLon > 180) {
            displayLon -= 360;
        }

        if (displayLon < -180) {
            displayLon += 360;
        }

        const latDirection =
            lat >= 0 ? "N" : "S";

        const lonDirection =
            displayLon >= 0 ? "E" : "W";

        readoutLocation.textContent =
            `${Math.abs(lat).toFixed(2)}°${latDirection}, ` +
            `${Math.abs(displayLon).toFixed(2)}°${lonDirection}`;

        if (value === null) {
            readoutValue.textContent =
                "--";
        } else if (variable === "temperature") {
            readoutValue.textContent =
                `Temperature: ${value.toFixed(1)} °C`;
        } else if (variable === "wind") {
            readoutValue.textContent =
                `Wind speed: ${value.toFixed(1)} m/s`;
        } else if (variable === "precipitation") {
            readoutValue.textContent =
                `Precipitation: ${value.toFixed(1)} mm`;
        }
    }
);

map.doubleClickZoom.disable();

const fixedProbeMarkerElement = document.getElementById(
    "fixedProbeMarker"
);

function positionFixedProbeMarker() {

    if (!fixedProbeLatLon) {
        return;
    }

    const point = map.latLngToContainerPoint([
        fixedProbeLatLon.lat,
        fixedProbeLatLon.lon
    ]);

    fixedProbeMarkerElement.style.left = `${point.x}px`;
    fixedProbeMarkerElement.style.top = `${point.y}px`;
}

map.on("dblclick", (event) => {

    fixedProbeLatLon = {
        lat: event.latlng.lat,
        lon: event.latlng.lng
    };

    fixedProbeMarkerElement.style.display = "block";

    positionFixedProbeMarker();

    document.getElementById(
        "fixedProbeReadout"
    ).style.display = "block";

    updateFixedProbeReadout();

});

map.on("move zoom", positionFixedProbeMarker);

document.getElementById(
    "fixedProbeClose"
).addEventListener("click", () => {

    fixedProbeLatLon = null;

    fixedProbeMarkerElement.style.display = "none";

    document.getElementById(
        "fixedProbeReadout"
    ).style.display = "none";

});

const forecastSlider =
    document.getElementById(
        "forecastSlider"
    );

const opacitySlider =
    document.getElementById(
        "opacitySlider"
    );

if (forecastPlayButton && forecastSlider) {

    forecastPlayButton.addEventListener(
        "click",
        () => {

            // Pause if animation is currently running
            if (animationTimer !== null) {

                clearInterval(animationTimer);

                animationTimer = null;

                forecastPlayButton.textContent = "▶";

                return;

            }

            // Start animation
            forecastPlayButton.textContent = "❚❚";

            animationTimer =
                setInterval(
                    () => {

                        const currentIndex =
                            Number(forecastSlider.value);

                        const maxIndex =
                            Number(forecastSlider.max);


                        // Stop at the end of the forecast
                        if (currentIndex >= maxIndex) {

                            clearInterval(animationTimer);

                            animationTimer = null;

                            forecastPlayButton.textContent = "▶";

                            return;

                        }


                        forecastSlider.value =
                            currentIndex + 1;


                        forecastSlider.dispatchEvent(
                            new Event("input")
                        );

                    },
                    1000
                );

        }
    );

}

if (opacitySlider) {

    opacitySlider.addEventListener(
        "input",
        () => {

            const opacity =
                Number(opacitySlider.value) / 100;

            webgl.setOpacity(opacity);

        }
    );

}
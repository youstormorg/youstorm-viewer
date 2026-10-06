import { initialiseMap } from "./map.js";
import { initialiseUI } from "./ui.js";
import { initialiseWebGL } from "./webgl.js";
import {
    loadTemperatureData,
    getTemperatureMetadata,
    getECMWFMetadata,
    loadECMWFMetadata,
    setTemperatureModel,
    getTemperatureModel,
    getTemperatureForecastCount,
    loadPrecipitationData,
    getPrecipitationMetadata,
    createTemperatureLegend,
    createPrecipitationLegend,
    getForecastCount,
    updateForecastDisplay,
} from "./weather.js";
let map;
let webgl;
async function initialiseApplication() {

    map =
        initialiseMap();

    webgl =
        initialiseWebGL(map);
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
                document.getElementById(
                    "temperatureLegend"
                ).style.display =
                    event.target.checked
                        ? "block"
                        : "none";
                canvas.style.display =
                    event.target.checked ||
                    document.getElementById(
                        "webglPrecipitationToggle"
                    ).checked
                        ? "block"
                        : "none";

                if (event.target.checked) {

                webgl.loadForecast(
                    getTemperatureMetadata()[
                        Number(
                            document.getElementById(
                                "forecastSlider"
                            ).value
                        )
                    ].forecast_hour,
                    getTemperatureModel()
                );

                const forecastIndex =
                    Number(
                        document.getElementById(
                            "forecastSlider"
                        ).value
                    );

                const temperatureData =
                    getTemperatureModel() === "ECMWF"
                        ? getECMWFMetadata()[forecastIndex]
                        : getTemperatureMetadata()[forecastIndex];

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
                        precipitationData.forecast_hour
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

            canvas.style.display =
                event.target.checked ||
                document.getElementById(
                    "webglTemperatureToggle"
                ).checked
                    ? "block"
                    : "none";

            console.log(
                "WebGL precipitation visibility:",
                event.target.checked
            );

        }
    );

    initialiseUI(map);


    await loadTemperatureData();

    const temperatureToggle =
        document.getElementById(
            "webglTemperatureToggle"
        );

    if (temperatureToggle.checked) {

        temperatureToggle.dispatchEvent(
            new Event("change")
        );

    }

    currentValidTime =
        getTemperatureMetadata()[0].valid_time;

    console.log(
        "Temperature metadata:",
        getTemperatureMetadata()
    );

    await loadPrecipitationData();
    await loadECMWFMetadata();
    createTemperatureLegend();
    createPrecipitationLegend();
    document.getElementById(
        "precipitationLegend"
    ).style.display = "none";
   
    // Set up the forecast slider
    initialiseForecastSlider(map);

    console.log(
        "YouStorm started"
    );

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
            getTemperatureModel()
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
            precipitationData.forecast_hour
        );

        webgl.setPrecipitationVisible(
            true
        );

    } else {

        webgl.setPrecipitationVisible(
            false
        );

    }

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

let selectedModel = "GFS";

const modelButtons =
    document.querySelectorAll(".modelButton");

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
        model
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

let animationTimer = null;

const forecastPlayButton =
    document.getElementById(
        "forecastPlayButton"
    );

const forecastSlider =
    document.getElementById(
        "forecastSlider"
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
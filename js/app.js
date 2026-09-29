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
    displayTemperature,
    hideTemperature,
    showTemperature,
    displayPrecipitation,
    hidePrecipitation,
    showPrecipitation,
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

                canvas.style.display =
                    event.target.checked
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

                }                       

                console.log(
                    "WebGL visibility:",
                    event.target.checked,
                    canvas.style.display
                );

            }
        );
    initialiseUI(map);


    await loadTemperatureData();

    console.log(
        "Temperature metadata:",
        getTemperatureMetadata()
    );

    await loadPrecipitationData();
    await loadECMWFMetadata();
    createPrecipitationLegend();
    document.getElementById(
        "precipitationLegend"
    ).style.display = "none";
    // Display the first forecast
    displayTemperature(
        map,
        0
    );

   
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
            data.forecast_hour
        );

        updateForecastDisplay(
            data
        );

    }

    const temperatureToggle =
        document.getElementById(
            "temperatureToggle"
        );

    if (temperatureToggle.checked) {

        displayTemperature(
            map,
            forecastIndex
        );

    }


   const precipitationToggle =
    document.getElementById(
        "precipitationToggle"
    );

if (
    selectedModel === "GFS" &&
    forecastIndex > 0 &&
    precipitationToggle.checked
) {

    displayPrecipitation(
        map,
        forecastIndex - 1
    );

} else {

    hidePrecipitation(
        map
    );

}

            // Update the slider label
        const forecastHour =
            getTemperatureModel() === "ECMWF"
                ? getECMWFMetadata()[forecastIndex].forecast_hour
                : getTemperatureMetadata()[forecastIndex].forecast_hour;

        label.textContent =
            `+${Number(forecastHour)
                .toString()
                .padStart(3, "0")} h`;

        }
    );

}


initialiseApplication();


let selectedModel = "GFS";

const modelButtons =
    document.querySelectorAll(".modelButton");

modelButtons.forEach(button => {

    button.addEventListener("click", () => {

        modelButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const model =
    button.textContent.trim();

setTemperatureModel(model);

const slider =
    document.getElementById(
        "forecastSlider"
    );

slider.max =
    getTemperatureForecastCount() - 1;

slider.value = 0;

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
    `+${Number(firstForecastHour)
        .toString()
        .padStart(3, "0")} h`;


if (model === "ECMWF") {

    displayTemperature(
        map,
        0
    );
    hidePrecipitation(
        map
    );
}


if (model === "GFS") {

    displayTemperature(
        map,
        0
    );

}
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
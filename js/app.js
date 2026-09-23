import { initialiseMap } from "./map.js";
import { initialiseUI } from "./ui.js";

import {
    loadTemperatureData,
    loadECMWFMetadata,
    setTemperatureModel,
    getTemperatureForecastCount,
    loadPrecipitationData,
    displayTemperature,
    hideTemperature,
    showTemperature,
    displayPrecipitation,
    hidePrecipitation,
    showPrecipitation,
    createPrecipitationLegend,
    getForecastCount
} from "./weather.js";
let map;

async function initialiseApplication() {

    map =
        initialiseMap();

    initialiseUI(map);


    await loadTemperatureData();
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
            const hours =
                forecastIndex * 3;


            label.textContent =
                `+${hours
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
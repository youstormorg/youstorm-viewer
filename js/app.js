import { initialiseMap } from "./map.js";
import { initialiseUI } from "./ui.js";

import {
    loadTemperatureData,
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


async function initialiseApplication() {

    const map =
    initialiseMap();

    initialiseUI(map);


    await loadTemperatureData();
    await loadPrecipitationData();
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
        getForecastCount() - 1;

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
export function initialiseUI(map) {

    const layersToggle =
        document.getElementById("layersToggle");

    const sidebar =
        document.getElementById("sidebar");

    const legendToggle =
        document.getElementById("legendToggle");

    const temperatureLegend =
        document.getElementById("temperatureLegend");

    const precipitationLegend =
        document.getElementById("precipitationLegend");

    const windLegend =
        document.getElementById("windLegend");

    function updateLegendButton() {

        const legendsVisible =
            temperatureLegend.style.display !== "none" ||
            precipitationLegend.style.display !== "none" ||
            windLegend.style.display !== "none";
        legendToggle.classList.toggle(
            "active",
            legendsVisible
        );

    }

    updateLegendButton();

    legendToggle.addEventListener("click", () => {

        const legendsVisible =
            temperatureLegend.style.display !== "none" ||
            precipitationLegend.style.display !== "none" ||
            windLegend.style.display !== "none";

        // Hide or show all forecast legends.
        if (legendsVisible) {

            temperatureLegend.style.display = "none";
            precipitationLegend.style.display = "none";
            windLegend.style.display = "none";

        } else {

            temperatureLegend.style.display =
                document.getElementById(
                    "webglTemperatureToggle"
                ).checked
                    ? "block"
                    : "none";

            precipitationLegend.style.display =
                document.getElementById(
                    "webglPrecipitationToggle"
                ).checked ||
                document.getElementById(
                    "webglPrecipitationMode5Toggle"
                )?.checked
                    ? "block"
                    : "none";
            // Show wind legend only when ECMWF wind is enabled.
            windLegend.style.display =
                document.getElementById(
                    "webglWindToggle"
                ).checked &&
                document.querySelector(
                    ".modelButton.active"
                )?.textContent.trim() === "ECMWF"
                    ? "block"
                    : "none";

        }

        updateLegendButton();

    });

    layersToggle.addEventListener("click", () => {

        if (
            sidebar.style.display === "none" ||
            sidebar.style.display === ""
        ) {
            sidebar.style.display = "block";
            layersToggle.classList.add("active");
        } else {
            sidebar.style.display = "none";
            layersToggle.classList.remove("active");
        }

    });
}
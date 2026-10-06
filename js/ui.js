export function initialiseUI(map) {

    console.log("UI initialised");

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

    function updateLegendButton() {

        const legendsVisible =
            temperatureLegend.style.display !== "none" ||
            precipitationLegend.style.display !== "none";

        legendToggle.classList.toggle(
            "active",
            legendsVisible
        );

    }

    updateLegendButton();

    legendToggle.addEventListener("click", () => {

        const legendsVisible =
            temperatureLegend.style.display !== "none" ||
            precipitationLegend.style.display !== "none";

        if (legendsVisible) {

            temperatureLegend.style.display = "none";
            precipitationLegend.style.display = "none";

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
                ).checked
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
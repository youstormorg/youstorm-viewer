
export function initialiseUI(map) {

    console.log("UI initialised");

    const layersToggle =
        document.getElementById("layersToggle");

    const sidebar =
        document.getElementById("sidebar");

    layersToggle.addEventListener("click", () => {

        if (
    sidebar.style.display === "none" ||
    sidebar.style.display === ""
) {

    sidebar.style.display = "block";

} else {

    sidebar.style.display = "none";

}

    });
    const temperatureToggle =
    document.getElementById(
        "temperatureToggle"
    );

const precipitationToggle =
    document.getElementById(
        "precipitationToggle"
    );

temperatureToggle.addEventListener(
    "change",
    () => {

        const temperatureLegend =
            document.getElementById(
                "temperatureLegend"
            );

        if (temperatureToggle.checked) {

            temperatureLegend.style.display =
                "block";

        } else {

            temperatureLegend.style.display =
                "none";

        }

    }
);

precipitationToggle.addEventListener(
    "change",
    () => {

        const precipitationLegend =
            document.getElementById(
                "precipitationLegend"
            );

        if (precipitationToggle.checked) {

            precipitationLegend.style.display =
                "block";

        } else {

            precipitationLegend.style.display =
                "none";

        }

    }
);
}
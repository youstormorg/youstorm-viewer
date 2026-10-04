
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
}
export function initialiseUI() {

    console.log("UI initialised");

    const layersToggle =
        document.getElementById("layersToggle");

    const sidebar =
        document.getElementById("sidebar");

    layersToggle.addEventListener("click", () => {

        if (sidebar.style.display === "none") {
            sidebar.style.display = "block";
        } else {
            sidebar.style.display = "none";
        }

    });

}
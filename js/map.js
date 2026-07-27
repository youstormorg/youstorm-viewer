let map;

export function initialiseMap() {

    map = L.map("map").setView([20, 0], 2);

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors"
        }
    ).addTo(map);

    map.on("zoomend", updateZoom);

    map.on("mousemove", updateMousePosition);

    updateZoom();
}

function updateZoom() {

    document.getElementById("zoom").textContent =
        map.getZoom();

}

function updateMousePosition(e) {

    document.getElementById("lat").textContent =
        e.latlng.lat.toFixed(2) + "°";

    document.getElementById("lon").textContent =
        e.latlng.lng.toFixed(2) + "°";

}

export function getMap() {

    return map;

}
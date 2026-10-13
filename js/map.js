let map;
let capitalLabelsLayer;
let capitalLabelsVisible = true;

export function initialiseMap() {

    map = L.map("map", {
        zoomControl: false,
        minZoom: 2,
        maxBounds: [
            [-85, -540],
            [85, 540]
        ]
    }).setView([20,0],2);

    L.control.zoom({
        position: "topright"
    }).addTo(map);

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors"
        }
    ).addTo(map);

    addCapitalLabels();

    map.on("zoomend", updateZoom);

    map.on("mousemove", updateMousePosition);

    updateZoom();
   L.DomEvent.disableClickPropagation(
    document.getElementById("forecastControl")
);

L.DomEvent.disableScrollPropagation(
    document.getElementById("forecastControl")
);
   
    return map;
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


async function addCapitalLabels() {

    try {
        const response = await fetch(
            "data/places/capitals.json"
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const capitals = await response.json();

        capitalLabelsLayer = L.layerGroup();

        capitals.forEach(city => {

            const label = L.divIcon({
                className: "",
                html: `
                    <span style="
                        color: white;
                        font: 800 14px Arial, sans-serif;
                        white-space: nowrap;
                        text-shadow:
                            -1px -1px 2px #000,
                             1px -1px 2px #000,
                            -1px  1px 2px #000,
                             1px  1px 2px #000,
                             0 0 4px #000;
                    ">${city.name}</span>
                `,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            });

            L.marker([city.lat, city.lon], {
                icon: label,
                interactive: false,
                keyboard: false
            }).addTo(capitalLabelsLayer);

        });

        if (capitalLabelsVisible) {
            capitalLabelsLayer.addTo(map);
        }

    } catch (error) {
        console.error(
            "Could not load capital city labels:",
            error
        );
    }
}

export function setCapitalLabelsVisible(visible) {

    capitalLabelsVisible = visible;

    if (!map || !capitalLabelsLayer) {
        return;
    }

    if (visible) {
        capitalLabelsLayer.addTo(map);
    } else {
        map.removeLayer(capitalLabelsLayer);
    }
}

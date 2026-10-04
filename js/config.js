export const DEFAULT_MODEL = "GFS";

export const MODELS = {
    GFS: {
        label: "GFS",
        temperatureMetadata:
            "./data/gfs/gfs_temperature_metadata.json",
        precipitationMetadata:
            "./data/gfs/gfs_precipitation_metadata.json"
    },

    ECMWF: {
        label: "ECMWF",
        temperatureMetadata:
            "./data/ecmwf/ecmwf_temperature_metadata.json"
    }
};

export const FORECAST_HOURS = Array.from(
    { length: 49 },
    (_, i) => i * 3
);

export const PRECIPITATION_HOURS = Array.from(
    { length: 48 },
    (_, i) => (i + 1) * 3
);

export const TEMPERATURE_SCALE = [
    { colour: "#4b6cb7", label: "< 0°C" },
    { colour: "#6fa8dc", label: "0–5°C" },
    { colour: "#9fc5e8", label: "5–10°C" },
    { colour: "#b6d7a8", label: "10–15°C" },
    { colour: "#ffd966", label: "15–20°C" },
    { colour: "#f6b26b", label: "20–25°C" },
    { colour: "#e06666", label: "25–30°C" },
    { colour: "#cc0000", label: "30–35°C" },
    { colour: "#990000", label: "≥ 35°C" }
];

export const PRECIPITATION_SCALE = [
    { colour: "#ffffff", label: "< 0.1 mm" },
    { colour: "#dcf5ff", label: "0.1–1 mm" },
    { colour: "#aadcfa", label: "1–2.5 mm" },
    { colour: "#64b4f0", label: "2.5–5 mm" },
    { colour: "#1e82dc", label: "5–10 mm" },
    { colour: "#14aa64", label: "10–20 mm" },
    { colour: "#ffe63c", label: "20–30 mm" },
    { colour: "#ff961e", label: "30–50 mm" },
    { colour: "#f03c1e", label: "50–75 mm" },
    { colour: "#b40000", label: "≥ 75 mm" }
];

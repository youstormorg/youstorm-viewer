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
            "./data/ecmwf/ecmwf_temperature_metadata.json",
        precipitationMetadata:
            "./data/ecmwf/ecmwf_precipitation_metadata.json"
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
    { colour: "#313695", label: "< −40°C" },
    { colour: "#4575b4", label: "−40–−30°C" },
    { colour: "#74add1", label: "−30–−20°C" },
    { colour: "#abd9e9", label: "−20–−10°C" },
    { colour: "#e0f3f8", label: "−10–0°C" },
    { colour: "#c7e9c0", label: "0–5°C" },
    { colour: "#7fcdbb", label: "5–10°C" },
    { colour: "#41ab5d", label: "10–15°C" },
    { colour: "#d9ef8b", label: "15–20°C" },
    { colour: "#fee08b", label: "20–25°C" },
    { colour: "#fdae61", label: "25–30°C" },
    { colour: "#f46d43", label: "30–35°C" },
    { colour: "#d73027", label: "35–40°C" },
    { colour: "#a50026", label: "40–45°C" },
    { colour: "#7f0000", label: "45–50°C" },
    { colour: "#4d0000", label: "≥ 50°C" }
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

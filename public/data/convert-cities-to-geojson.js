import fs from 'fs'
import path from "path";

// Load the SimpleMaps JSON
const cities = JSON.parse(fs.readFileSync(path.resolve("cities.json"), "utf8"));

// Convert to GeoJSON
const geojson = {
    type: "FeatureCollection",
    features: cities.map((c) => ({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [parseFloat(c.lng), parseFloat(c.lat)],
        },
        properties: {
            city: c.city,
            population: c.population,
            region: c.admin_name,
            isAdminCapital: c.capital === 'admin' || c.capital === 'primary' // SimpleMaps uses admin_name for region
        },
    })),
};

// Save GeoJSON
fs.writeFileSync(path.resolve("bg_cities.geojson"), JSON.stringify(geojson, null, 2));

console.log("✅ bg_cities.geojson created with", geojson.features.length, "features");

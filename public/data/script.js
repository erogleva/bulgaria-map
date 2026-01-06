import fs from "fs";
import path from "path";
import * as turf from "@turf/turf";

const regionsPath = path.resolve("regions.geojson");
const municipalitiesPath = path.resolve("municipalities_source.geojson");
const outputPath = path.resolve("municipalities.geojson");

const regions = JSON.parse(fs.readFileSync(regionsPath, "utf8"));
const municipalities = JSON.parse(fs.readFileSync(municipalitiesPath, "utf8"));

if (!regions.features[0].properties.shapeID) {
    throw new Error("Regions file must have 'id' property for each feature");
}

municipalities.features.forEach((muni) => {
    const muniCentroid = turf.centroid(muni);

    // Find the region that contains the centroid
    const containingRegion = regions.features.find((region) => {
        if (!region.geometry) return false;
        try {
            return turf.booleanPointInPolygon(muniCentroid, region);
        } catch {
            return false;
        }
    });

    if (containingRegion) {
        muni.properties.region_id = containingRegion.properties.shapeID;
    } else {
        console.warn(
            `Municipality '${muni.properties.shapeName || muni.properties.name}' could not be assigned to any region`
        );
        muni.properties.region_id = null;
    }

    // Keep only name + region_id
    muni.properties.name = muni.properties.shapeName || muni.properties.name;
    muni.properties = {
        name: muni.properties.name,
        region_id: muni.properties.region_id,
    };
});

fs.writeFileSync(outputPath, JSON.stringify(municipalities, null, 2));
console.log(`✅ municipalities_final.geojson written: ${outputPath}`);

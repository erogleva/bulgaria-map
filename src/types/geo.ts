import type { FeatureCollection, Geometry } from "geojson";

export interface RegionProperties {
    "shapeName": string,
    "shapeISO": string,
    "shapeID": string
}

export interface MunicipalityProperties {
    "shapeName": string,
    "shapeISO": string,
    "shapeID": string,
    "region_id": string
}

export type RegionsGeoJSON =
    FeatureCollection<Geometry, RegionProperties>;

export type MunicipalitiesGeoJSON =
    FeatureCollection<Geometry, MunicipalityProperties>;

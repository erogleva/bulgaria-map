import { MapContainer, TileLayer, GeoJSON, Marker } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState, useRef } from "react";
import {booleanPointInPolygon} from "@turf/turf";

export default function BulgariaMap() {
    const [regions, setRegions] = useState<any>(null);
    const [municipalities, setMunicipalities] = useState<any>(null);
    const [cities, setCities] = useState<any>(null);
    const [selectedRegion, setSelectedRegion] = useState<any>(null);

    const mapRef = useRef<any>(null);
    const CENTER_BG: [number, number] = [42.7339, 25.4858];

    useEffect(() => {
        fetch("/data/regions.geojson").then((r) => r.json()).then(setRegions);
        fetch("/data/municipalities.geojson").then((r) => r.json()).then(setMunicipalities);
        fetch("/data/bg_cities.geojson").then((r) => r.json()).then(setCities);
    }, []);

    // Municipalities for selected region
    const filteredMunicipalities = useMemo(() => {
        if (!selectedRegion || !municipalities) return null;
        return {
            ...municipalities,
            features: municipalities.features.filter(
                (f: any) => f.properties.region_id === selectedRegion.properties.shapeID
            ),
        };
    }, [selectedRegion, municipalities]);

    // Cities to display (always admin capitals)
    const visibleCities = useMemo(() => {
        if (!cities) return [];
        return cities.features.filter((c: any) => {
            // Always keep admin capitals outside the selected region
            if (!selectedRegion) return c.properties.isAdminCapital;

            const point = {
                type: "Point",
                coordinates: [c.geometry.coordinates[0], c.geometry.coordinates[1]],
            };

            // Hide if inside selected region
            const inside = booleanPointInPolygon(point, selectedRegion);
            return c.properties.isAdminCapital && !inside;
        });
    }, [cities, selectedRegion]);

    // Create custom divIcon for labels
    const createLabelIcon = (name: string, color: string, size: number = 6) =>
        L.divIcon({
            className: "label-marker",
            html: `<div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                font-size: 10px;
                font-weight: bold;
                color: ${color};
                text-align: center;
                white-space: nowrap;
                pointer-events: none;
            ">
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background-color: ${color};
                    border: ${size > 0 ? '1px solid white' : 'none'};
                    border-radius: 50%;
                    box-shadow: 0 0 3px rgba(0,0,0,0.5);
                    margin-bottom: 2px;
                "></div>
                <span>${name}</span>
            </div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
        });

    // Zoom into selected region when it changes
    useEffect(() => {
        if (selectedRegion && mapRef.current) {
            const map = mapRef.current;
            const layer = L.geoJSON(selectedRegion);
            map.fitBounds(layer.getBounds(), { padding: [40, 40] });
        }
    }, [selectedRegion]);

    return (
        <MapContainer
            ref={mapRef}
            center={CENTER_BG}
            zoom={7}
            style={{ height: "100vh", width: "100%" }}
        >
            <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.7}
            />

            {/* Regions */}
            {regions && (
                <GeoJSON
                    data={regions}
                    style={(feature) => ({
                        color: "#222",
                        weight: 1,
                        fillColor:
                            selectedRegion?.properties.shapeID === feature?.properties.shapeID
                                ? "#81C784"
                                : "#3f8342",
                        fillOpacity: 1,
                    })}
                    onEachFeature={(feature, layer) => {
                        layer.on({ click: () => setSelectedRegion(feature) });
                    }}
                />
            )}

            {/* Municipalities polygons */}
            {filteredMunicipalities && (
                <GeoJSON
                    key={selectedRegion?.properties.shapeID}
                    data={filteredMunicipalities}
                    style={{
                        color: "#444",
                        weight: 0.5,
                        fillColor: "#2196F3", // blue
                        fillOpacity: 0.6,
                    }}
                />
            )}

            {/* Municipality labels */}
            {filteredMunicipalities?.features.map((muni: any, index: number) => {
                const coords = L.geoJSON(muni).getBounds().getCenter();
                return (
                    <Marker
                        key={index}
                        position={[coords.lat, coords.lng]}
                        icon={createLabelIcon(muni.properties.name, "#17659f", 0)}
                    />
                );
            })}

            {/* Admin capitals */}
            {visibleCities.map((city: any, index: number) => (
                <Marker
                    key={index}
                    position={[city.geometry.coordinates[1], city.geometry.coordinates[0]]}
                    icon={createLabelIcon(city.properties.city, "#601d17", 8)}
                />
            ))}
        </MapContainer>
    );
}

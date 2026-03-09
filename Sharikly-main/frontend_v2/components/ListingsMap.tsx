"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;
const DEFAULT_RADIUS_M = 5000;
const PURPLE_FILL = "rgba(147, 51, 234, 0.25)";
const PURPLE_STROKE = "rgba(147, 51, 234, 0.6)";

function createCircleGeoJSON(lat: number, lng: number, radiusM: number) {
  const earthRadiusM = 6371000;
  const radiusLat = (radiusM / earthRadiusM) * (180 / Math.PI);
  const radiusLng =
    (radiusM / (earthRadiusM * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  const steps = 64;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * (2 * Math.PI);
    coordinates.push([
      lng + radiusLng * Math.cos(angle),
      lat + radiusLat * Math.sin(angle),
    ]);
  }
  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates],
    },
    properties: {},
  };
}

export interface ListingForMap {
  id: number;
  latitude?: number | null;
  longitude?: number | null;
  pickup_radius_m?: number | null;
  title?: string;
}

interface ListingsMapProps {
  listings: ListingForMap[];
  selectedId?: number | null;
  onSelectListing?: (id: number) => void;
  className?: string;
}

export default function ListingsMap({
  listings,
  selectedId = null,
  onSelectListing,
  className = "",
}: ListingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const circleSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const firstWithCoords = listings.find(
    (l) => l.latitude != null && l.longitude != null
  );
  const centerLat = firstWithCoords?.latitude ?? DEFAULT_LAT;
  const centerLng = firstWithCoords?.longitude ?? DEFAULT_LNG;
  const radiusM = firstWithCoords?.pickup_radius_m ?? DEFAULT_RADIUS_M;

  const createCircle = useCallback(
    (lat: number, lng: number, r: number) =>
      createCircleGeoJSON(lat, lng, r),
    []
  );

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [centerLng, centerLat],
      zoom: 11,
    });

    map.current.on("load", () => {
      const mapInstance = map.current;
      if (!mapInstance) return;

      mapInstance.addSource("radius-circle", {
        type: "geojson",
        data: createCircle(centerLat, centerLng, radiusM),
      });
      circleSource.current = mapInstance.getSource(
        "radius-circle"
      ) as mapboxgl.GeoJSONSource;

      mapInstance.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius-circle",
        paint: {
          "fill-color": PURPLE_FILL,
          "fill-opacity": 1,
        },
      });
      mapInstance.addLayer({
        id: "radius-stroke",
        type: "line",
        source: "radius-circle",
        paint: {
          "line-color": PURPLE_STROKE,
          "line-width": 2,
        },
      });

      const withCoords = listings.filter(
        (l) => l.latitude != null && l.longitude != null
      );
      markersRef.current = withCoords.map((listing) => {
        const el = document.createElement("div");
        el.className = "listings-map-marker";
        el.innerHTML = `
          <div style="
            width: 24px; height: 24px;
            background: ${selectedId === listing.id ? "#7c3aed" : "#a855f7"};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
          " title="${(listing.title || "").replace(/"/g, "&quot;")}"></div>
        `;
        el.onclick = () => onSelectListing?.(listing.id);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([listing.longitude!, listing.latitude!])
          .addTo(mapInstance);
        return marker;
      });

      if (withCoords.length > 1) {
        const lngs = withCoords.map((l) => l.longitude!);
        const lats = withCoords.map((l) => l.latitude!);
        const bounds = new mapboxgl.LngLatBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        );
        mapInstance.fitBounds(bounds, { padding: 48, maxZoom: 12 });
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!circleSource.current || !firstWithCoords) return;
    circleSource.current.setData(
      createCircle(
        firstWithCoords.latitude!,
        firstWithCoords.longitude!,
        firstWithCoords.pickup_radius_m ?? radiusM
      )
    );
  }, [firstWithCoords?.id, radiusM, createCircle]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ minHeight: 280 }}
      >
        Map unavailable (no token)
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border overflow-hidden bg-muted/20 ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full min-h-[280px] sm:min-h-[320px] lg:min-h-[400px]"
      />
      <div className="flex items-center justify-end gap-2 px-2 py-1.5 bg-background/80 border-t border-border text-[10px] text-muted-foreground">
        <span>© Mapbox</span>
        <span>© OpenStreetMap</span>
      </div>
    </div>
  );
}

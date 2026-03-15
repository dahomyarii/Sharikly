"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;
const DEFAULT_RADIUS_M = 5000;
const PURPLE_FILL = "rgba(124, 58, 237, 0.16)";
const PURPLE_STROKE = "rgba(124, 58, 237, 0.55)";

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
  price_per_day?: number | string | null;
  currency?: string | null;
}

interface ListingsMapProps {
  listings: ListingForMap[];
  selectedId?: number | null;
  onSelectListing?: (id: number) => void;
  className?: string;
  hideFooter?: boolean;
  mapHeightClassName?: string;
}

export default function ListingsMap({
  listings,
  selectedId = null,
  onSelectListing,
  className = "",
  hideFooter = false,
  mapHeightClassName = "",
}: ListingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const circleSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const listingsRef = useRef<ListingForMap[]>(listings);
  const selectedIdRef = useRef<number | null>(selectedId);

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
    listingsRef.current = listings;
    selectedIdRef.current = selectedId;
  }, [listings, selectedId]);

  const renderMarkers = useCallback((mapInstance: mapboxgl.Map) => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const withCoords = listingsRef.current.filter(
      (l) => l.latitude != null && l.longitude != null
    );

    markersRef.current = withCoords.map((listing) => {
      const numericPrice = Number(listing.price_per_day);
      const markerLabel = Number.isFinite(numericPrice) && numericPrice > 0
        ? `${listing.currency || "SAR"} ${Math.round(numericPrice)}`
        : "View";
      const el = document.createElement("button");
      el.type = "button";
      el.className = "listings-map-marker";
      el.innerHTML = `
        <div style="
          min-width: 40px;
          min-height: 40px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: ${selectedIdRef.current === listing.id ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(255,255,255,0.94)"};
          color: ${selectedIdRef.current === listing.id ? "#ffffff" : "#281a46"};
          border: 1px solid rgba(255,255,255,0.85);
          box-shadow: 0 10px 26px rgba(34, 17, 68, 0.16);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(10px);
        ">${markerLabel}</div>
      `;
      el.onclick = () => onSelectListing?.(listing.id);
      return new mapboxgl.Marker({ element: el })
        .setLngLat([listing.longitude!, listing.latitude!])
        .addTo(mapInstance);
    });

    if (withCoords.length > 1) {
      const lngs = withCoords.map((l) => l.longitude!);
      const lats = withCoords.map((l) => l.latitude!);
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );
      mapInstance.fitBounds(bounds, { padding: 32, maxZoom: 12 });
    }
  }, [onSelectListing]);

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

      renderMarkers(mapInstance);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [centerLat, centerLng, radiusM, createCircle, renderMarkers]);

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

  useEffect(() => {
    if (!map.current) return;
    renderMarkers(map.current);
  }, [renderMarkers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`surface-panel flex items-center justify-center rounded-[28px] bg-muted/30 text-sm text-muted-foreground ${className}`}
        style={{ minHeight: 280 }}
      >
        Map unavailable (no token)
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[28px] border border-white/70 bg-muted/20 ${className}`}>
      <div
        ref={mapContainer}
        className={`h-full min-h-[240px] w-full rounded-[24px] sm:min-h-[300px] lg:min-h-[420px] ${mapHeightClassName}`}
      />
      {!hideFooter && (
        <div className="flex items-center justify-end gap-2 border-t border-border bg-background/80 px-3 py-2 text-[10px] text-muted-foreground">
          <span>© Mapbox</span>
          <span>© OpenStreetMap</span>
        </div>
      )}
    </div>
  );
}

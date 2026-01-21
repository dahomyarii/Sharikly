'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface LocationPickerProps {
  onLocationChange?: (lat: number, lng: number, radius: number) => void;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  readOnly?: boolean;
}

const RIYADH_LAT = 24.7136;
const RIYADH_LNG = 46.6753;

export default function LocationPicker({
  onLocationChange,
  initialLat = RIYADH_LAT,
  initialLng = RIYADH_LNG,
  initialRadius = 300,
  readOnly = false,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const circleSource = useRef<mapboxgl.GeoJSONSource | null>(null);

  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  const [radius, setRadius] = useState(initialRadius);

  // Function to create a circle GeoJSON from center point and radius
  const createCircle = useCallback((lat: number, lng: number, radiusM: number) => {
    const earthRadiusM = 6371000;
    const radiusLat = (radiusM / earthRadiusM) * (180 / Math.PI);
    const radiusLng =
      (radiusM / (earthRadiusM * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

    const steps = 64;
    const coordinates = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * (2 * Math.PI);
      coordinates.push([
        lng + radiusLng * Math.cos(angle),
        lat + radiusLat * Math.sin(angle),
      ]);
    }

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates],
      },
      properties: {},
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 13,
    });

    map.current.on('load', () => {
      const mapInstance = map.current;
      if (!mapInstance) return;

      // Add circle source and layer
      mapInstance.addSource('circle-source', {
        type: 'geojson',
        data: createCircle(latitude, longitude, radius),
      });
      circleSource.current = mapInstance.getSource('circle-source') as mapboxgl.GeoJSONSource;

      mapInstance.addLayer({
        id: 'circle-layer',
        type: 'fill',
        source: 'circle-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.2,
        },
      });

      mapInstance.addLayer({
        id: 'circle-stroke',
        type: 'line',
        source: 'circle-source',
        paint: {
          'line-color': '#ef4444',
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // Add marker
      const markerEl = document.createElement('div');
      markerEl.className = 'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer';
      
      marker.current = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([longitude, latitude])
        .addTo(mapInstance);

      // Handle map clicks if not readonly
      if (!readOnly) {
        mapInstance.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          setLatitude(lat);
          setLongitude(lng);
          onLocationChange?.(lat, lng, radius);

          // Update marker
          if (marker.current) {
            marker.current.setLngLat([lng, lat]);
          }

          // Update circle
          if (circleSource.current) {
            circleSource.current.setData(createCircle(lat, lng, radius));
          }
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update circle when radius changes
  useEffect(() => {
    if (circleSource.current) {
      circleSource.current.setData(createCircle(latitude, longitude, radius));
    }
    onLocationChange?.(latitude, longitude, radius);
  }, [radius, createCircle]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">
          {readOnly ? 'Pickup Location' : 'Select Pickup Location'}
        </h2>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-[400px] rounded-lg border border-gray-200 overflow-hidden"
      />

      <div className="space-y-3 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Latitude</label>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {latitude.toFixed(6)}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Longitude</label>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {longitude.toFixed(6)}
            </div>
          </div>
        </div>

        {!readOnly && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              Pickup Radius: {radius}m
            </label>
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full mt-2 cursor-pointer"
            />
          </div>
        )}

        {readOnly && (
          <div>
            <label className="text-sm font-medium text-gray-700">Pickup Radius</label>
            <div className="text-lg font-semibold text-gray-900 mt-1">{radius}m</div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Click on the map to select a location. Drag the radius slider to adjust service area.
        </div>
      )}
    </Card>
  );
}

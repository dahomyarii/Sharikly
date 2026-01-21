// app/map-test/page.tsx
"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapTest() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [46.6753, 24.7136], // Riyadh
      zoom: 10,
    });
  }, []);

  return <div ref={ref} style={{ height: "500px" }} />;
}

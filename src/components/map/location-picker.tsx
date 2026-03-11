"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

interface LocationPickerProps {
  onLocationChange: (data: {
    lat: number;
    lng: number;
    city: string;
    zipCode: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

export function LocationPicker({
  onLocationChange,
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function init() {
      const L = (await import("leaflet")).default;
      // @ts-expect-error leaflet css import
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icon
      const icon = L.divIcon({
        html: `<div style="width:24px;height:24px;background:#f97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "",
      });

      const defaultCenter: [number, number] = initialLat && initialLng
        ? [initialLat, initialLng]
        : [51.1657, 10.4515]; // Germany center

      const map = L.map(containerRef.current!, {
        center: defaultCenter,
        zoom: initialLat ? 14 : 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng], { icon }).addTo(map);
      }

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }

        // Reverse geocode with Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "de" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const city =
            addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
          const zipCode = addr.postcode ?? "";
          onLocationChange({ lat, lng, city, zipCode });
        } catch {
          onLocationChange({ lat, lng, city: "", zipCode: "" });
        }
      });
    }

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height: "300px", width: "100%", borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", zIndex: 0 }}
      />
      <p className="text-xs text-muted-foreground">
        🔒 Andere Nutzer sehen nur den ungefähren Umkreis deines Standorts. Die genaue Adresse wird nur dem Handwerker angezeigt, der den Auftrag erhält.
      </p>
    </div>
  );
}

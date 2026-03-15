"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { Button } from "@/components/ui/button";
import { LocateFixed, Loader2 } from "lucide-react";

interface LocationPickerProps {
  onLocationChange: (data: {
    city: string;
    zipCode: string;
  }) => void;
}

export function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<ReturnType<typeof import("leaflet")["default"]["divIcon"]> | null>(null);
  const [locating, setLocating] = useState(false);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "de" } }
      );
      const data = await res.json();
      const addr = data.address ?? {};
      const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
      const zipCode = addr.postcode ?? "";
      onLocationChange({ city, zipCode });
    } catch {
      onLocationChange({ city: "", zipCode: "" });
    }
  }

  function placeMarker(lat: number, lng: number) {
    const map = mapRef.current;
    if (!map || !iconRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (L) markerRef.current = L.marker([lat, lng], { icon: iconRef.current }).addTo(map);
    }
    map.setView([lat, lng], 14);
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
        await reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function init() {
      const L = (await import("leaflet")).default;
      // @ts-expect-error leaflet css import
      await import("leaflet/dist/leaflet.css");

      // Store L on window so placeMarker can access it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).L = L;

      const icon = L.divIcon({
        html: `<div style="width:24px;height:24px;background:#f97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "",
      });

      iconRef.current = icon;

      const map = L.map(containerRef.current!, {
        center: [51.1657, 10.4515],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }

        await reverseGeocode(lat, lng);
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
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocate}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 mr-2" />
          )}
          Aktuellen Standort verwenden
        </Button>
      </div>
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

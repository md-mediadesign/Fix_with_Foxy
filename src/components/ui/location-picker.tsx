"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix default marker icons (Leaflet + webpack issue)
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  onLocationChange: (city: string, zipCode: string) => void;
  disabled?: boolean;
}

interface LatLng {
  lat: number;
  lng: number;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; zipCode: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=de`,
    { headers: { "Accept-Language": "de" } }
  );
  const data = await res.json();
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
  const zipCode = addr.postcode || "";
  return { city, zipCode };
}

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({ onLocationChange, disabled }: LocationPickerProps) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string>("");

  async function handleMapClick(latlng: LatLng) {
    if (disabled) return;
    setPosition(latlng);
    setIsGeocoding(true);
    setGeoError("");
    try {
      const { city, zipCode } = await reverseGeocode(latlng.lat, latlng.lng);
      setLocationLabel(city && zipCode ? `${city}, ${zipCode}` : city || zipCode || "Unbekannter Ort");
      onLocationChange(city, zipCode);
    } catch {
      setGeoError("Standort konnte nicht ermittelt werden. Bitte erneut versuchen.");
    } finally {
      setIsGeocoding(false);
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation wird von deinem Browser nicht unterstützt.");
      return;
    }
    setIsGeocoding(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(latlng);
        try {
          const { city, zipCode } = await reverseGeocode(latlng.lat, latlng.lng);
          setLocationLabel(city && zipCode ? `${city}, ${zipCode}` : city || zipCode || "Unbekannter Ort");
          onLocationChange(city, zipCode);
        } catch {
          setGeoError("Standort konnte nicht ermittelt werden.");
        } finally {
          setIsGeocoding(false);
        }
      },
      () => {
        setGeoError("Zugriff auf Standort verweigert.");
        setIsGeocoding(false);
      }
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border">
        <MapContainer
          center={[51.1657, 10.4515]}
          zoom={6}
          style={{ height: "280px", width: "100%", cursor: disabled ? "default" : "crosshair" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {position && <Marker position={[position.lat, position.lng]} icon={markerIcon} />}
        </MapContainer>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGeolocate}
        disabled={disabled || isGeocoding}
        className="w-full"
      >
        <Locate className="mr-2 h-4 w-4" />
        {isGeocoding ? "Wird ermittelt…" : "Meinen Standort verwenden"}
      </Button>

      {locationLabel && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {locationLabel}
        </p>
      )}

      {geoError && (
        <p className="text-sm text-destructive">{geoError}</p>
      )}

      <p className="text-xs text-muted-foreground">
        🔒 Dein Standort wird mit niemandem geteilt.
      </p>
    </div>
  );
}

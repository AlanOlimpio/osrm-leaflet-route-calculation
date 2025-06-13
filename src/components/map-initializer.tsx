"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

type Props = {
  onMapReady: (map: L.Map) => void;
};

export default function MapInitializer({ onMapReady }: Props) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

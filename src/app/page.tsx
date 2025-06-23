"use client";

import { decodePolyline } from "@/utils/decode-polyline";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";

const NavigatorMap = dynamic(() => import("@/components/navigator-map"), {
  ssr: false,
});

export type SearchResult = { display_name: string; lat: string; lon: string };

export default function Page() {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const routeRef = useRef<[number, number][]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  const calculateRoute = useCallback(
    async (origin: [number, number], destination: [number, number]) => {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: { lon: origin[1], lat: origin[0] },
          to: { lon: destination[1], lat: destination[0] },
        }),
      });

      const result = await response.json();

      if (!result.routes || result.routes.length === 0) {
        alert("Não foi possível calcular a rota.");
        return [];
      }

      const encodedShape = result.routes[0].geometry;
      const decoded = decodePolyline(encodedShape, 5);
      setRouteCoords(decoded);
      routeRef.current = decoded;

      if (decoded.length > 0 && mapRef.current) {
        mapRef.current.setView(origin, 17, { animate: true });
      }

      return decoded;
    },
    []
  );

  const MemoNavigatorMap = useMemo(
    () => (
      <NavigatorMap
        setRouteCoords={setRouteCoords}
        userPosition={userPosition}
        setUserPosition={setUserPosition}
        routeRef={routeRef}
        mapRef={mapRef}
        calculateRoute={calculateRoute}
        routeCoords={routeCoords}
        setSearchQuery={setSearchQuery}
        searchQuery={searchQuery}
        setSearchResults={setSearchResults}
        searchResults={searchResults}
      />
    ),
    [
      userPosition,
      routeCoords,
      calculateRoute,
      searchQuery,
      searchResults,
      setRouteCoords,
    ]
  );

  return MemoNavigatorMap;
}

"use client";
import "@/utils/leaflet-rotate-loader";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import * as L from "leaflet";
import * as turf from "@turf/turf";
import useWakeLock from "@/hooks/useWakeLock";
import "leaflet/dist/leaflet.css";
import { defaultIcon } from "./default-icon";
import { autoIcon } from "./auto-icon";
import MapInitializer from "./map-initializer";
import { SearchResult } from "@/app/page";

interface NavigatorMapPropd {
  userPosition: [number, number] | null;
  setUserPosition: Dispatch<SetStateAction<[number, number] | null>>;
  routeRef: RefObject<[number, number][]>;
  mapRef: RefObject<L.Map | null>;
  calculateRoute: (
    origin: [number, number],
    destination: [number, number]
  ) => Promise<[number, number][]>;
  routeCoords: [number, number][];
  setRouteCoords: Dispatch<SetStateAction<[number, number][]>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  setSearchResults: Dispatch<SetStateAction<SearchResult[]>>;
  searchResults: SearchResult[];
}

export default function NavigatorMap({
  calculateRoute,
  mapRef,
  routeCoords,
  routeRef,
  setUserPosition,
  userPosition,
  setRouteCoords,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}: NavigatorMapPropd) {
  const [dest, setDest] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const previousPosRef = useRef<[number, number] | null>(null);
  const lastBearingRef = useRef<number>(0);
  const [hasArrived, setHasArrived] = useState(false);

  useWakeLock();

  const handleUserLocationUpdate = async (coords: GeolocationCoordinates) => {
    const userPoint: [number, number] = [coords.latitude, coords.longitude];
    setUserPosition(userPoint);

    if (!dest || routeRef.current.length < 2) return;

    if (
      typeof coords.latitude !== "number" ||
      typeof coords.longitude !== "number" ||
      isNaN(coords.latitude) ||
      isNaN(coords.longitude)
    ) {
      console.warn("Coordenadas inválidas recebidas:", coords);
      return;
    }

    if (
      typeof coords.latitude !== "number" ||
      typeof coords.longitude !== "number" ||
      isNaN(coords.latitude) ||
      isNaN(coords.longitude)
    ) {
      console.warn("Coordenadas inválidas recebidas:", coords);
      return;
    }

    const turfPoint = turf.point([userPoint[1], userPoint[0]]);
    const turfLine = turf.lineString(
      routeRef.current.map(([lat, lon]) => [lon, lat])
    );

    const distance = turf.pointToLineDistance(turfPoint, turfLine, {
      units: "meters",
    });
    //  Verifica necessidade de recalcular a rota primeiro
    if (distance > 30) {
      setIsRecalculating(true);
      const newRoute = await calculateRoute(userPoint, dest);
      routeRef.current = newRoute;
      setRouteCoords(newRoute);
      setTimeout(() => setIsRecalculating(false), 3000);
    } else {
      let closestIndex = 0;
      let minDistance = Infinity;

      routeRef.current.forEach(([lat, lon], idx) => {
        const dist = turf.distance(turfPoint, turf.point([lon, lat]), {
          units: "meters",
        });
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      });

      const updatedRoute = [
        userPoint,
        ...routeRef.current.slice(closestIndex + 1),
      ];
      routeRef.current = updatedRoute;
      setRouteCoords(updatedRoute);
    }
    const destinationPoint = turf.point([dest[1], dest[0]]);
    const distanceToDestination = turf.distance(turfPoint, destinationPoint, {
      units: "meters",
    });
    if (distanceToDestination < 15) {
      setHasArrived(true);
      setTimeout(() => setHasArrived(false), 4000);
      setDest(null);
      setRouteCoords([]);
      return;
    }
    //  executa rotação com bearing

    if (previousPosRef.current && mapRef.current && mapRef.current.setBearing) {
      const from = turf.point([
        previousPosRef.current[1],
        previousPosRef.current[0],
      ]);
      const to = turf.point([userPoint[1], userPoint[0]]);
      const angle = turf.bearing(from, to);

      if (Math.abs(lastBearingRef.current - angle) > 10) {
        mapRef.current.setBearing(angle * -1);
        lastBearingRef.current = angle;
      }

      mapRef.current.setView(userPoint, 17, {
        animate: true,
      });
    }

    // Atualiza a posição anterior por último
    previousPosRef.current = userPoint;
  };

  useEffect(() => {
    if (!navigator.geolocation || !dest) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        mapRef.current?.panTo(userPosition!, { animate: true });

        return handleUserLocationUpdate(position.coords);
      },
      (err) => console.error("Erro ao obter localização:", err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [dest, calculateRoute]);

  const handleSelectResult = async (result: SearchResult) => {
    if (!userPosition) {
      alert("Aguarde a localização ser carregada.");
      return;
    }

    const destCoords: [number, number] = [
      parseFloat(result.lat),
      parseFloat(result.lon),
    ];

    if (dest && dest[0] === destCoords[0] && dest[1] === destCoords[1]) return;

    setSearchQuery(result.display_name);
    setSearchResults([]);
    setDest(destCoords);

    const route = await calculateRoute(userPosition, destCoords);
    setRouteCoords(route);
    if (mapRef.current) {
      mapRef.current.setView(userPosition, 17, { animate: true });
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!Array.isArray(searchResults) || searchQuery.length < 3) {
        return (searchResults = []);
      }
      setIsLoading(true);
      fetch(`/api/search?q=${searchQuery}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data))
        .finally(() => setIsLoading(false));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  function requestLocationAgain() {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin: [number, number] = [coords.latitude, coords.longitude];
        setUserPosition(origin);
        setLocationDenied(false);
        if (mapRef.current) {
          mapRef.current.setView(origin, 14);
        }
      },
      (err) => {
        console.error(err);
        alert("Não foi possível obter sua localização.");
        setLocationDenied(true);
      },
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin: [number, number] = [coords.latitude, coords.longitude];
        setUserPosition(origin);
        setLocationDenied(false);
        mapRef.current?.setView(origin, 14);
      },
      (err) => {
        console.error(err);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <>
      {/* Campo de busca */}
      <div className="absolute top-4 right-4 z-[9999] w-[80%] max-w-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          placeholder="Digite um endereço"
          className="w-full rounded border px-3 py-2 shadow text-sm focus:outline-none"
        />
        {isFocused && (
          <ul className="mt-1 max-h-48 overflow-y-auto rounded bg-white shadow text-sm">
            {searchResults.map((result, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="cursor-pointer px-3 py-2 hover:bg-blue-100 border-b text-gray-500"
              >
                {result.display_name}
              </li>
            ))}
            {searchQuery.length >= 3 && isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                <svg
                  className="h-4 w-4 animate-spin text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Buscando endereços...
              </div>
            )}
          </ul>
        )}
      </div>

      {/* Botão: centralizar no usuário */}
      {userPosition && (
        <button
          onClick={() => mapRef.current?.setView(userPosition, 17)}
          className="absolute bottom-4 right-4 z-[9999] rounded-full bg-blue-600 px-4 py-2 text-white shadow-md hover:bg-blue-700 transition"
        >
          Centralizar
        </button>
      )}

      {/* Botão: solicitar localização novamente */}
      {locationDenied && (
        <button
          onClick={requestLocationAgain}
          className="absolute bottom-4 left-4 z-[9999] rounded-full bg-orange-600 px-4 py-2 text-white shadow-md hover:bg-orange-700 transition"
        >
          Tentar localizar novamente
        </button>
      )}

      {/* Aviso de erro na rota */}
      {!routeCoords.length && dest && (
        <div className="absolute bottom-4 left-4 z-[9999] bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md shadow">
          Não foi possível traçar a rota.
        </div>
      )}
      {isRecalculating && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md shadow">
          Saindo da rota... recalculando.
        </div>
      )}
      {hasArrived && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-md shadow">
          Você chegou ao destino!
        </div>
      )}

      {/* Mapa */}

      <MapContainer
        ref={mapRef}
        center={userPosition || [-23.55, -46.63]}
        zoom={14}
        className="h-screen w-screen"
        scrollWheelZoom={true}
        touchRotate={true}
        rotate={true}
      >
        <MapInitializer onMapReady={(map) => (mapRef.current = map)} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {routeCoords.length > 0 && (
          <>
            <Polyline positions={routeCoords} color="blue" />
            {dest && (
              <Marker
                icon={defaultIcon}
                position={routeCoords[routeCoords.length - 1]}
              />
            )}
          </>
        )}

        {userPosition && (
          <>
            <Marker icon={autoIcon} position={userPosition} draggable={false} />
          </>
        )}
      </MapContainer>
    </>
  );
}

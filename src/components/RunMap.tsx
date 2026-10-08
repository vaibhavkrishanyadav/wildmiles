"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type RunPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type RunMapProps = {
  points: RunPoint[];
};

export default function RunMap({
  points,
}: RunMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const routeRef =
    useRef<L.Polyline | null>(null);

  const currentPositionRef =
    useRef<L.CircleMarker | null>(null);


  /*
   * Create map once.
   */
  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map = L.map(
      mapContainerRef.current
    ).setView(
      [20, 0],
      2
    );

    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    mapRef.current = map;


    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);


  /*
   * Update route whenever GPS points change.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || points.length === 0) {
      return;
    }

    const coordinates: L.LatLngExpression[] =
      points.map((point) => [
        point.latitude,
        point.longitude,
      ]);


    /*
     * Create/update route.
     */
    if (!routeRef.current) {
      routeRef.current =
        L.polyline(
          coordinates,
          {
            weight: 5,
          }
        ).addTo(map);
    } else {
      routeRef.current.setLatLngs(
        coordinates
      );
    }


    /*
     * Latest GPS position.
     */
    const latest =
      points[points.length - 1];

    const latestPosition:
      L.LatLngExpression = [
        latest.latitude,
        latest.longitude,
      ];


    if (!currentPositionRef.current) {
      currentPositionRef.current =
        L.circleMarker(
          latestPosition,
          {
            radius: 8,
          }
        ).addTo(map);
    } else {
      currentPositionRef.current.setLatLng(
        latestPosition
      );
    }


    /*
     * First point:
     * zoom into the runner.
     */
    if (points.length === 1) {
      map.setView(
        latestPosition,
        17
      );
    } else {
      /*
       * Keep current runner visible
       * as the route grows.
       */
      map.panTo(
        latestPosition,
        {
          animate: true,
        }
      );
    }

  }, [points]);


  return (
    <div
      ref={mapContainerRef}
      className="h-[400px] w-full rounded-2xl"
    />
  );
}
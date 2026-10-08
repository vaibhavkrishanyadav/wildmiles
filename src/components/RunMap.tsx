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
  checkpoints: QuestCheckpoint[];
};

type QuestCheckpoint = {
  type: string;
  title: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  distanceKm: number;
};

export default function RunMap({
  points,
  checkpoints,
}: RunMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const routeRef =
    useRef<L.Polyline | null>(null);

  const currentPositionRef =
    useRef<L.CircleMarker | null>(null);

  const checkpointMarkersRef = useRef<L.Marker[]>([]);

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

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    /*
    * Remove old markers before
    * rebuilding the checkpoint layer.
    */
    checkpointMarkersRef.current.forEach(
      (marker) => {
        marker.remove();
      }
    );

    checkpointMarkersRef.current = [];


    checkpoints.forEach(
      (checkpoint) => {

        let emoji = "📍";

        if (
          checkpoint.type ===
          "movement"
        ) {
          emoji = "🏃";
        }

        if (
          checkpoint.type ===
          "exploration"
        ) {
          emoji = "🧭";
        }

        if (
          checkpoint.type ===
          "photo"
        ) {
          emoji = "📸";
        }

        if (
          checkpoint.type ===
          "finish"
        ) {
          emoji = "🏁";
        }


        const icon = L.divIcon({
          className:
            "wildmiles-checkpoint",

          html: `
            <div
              style="
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: #18181b;
                border: 2px solid #a3e635;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow:
                  0 4px 12px rgba(0,0,0,0.4);
              "
            >
              ${emoji}
            </div>
          `,

          iconSize: [38, 38],

          iconAnchor: [19, 19],
        });


        const marker = L.marker(
          [
            checkpoint.latitude,
            checkpoint.longitude,
          ],
          {
            icon,
            title:
              checkpoint.title,
          }
        )
          .addTo(map)
          .bindPopup(`
            <div>
              <strong>
                ${emoji}
                ${checkpoint.title}
              </strong>

              <br />

              Completed at
              ${checkpoint.distanceKm.toFixed(
                2
              )} km
            </div>
          `);


        checkpointMarkersRef.current.push(
          marker
        );
      }
    );

  }, [checkpoints]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[400px] w-full rounded-2xl"
    />
  );
}
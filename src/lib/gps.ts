import type { RunPoint } from "@/types/wildmiles";
import { GPS_CONFIG } from "@/lib/constants";

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

export function shouldAcceptGpsPoint(
  previous: RunPoint | null,
  current: RunPoint
) {
  if (
    current.accuracy >
    GPS_CONFIG.MAX_ACCURACY_METERS
  ) {
    return false;
  }

  if (!previous) {
    return true;
  }

  const distanceKm = calculateDistanceKm(
    previous.latitude,
    previous.longitude,
    current.latitude,
    current.longitude
  );

  const distanceMeters = distanceKm * 1000;

  if (
    distanceMeters <
    GPS_CONFIG.MIN_MOVEMENT_METERS
  ) {
    return false;
  }

  const timeSeconds =
    (current.timestamp - previous.timestamp) /
    1000;

  if (timeSeconds <= 0) {
    return false;
  }

  const speedMetersPerSecond =
    distanceMeters / timeSeconds;

  if (
    speedMetersPerSecond >
    GPS_CONFIG.MAX_SPEED_METERS_PER_SECOND
  ) {
    return false;
  }

  return true;
}

export function formatTime(
  totalSeconds: number
) {
  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(2, "0")
    )
    .join(":");
}

export function formatPace(
  paceMinutes: number
) {
  if (
    !Number.isFinite(paceMinutes) ||
    paceMinutes <= 0
  ) {
    return "--:--";
  }

  const minutes =
    Math.floor(paceMinutes);

  const seconds =
    Math.round(
      (paceMinutes - minutes) * 60
    );

  return `${minutes}:${String(
    seconds
  ).padStart(2, "0")}`;
}
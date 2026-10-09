"use client";

import dynamic from "next/dynamic";

import CheckpointStatus from "@/components/CheckpointStatus";
import RunStat from "@/components/RunStat";

import type {
  QuestCheckpoint,
  RunPoint,
} from "@/types/wildmiles";

import {
  formatPace,
  formatTime,
} from "@/lib/gps";


const RunMap = dynamic(
  () =>
    import(
      "@/components/RunMap"
    ),
  {
    ssr: false,
  }
);


type RunTrackerProps = {
  runActive: boolean;
  elapsedSeconds: number;
  distanceKm: number;
  averagePace: number;
  gpsAccuracy: number | null;
  gpsError: string;

  runPoints: RunPoint[];
  questCheckpoints:
    QuestCheckpoint[];

  completedChallenges:
    string[];

  hasQuest: boolean;

  onStartRun: () => void;
  onStopRun: () => void;
};


export default function RunTracker({
  runActive,
  elapsedSeconds,
  distanceKm,
  averagePace,
  gpsAccuracy,
  gpsError,
  runPoints,
  questCheckpoints,
  completedChallenges,
  hasQuest,
  onStartRun,
  onStopRun,
}: RunTrackerProps) {
  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">

      <div className="flex items-center justify-between gap-4">

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">
            Live Run
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Outdoor Tracker
          </h2>

        </div>


        <div
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            runActive
              ? "bg-lime-400/10 text-lime-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {runActive
            ? "● Tracking"
            : "Not running"}
        </div>

      </div>


      {/* STATS */}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

        <RunStat
          label="Time"
          value={
            formatTime(
              elapsedSeconds
            )
          }
        />

        <RunStat
          label="Distance"
          value={`${distanceKm.toFixed(
            2
          )} km`}
        />

        <RunStat
          label="Avg Pace"
          value={`${formatPace(
            averagePace
          )} /km`}
        />

        <RunStat
          label="GPS"
          value={
            gpsAccuracy !== null
              ? `±${Math.round(
                  gpsAccuracy
                )} m`
              : "--"
          }
        />

      </div>


      {/* MAP */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">

        {runPoints.length > 0 ? (
          <RunMap
            points={runPoints}
            checkpoints={
              questCheckpoints
            }
          />
        ) : (
          <div className="flex h-[400px] items-center justify-center bg-zinc-950">

            <div className="text-center">

              <p className="text-4xl">
                🗺️
              </p>

              <p className="mt-3 font-semibold text-zinc-300">
                Your route will appear here
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Start your run to begin GPS tracking.
              </p>

            </div>

          </div>
        )}


        {hasQuest && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-4">

            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Quest Checkpoints
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

              <CheckpointStatus
                emoji="🏃"
                label="Movement"
                completed={
                  completedChallenges.includes(
                    "movement"
                  )
                }
              />

              <CheckpointStatus
                emoji="🧭"
                label="Explore"
                completed={
                  completedChallenges.includes(
                    "exploration"
                  )
                }
              />

              <CheckpointStatus
                emoji="📸"
                label="Photo"
                completed={
                  completedChallenges.includes(
                    "photo"
                  )
                }
              />

              <CheckpointStatus
                emoji="🏁"
                label="Finish"
                completed={
                  completedChallenges.includes(
                    "finish"
                  )
                }
              />

            </div>

          </div>
        )}

      </div>


      {/* GPS ERROR */}

      {gpsError && (
        <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {gpsError}
        </div>
      )}


      {/* START / STOP */}

      <div className="mt-8">

        {!runActive ? (
          <button
            onClick={
              onStartRun
            }
            className="w-full rounded-xl bg-lime-400 px-6 py-4 text-lg font-bold text-black transition hover:bg-lime-300"
          >
            ▶ Start Run
          </button>
        ) : (
          <button
            onClick={
              onStopRun
            }
            className="w-full rounded-xl bg-red-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-red-400"
          >
            ■ Stop Run
          </button>
        )}

      </div>


      {runActive && (
        <p className="mt-4 text-center text-xs text-zinc-500">

          Valid GPS points:{" "}
          {runPoints.length}

          {gpsAccuracy !== null &&
            ` • Current accuracy ±${Math.round(
              gpsAccuracy
            )} m`}

        </p>
      )}

    </section>
  );
}
"use client";

import RunStat from "@/components/RunStat";

import type {
  RunRecap as RunRecapType,
} from "@/types/wildmiles";

import {
  formatPace,
  formatTime,
} from "@/lib/gps";


type RunRecapProps = {
  runFinished: boolean;

  distanceKm: number;
  elapsedSeconds: number;
  averagePace: number;

  recap:
    | RunRecapType
    | null;

  recapLoading: boolean;

  onGenerateRecap:
    () => void;
};


export default function RunRecap({
  runFinished,
  distanceKm,
  elapsedSeconds,
  averagePace,
  recap,
  recapLoading,
  onGenerateRecap,
}: RunRecapProps) {
  if (!runFinished) {
    return null;
  }

  return (
    <section className="mt-6 rounded-3xl border border-lime-900 bg-lime-950/20 p-6">

      <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">
        Run Complete
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        Nice miles 🌿
      </h2>


      <div className="mt-6 grid grid-cols-3 gap-3">

        <RunStat
          label="Distance"
          value={`${distanceKm.toFixed(
            2
          )} km`}
        />

        <RunStat
          label="Time"
          value={
            formatTime(
              elapsedSeconds
            )
          }
        />

        <RunStat
          label="Avg Pace"
          value={`${formatPace(
            averagePace
          )} /km`}
        />

      </div>


      <div className="mt-6">

        <button
          onClick={
            onGenerateRecap
          }
          disabled={
            recapLoading
          }
          className="w-full rounded-xl bg-lime-400 px-6 py-4 font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {recapLoading
            ? "Writing your adventure..."
            : "✨ Generate Adventure Recap"}
        </button>

      </div>


      {recap && (
        <div className="mt-6 rounded-2xl border border-lime-900 bg-zinc-950 p-6">

          <p className="text-xs font-semibold uppercase tracking-widest text-lime-400">
            WildMiles Story
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {recap.title}
          </h3>

          <p className="mt-4 leading-7 text-zinc-300">
            {recap.recap}
          </p>


          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">

            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Adventure Highlight
            </p>

            <p className="mt-2 text-zinc-200">
              🌿 {recap.highlight}
            </p>

          </div>


          <p className="mt-5 font-medium text-lime-300">
            {recap.closingLine}
          </p>

        </div>
      )}

    </section>
  );
}
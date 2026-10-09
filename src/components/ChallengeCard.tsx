"use client";

import type {
  Challenge,
} from "@/types/wildmiles";

type ChallengeCardProps = {
  emoji: string;
  challenge: Challenge;
  completed: boolean;
  onToggle: () => void;
  runActive: boolean;
};

export default function ChallengeCard({
  emoji,
  challenge,
  completed,
  onToggle,
  runActive,
}: ChallengeCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        completed
          ? "border-lime-500 bg-lime-950/30"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-4">

        <div className="text-3xl">
          {completed ? "✅" : emoji}
        </div>

        <div className="flex-1">

          <div className="flex items-center justify-between gap-4">

            <h3
              className={`text-lg font-semibold ${
                completed
                  ? "text-lime-300"
                  : ""
              }`}
            >
              {challenge.title}
            </h3>

            <span className="whitespace-nowrap text-sm font-semibold text-lime-400">
              +{challenge.xp} XP
            </span>

          </div>

          <p className="mt-2 text-zinc-400">
            {challenge.instruction}
          </p>

          {challenge.requiresPhoto && (
            <p className="mt-3 text-sm font-medium text-lime-300">
              📷 Photo proof required
            </p>
          )}

          <button
            onClick={onToggle}
            disabled={!runActive}
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              completed
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-lime-400 text-black hover:bg-lime-300"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {!runActive && !completed
              ? "Start Run First"
              : completed
                ? "Undo"
                : "Complete Challenge"}
          </button>

        </div>
      </div>
    </div>
  );
}
"use client";

import type {
  ChangeEvent,
} from "react";

import type {
  Challenge,
  PhotoVerificationResult,
} from "@/types/wildmiles";

type PhotoChallengeCardProps = {
  challenge: Challenge;
  completed: boolean;
  photoPreview: string | null;
  photoResult:
    | PhotoVerificationResult
    | null;
  verifying: boolean;
  onPhotoUpload: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onVerify: () => void;
  runActive: boolean;
};

export default function PhotoChallengeCard({
  challenge,
  completed,
  photoPreview,
  photoResult,
  verifying,
  onPhotoUpload,
  onVerify,
  runActive,
}: PhotoChallengeCardProps) {
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
          {completed ? "✅" : "📸"}
        </div>

        <div className="flex-1">

          <div className="flex items-center justify-between gap-4">

            <h3 className="text-lg font-semibold">
              {challenge.title}
            </h3>

            <span className="whitespace-nowrap text-sm font-semibold text-lime-400">
              +{challenge.xp} XP
            </span>

          </div>

          <p className="mt-2 text-zinc-400">
            {challenge.instruction}
          </p>

          <p className="mt-3 text-sm font-medium text-lime-300">
            📷 AI verified photo proof required
          </p>


          {!completed && runActive && (
            <div className="mt-5">

              <label className="inline-block cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700">

                📷 Choose Photo

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhotoUpload}
                  className="hidden"
                />

              </label>

            </div>
          )}


          {!runActive && !completed && (
            <p className="mt-4 text-sm text-zinc-500">
              Start your run before completing this challenge.
            </p>
          )}


          {photoPreview && (
            <div className="mt-5">

              <img
                src={photoPreview}
                alt="WildMiles challenge proof"
                className="max-h-80 rounded-xl border border-zinc-800 object-cover"
              />

            </div>
          )}


          {photoPreview && !completed && (
            <button
              onClick={onVerify}
              disabled={verifying}
              className="mt-4 rounded-lg bg-lime-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying
                ? "AI is checking..."
                : "Verify Photo"}
            </button>
          )}


          {photoResult && (
            <div
              className={`mt-5 rounded-xl border p-4 ${
                photoResult.verified
                  ? "border-lime-800 bg-lime-950/30"
                  : "border-red-900 bg-red-950/30"
              }`}
            >

              <p
                className={`font-semibold ${
                  photoResult.verified
                    ? "text-lime-300"
                    : "text-red-300"
                }`}
              >
                {photoResult.verified
                  ? "✅ Quest Verified"
                  : "❌ Quest Not Verified"}
              </p>

              <p className="mt-2 text-sm text-zinc-300">
                {photoResult.reason}
              </p>

              {photoResult.observation && (
                <p className="mt-3 text-sm text-zinc-400">
                  🌿 {photoResult.observation}
                </p>
              )}

              <p className="mt-3 text-xs text-zinc-500">
                Confidence:{" "}
                {Math.round(
                  photoResult.confidence *
                    100
                )}
                %
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
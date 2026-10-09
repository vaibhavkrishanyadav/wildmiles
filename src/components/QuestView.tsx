"use client";

import type {
  ChangeEvent,
} from "react";

import ChallengeCard from "@/components/ChallengeCard";
import PhotoChallengeCard from "@/components/PhotoChallengeCard";
import Stat from "@/components/Stat";

import type {
  PhotoVerificationResult,
  Quest,
} from "@/types/wildmiles";

type QuestViewProps = {
  quest: Quest | null;
  completedChallenges: string[];
  earnedXp: number;
  runActive: boolean;

  photoPreview: string | null;
  photoResult:
    | PhotoVerificationResult
    | null;

  photoVerifying: boolean;

  onToggleChallenge:
    (type: string) => void;

  onPhotoUpload:
    (
      event: ChangeEvent<HTMLInputElement>
    ) => void;

  onVerifyPhoto: () => void;
};

export default function QuestView({
  quest,
  completedChallenges,
  earnedXp,
  runActive,
  photoPreview,
  photoResult,
  photoVerifying,
  onToggleChallenge,
  onPhotoUpload,
  onVerifyPhoto,
}: QuestViewProps) {
  if (!quest) {
    return null;
  }

  const questCompleted =
    completedChallenges.length === 4;

  return (
    <section className="mt-10">

      <div className="mb-6">

        <p className="text-sm font-medium uppercase tracking-widest text-lime-400">
          Today&apos;s Quest
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          {quest.title}
        </h2>

        <p className="mt-3 text-zinc-400">
          {quest.summary}
        </p>

      </div>


      {/* META */}

      <div className="mb-6 grid grid-cols-3 gap-3">

        <Stat
          label="Duration"
          value={`${quest.settings.duration} min`}
        />

        <Stat
          label="Difficulty"
          value={
            quest.settings.difficulty
          }
        />

        <Stat
          label="Total XP"
          value={`${quest.totalXp} XP`}
        />

      </div>


      {/* WARMUP */}

      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Warm Up
        </p>

        <p className="text-zinc-200">
          {quest.warmup}
        </p>

      </div>


      {/* PROGRESS */}

      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-zinc-400">
              Quest Progress
            </p>

            <p className="mt-1 text-2xl font-bold">
              {completedChallenges.length} / 4
            </p>

          </div>


          <div className="text-right">

            <p className="text-sm text-zinc-400">
              XP Earned
            </p>

            <p className="mt-1 text-2xl font-bold text-lime-400">
              {earnedXp} XP
            </p>

          </div>

        </div>


        <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">

          <div
            className="h-full bg-lime-400 transition-all duration-300"
            style={{
              width: `${
                (
                  completedChallenges.length /
                  4
                ) * 100
              }%`,
            }}
          />

        </div>

      </div>


      {/* CHALLENGES */}

      <div className="space-y-4">

        <ChallengeCard
          emoji="🏃"
          challenge={
            quest.challenges.movement
          }
          completed={
            completedChallenges.includes(
              "movement"
            )
          }
          onToggle={() =>
            onToggleChallenge(
              "movement"
            )
          }
          runActive={runActive}
        />


        <ChallengeCard
          emoji="🧭"
          challenge={
            quest.challenges.exploration
          }
          completed={
            completedChallenges.includes(
              "exploration"
            )
          }
          onToggle={() =>
            onToggleChallenge(
              "exploration"
            )
          }
          runActive={runActive}
        />


        <PhotoChallengeCard
          challenge={
            quest.challenges.photo
          }
          completed={
            completedChallenges.includes(
              "photo"
            )
          }
          photoPreview={
            photoPreview
          }
          photoResult={
            photoResult
          }
          verifying={
            photoVerifying
          }
          onPhotoUpload={
            onPhotoUpload
          }
          onVerify={
            onVerifyPhoto
          }
          runActive={
            runActive
          }
        />


        <ChallengeCard
          emoji="🏁"
          challenge={
            quest.challenges.finish
          }
          completed={
            completedChallenges.includes(
              "finish"
            )
          }
          onToggle={() =>
            onToggleChallenge(
              "finish"
            )
          }
          runActive={runActive}
        />

      </div>


      {/* BONUS */}

      <div
        className={`mt-6 rounded-2xl border p-5 ${
          questCompleted
            ? "border-lime-500 bg-lime-950/40"
            : "border-zinc-800 bg-zinc-900"
        }`}
      >

        <div className="flex items-center justify-between">

          <div>

            <p
              className={`font-semibold ${
                questCompleted
                  ? "text-lime-300"
                  : "text-zinc-300"
              }`}
            >
              {questCompleted
                ? "Quest Complete 🌿"
                : "Complete all challenges"}
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              {questCompleted
                ? "You earned the full quest bonus."
                : "Finish every challenge to unlock the bonus."}
            </p>

          </div>

          <p className="text-xl font-bold text-lime-400">
            +{quest.completionBonus} XP
          </p>

        </div>

      </div>

    </section>
  );
}
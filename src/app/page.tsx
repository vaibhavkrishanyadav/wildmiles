"use client";

import { useState } from "react";

type Challenge = {
  title: string;
  instruction: string;
  type: string;
  requiresPhoto: boolean;
  xp: number;
};

type Quest = {
  title: string;
  summary: string;
  warmup: string;

  challenges: {
    movement: Challenge;
    exploration: Challenge;
    photo: Challenge;
    finish: Challenge;
  };

  completionBonus: number;
  totalXp: number;

  settings: {
    duration: number;
    difficulty: string;
    mode: string;
  };
};

export default function Home() {
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState("easy");
  const [mode, setMode] = useState("exploration");

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateQuest() {
    try {
      setLoading(true);
      setError("");
      setQuest(null);

      const response = await fetch("/api/quest", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          duration,
          difficulty,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate quest");
      }

      setQuest(data.quest);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* HEADER */}

        <header className="mb-12">

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
            WildMiles
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Turn your run into an adventure.
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            Local AI creates the quest.
            You create the miles.
          </p>

        </header>


        {/* QUEST SETTINGS */}

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">

          <h2 className="mb-8 text-2xl font-semibold">
            Build today&apos;s quest
          </h2>


          {/* DURATION */}

          <div className="mb-8">

            <p className="mb-3 text-sm font-medium text-zinc-300">
              How long do you want to run?
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              {[20, 30, 45, 60].map((value) => (

                <button
                  key={value}
                  onClick={() => setDuration(value)}
                  className={`rounded-xl border px-4 py-3 font-medium transition ${
                    duration === value
                      ? "border-lime-400 bg-lime-400 text-black"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {value} min
                </button>

              ))}

            </div>

          </div>


          {/* DIFFICULTY */}

          <div className="mb-8">

            <p className="mb-3 text-sm font-medium text-zinc-300">
              Difficulty
            </p>

            <div className="grid grid-cols-3 gap-3">

              {["easy", "moderate", "hard"].map((value) => (

                <button
                  key={value}
                  onClick={() => setDifficulty(value)}
                  className={`rounded-xl border px-4 py-3 capitalize transition ${
                    difficulty === value
                      ? "border-lime-400 bg-lime-400 text-black"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {value}
                </button>

              ))}

            </div>

          </div>


          {/* MODE */}

          <div className="mb-8">

            <p className="mb-3 text-sm font-medium text-zinc-300">
              What kind of adventure?
            </p>

            <div className="grid gap-3 sm:grid-cols-2">

              <ModeButton
                title="🧭 Exploration"
                description="Discover unfamiliar streets and places."
                selected={mode === "exploration"}
                onClick={() => setMode("exploration")}
              />

              <ModeButton
                title="🌿 Nature"
                description="Look for interesting things outdoors."
                selected={mode === "nature"}
                onClick={() => setMode("nature")}
              />

              <ModeButton
                title="⚡ Fitness"
                description="More running and movement challenges."
                selected={mode === "fitness"}
                onClick={() => setMode("fitness")}
              />

              <ModeButton
                title="🎲 Surprise Me"
                description="Let WildMiles decide your adventure."
                selected={mode === "surprise"}
                onClick={() => setMode("surprise")}
              />

            </div>

          </div>


          {/* GENERATE BUTTON */}

          <button
            onClick={generateQuest}
            disabled={loading}
            className="w-full rounded-xl bg-lime-400 px-6 py-4 text-lg font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? "Creating your adventure..."
              : "Generate My Quest"}

          </button>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mt-6 rounded-xl border border-red-900 bg-red-950 p-4 text-red-300">
            {error}
          </div>

        )}


        {/* GENERATED QUEST */}

        {quest && (

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


            {/* QUEST META */}

            <div className="mb-6 grid grid-cols-3 gap-3">

              <Stat
                label="Duration"
                value={`${quest.settings.duration} min`}
              />

              <Stat
                label="Difficulty"
                value={quest.settings.difficulty}
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


            {/* CHALLENGES */}

            <div className="space-y-4">

              <ChallengeCard
                emoji="🏃"
                challenge={quest.challenges.movement}
              />

              <ChallengeCard
                emoji="🧭"
                challenge={quest.challenges.exploration}
              />

              <ChallengeCard
                emoji="📸"
                challenge={quest.challenges.photo}
              />

              <ChallengeCard
                emoji="🏁"
                challenge={quest.challenges.finish}
              />

            </div>


            {/* COMPLETION BONUS */}

            <div className="mt-6 rounded-2xl border border-lime-900 bg-lime-950/30 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-lime-300">
                    Complete all challenges
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    Finish the full quest to earn the completion bonus.
                  </p>

                </div>

                <p className="text-xl font-bold text-lime-400">
                  +{quest.completionBonus} XP
                </p>

              </div>

            </div>

          </section>

        )}

      </div>

    </main>
  );
}


function ModeButton({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {

  return (

    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-lime-400 bg-lime-400/10"
          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
      }`}
    >

      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        {description}
      </p>

    </button>

  );
}


function ChallengeCard({
  emoji,
  challenge,
}: {
  emoji: string;
  challenge: Challenge;
}) {

  return (

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start gap-4">

        <div className="text-3xl">
          {emoji}
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

          {challenge.requiresPhoto && (

            <p className="mt-3 text-sm font-medium text-lime-300">
              📷 Photo proof required
            </p>

          )}

        </div>

      </div>

    </div>

  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">

      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 capitalize font-semibold">
        {value}
      </p>

    </div>

  );
}
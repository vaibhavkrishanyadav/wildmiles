"use client";

import ModeButton from "@/components/ModeButton";

type QuestBuilderProps = {
  duration: number;
  difficulty: string;
  mode: string;
  loading: boolean;

  onDurationChange: (duration: number) => void;
  onDifficultyChange: (difficulty: string) => void;
  onModeChange: (mode: string) => void;
  onGenerateQuest: () => void;
};

export default function QuestBuilder({
  duration,
  difficulty,
  mode,
  loading,
  onDurationChange,
  onDifficultyChange,
  onModeChange,
  onGenerateQuest,
}: QuestBuilderProps) {
  return (
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
              onClick={() =>
                onDurationChange(value)
              }
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

          {[
            "easy",
            "moderate",
            "hard",
          ].map((value) => (
            <button
              key={value}
              onClick={() =>
                onDifficultyChange(value)
              }
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
            selected={
              mode === "exploration"
            }
            onClick={() =>
              onModeChange("exploration")
            }
          />

          <ModeButton
            title="🌿 Nature"
            description="Look for interesting things outdoors."
            selected={
              mode === "nature"
            }
            onClick={() =>
              onModeChange("nature")
            }
          />

          <ModeButton
            title="⚡ Fitness"
            description="More running and movement challenges."
            selected={
              mode === "fitness"
            }
            onClick={() =>
              onModeChange("fitness")
            }
          />

          <ModeButton
            title="🎲 Surprise Me"
            description="Let WildMiles decide your adventure."
            selected={
              mode === "surprise"
            }
            onClick={() =>
              onModeChange("surprise")
            }
          />

        </div>
      </div>


      <button
        onClick={onGenerateQuest}
        disabled={loading}
        className="w-full rounded-xl bg-lime-400 px-6 py-4 text-lg font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating your adventure..."
          : "Generate My Quest"}
      </button>

    </section>
  );
}
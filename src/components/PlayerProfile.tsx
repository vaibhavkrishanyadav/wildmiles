import type {
  PlayerLevel,
} from "@/types/wildmiles";

type PlayerProfileProps = {
  totalXp: number;
  playerLevel: PlayerLevel;
};

export default function PlayerProfile({
  totalXp,
  playerLevel,
}: PlayerProfileProps) {
  return (
    <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-sm uppercase tracking-widest text-zinc-500">
            Your WildMiles Level
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {playerLevel.emoji} Level{" "}
            {playerLevel.level}
          </h2>

          <p className="mt-1 text-lime-400">
            {playerLevel.name}
          </p>

        </div>

        <div className="text-left sm:text-right">

          <p className="text-sm text-zinc-500">
            Total XP
          </p>

          <p className="text-3xl font-bold">
            {totalXp}
          </p>

        </div>

      </div>


      {playerLevel.nextLevelXp && (
        <div className="mt-6">

          <div className="mb-2 flex justify-between text-sm text-zinc-400">

            <span>
              Level progress
            </span>

            <span>
              {totalXp} /{" "}
              {playerLevel.nextLevelXp} XP
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

            <div
              className="h-full bg-lime-400 transition-all duration-300"
              style={{
                width: `${Math.min(
                  (totalXp /
                    playerLevel.nextLevelXp) *
                    100,
                  100
                )}%`,
              }}
            />

          </div>

        </div>
      )}

    </section>
  );
}
import type {
  Badge,
} from "@/types/wildmiles";

type BadgeListProps = {
  badges: Badge[];
};

export default function BadgeList({
  badges,
}: BadgeListProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">

      <p className="mb-3 text-sm uppercase tracking-widest text-zinc-500">
        Badges
      </p>

      <div className="grid gap-3 sm:grid-cols-2">

        {badges.map((badge) => (
          <div
            key={badge.name}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
          >

            <div className="flex items-start gap-3">

              <div className="text-3xl">
                {badge.emoji}
              </div>

              <div>

                <p className="font-semibold">
                  {badge.name}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  {badge.description}
                </p>

              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}
type CheckpointStatusProps = {
  emoji: string;
  label: string;
  completed: boolean;
};

export default function CheckpointStatus({
  emoji,
  label,
  completed,
}: CheckpointStatusProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        completed
          ? "border-lime-800 bg-lime-950/30"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>
          {completed ? "✅" : emoji}
        </span>

        <span
          className={
            completed
              ? "text-sm text-lime-300"
              : "text-sm text-zinc-400"
          }
        >
          {label}
        </span>
      </div>
    </div>
  );
}
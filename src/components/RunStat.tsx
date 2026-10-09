type RunStatProps = {
  label: string;
  value: string;
};

export default function RunStat({
  label,
  value,
}: RunStatProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}
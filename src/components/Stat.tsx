type StatProps = {
  label: string;
  value: string;
};

export default function Stat({
  label,
  value,
}: StatProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-semibold capitalize">
        {value}
      </p>
    </div>
  );
}
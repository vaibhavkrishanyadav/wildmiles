"use client";

type ModeButtonProps = {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export default function ModeButton({
  title,
  description,
  selected,
  onClick,
}: ModeButtonProps) {
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
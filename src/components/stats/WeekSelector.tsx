"use client";

type Props = {
  weekOf: string;
  onPrev: () => void;
  onNext: () => void;
};

function formatWeekLabel(weekOf: string): string {
  const date = new Date(weekOf + "T00:00:00");
  const end = new Date(date);
  end.setDate(end.getDate() + 4);

  const startStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

export default function WeekSelector({ weekOf, onPrev, onNext }: Props) {
  const isCurrentWeek = (() => {
    const today = new Date();
    const dow = today.getDay();
    const mondayOffset = (dow + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    return weekOf === monday.toISOString().slice(0, 10);
  })();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
        aria-label="Previous week"
      >
        &#8249;
      </button>
      <span className="text-sm font-medium text-neutral-700 min-w-[180px] text-center">
        {formatWeekLabel(weekOf)}
      </span>
      <button
        onClick={onNext}
        disabled={isCurrentWeek}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-neutral-200"
        aria-label="Next week"
      >
        &#8250;
      </button>
    </div>
  );
}

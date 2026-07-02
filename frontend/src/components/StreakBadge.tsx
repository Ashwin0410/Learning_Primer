interface Props {
  days: number;
  earned: boolean;
  size?: "lg" | "sm";
}

/** A flame medallion for a streak milestone. Locked (grey) until earned. */
export default function StreakBadge({ days, earned, size = "sm" }: Props) {
  const lg = size === "lg";
  const ring = lg ? "h-24 w-24" : "h-16 w-16";
  const flame = lg ? "text-2xl" : "text-lg";
  const num = lg ? "text-2xl" : "text-lg";

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`relative ${lg ? "animate-fade-up" : ""}`}>
        {lg && earned && <div className="absolute -inset-3 rounded-full bg-orange-300/40 blur-xl" aria-hidden />}
        <div
          className={`relative grid ${ring} place-items-center rounded-full shadow-soft ${
            earned
              ? "bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500"
              : "bg-slate-200"
          }`}
        >
          <div
            className={`grid ${lg ? "h-[4.75rem] w-[4.75rem]" : "h-[3.15rem] w-[3.15rem]"} place-items-center rounded-full ${
              earned ? "bg-white" : "bg-slate-100"
            }`}
          >
            <div className="flex flex-col items-center leading-none">
              <span className={`${flame} ${earned ? "" : "opacity-30 grayscale"}`}>🔥</span>
              <span className={`${num} font-extrabold ${earned ? "text-orange-600" : "text-slate-400"}`}>
                {days}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-1.5 font-semibold ${lg ? "text-sm" : "text-[11px]"} ${earned ? "text-ink" : "text-slate-400"}`}>
        {days}-day streak
      </div>
    </div>
  );
}

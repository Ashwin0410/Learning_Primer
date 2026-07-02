interface Props {
  icon: string;
  title: string;
  date?: string;
  size?: "lg" | "sm";
}

/** A gold achievement medallion holding the topic's emoji. */
export default function Badge({ icon, title, date, size = "lg" }: Props) {
  const lg = size === "lg";
  const ring = lg ? "h-28 w-28" : "h-16 w-16";
  const inner = lg ? "h-[5.5rem] w-[5.5rem]" : "h-12 w-12";
  const emoji = lg ? "text-4xl" : "text-2xl";

  return (
    <div className={lg ? "flex flex-col items-center text-center" : "flex flex-col items-center text-center"}>
      <div className={`relative ${lg ? "animate-fade-up" : ""}`}>
        {lg && (
          <div className="absolute -inset-3 rounded-full bg-amber-300/40 blur-xl" aria-hidden />
        )}
        <div
          className={`relative grid ${ring} place-items-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 shadow-lift`}
        >
          <div className={`grid ${inner} place-items-center rounded-full bg-white`}>
            <span className={emoji}>{icon}</span>
          </div>
          <span
            className={`absolute ${lg ? "-bottom-1 -right-1 h-8 w-8 text-base" : "-bottom-0.5 -right-0.5 h-5 w-5 text-[10px]"} grid place-items-center rounded-full border-2 border-white bg-emerald-500 text-white shadow`}
          >
            ✓
          </span>
        </div>
      </div>
      <div className={lg ? "mt-4" : "mt-2"}>
        <div className={`font-bold text-ink ${lg ? "text-lg" : "text-xs"}`}>{title}</div>
        <div className={`font-medium text-amber-600 ${lg ? "text-sm" : "text-[10px]"}`}>
          {lg ? "Badge earned" : "Mastered"}
          {date ? ` · ${date}` : ""}
        </div>
      </div>
    </div>
  );
}

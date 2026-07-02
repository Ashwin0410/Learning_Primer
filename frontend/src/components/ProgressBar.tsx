import { useEffect, useState } from "react";

/** A progress bar that animates its fill from 0 on mount and on value change. */
export default function ProgressBar({
  pct,
  fill = "bg-gradient-to-r from-indigo-500 to-violet-500",
  height = "h-2",
}: {
  pct: number;
  fill?: string;
  height?: string;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0, Math.min(100, pct))), 60);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-200/80 ${height}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${fill}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

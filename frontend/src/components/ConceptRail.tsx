import type { TopicDetail } from "../lib/types";
import ProgressBar from "./ProgressBar";

const SECTIONS = [
  { id: "concepts", label: "Concepts" },
  { id: "practice", label: "Practice" },
  { id: "project", label: "Project" },
  { id: "complete", label: "Done" },
];

interface Props {
  topic: TopicDetail;
  completed: string[];
  section: string;
  status: string;
  problemsDone: number;
  problemsTarget: number;
  projectsDone: number;
  projectsTarget: number;
}

function MiniMeter({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>
          {done} / {total}
        </span>
      </div>
      <ProgressBar pct={pct} height="h-1.5" fill={color} />
    </div>
  );
}

export default function ConceptRail({
  topic,
  completed,
  section,
  status,
  problemsDone,
  problemsTarget,
  projectsDone,
  projectsTarget,
}: Props) {
  const doneSet = new Set(completed.map((c) => c.trim().toLowerCase()));
  const total = topic.concepts.length;
  const doneCount = topic.concepts.filter((c) => doneSet.has(c.trim().toLowerCase())).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const firstUndone = topic.concepts.findIndex((c) => !doneSet.has(c.trim().toLowerCase()));
  const activeSectionIndex = SECTIONS.findIndex((s) => s.id === section);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/70 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{topic.icon}</span>
          <div>
            <div className="text-sm font-bold text-ink">{topic.title}</div>
            <div className="text-xs text-slate-400">{topic.phase_title}</div>
          </div>
        </div>

        {/* progress meters */}
        <div className="mt-4 space-y-2.5">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Concepts</span>
              <span>
                {doneCount} / {total}
              </span>
            </div>
            <ProgressBar pct={pct} height="h-2" />
          </div>
          <MiniMeter label="Problems" done={problemsDone} total={problemsTarget} color="bg-sky-500" />
          <MiniMeter label="Projects" done={projectsDone} total={projectsTarget} color="bg-amber-500" />
        </div>

        {/* section stepper */}
        <div className="mt-4 flex items-center gap-1">
          {SECTIONS.map((s, i) => {
            const active = i === activeSectionIndex;
            const past = i < activeSectionIndex || status === "complete";
            return (
              <div
                key={s.id}
                className={`flex-1 rounded-md py-1 text-center text-[10px] font-semibold uppercase tracking-wide transition ${
                  active
                    ? "bg-indigo-100 text-indigo-700"
                    : past
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* concept list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <ol className="space-y-0.5">
          {topic.concepts.map((concept, i) => {
            const done = doneSet.has(concept.trim().toLowerCase());
            const current = section === "concepts" && i === firstUndone;
            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition ${
                  current ? "bg-indigo-50" : ""
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    done
                      ? "bg-emerald-500 text-white"
                      : current
                      ? "border-2 border-indigo-500 text-indigo-500"
                      : "border-2 border-slate-300 text-transparent"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span
                  className={
                    done
                      ? "text-slate-400 line-through decoration-slate-300"
                      : current
                      ? "font-semibold text-indigo-700"
                      : "text-slate-600"
                  }
                >
                  {concept}
                </span>
              </li>
            );
          })}
        </ol>

        {/* project */}
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white/60 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <span>🏆</span> Final Project
          </div>
          <p className="text-[13px] leading-snug text-slate-600">{topic.project}</p>
        </div>
      </div>
    </div>
  );
}

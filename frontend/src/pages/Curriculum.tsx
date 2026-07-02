import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { createSession, getCurriculum, getTopic } from "../lib/api";
import type { Curriculum as CurriculumType, Phase, TopicDetail, TopicSummary } from "../lib/types";

export default function Curriculum() {
  const [data, setData] = useState<CurriculumType | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getCurriculum().then(setData);
  }, []);

  return (
    <div className="deco min-h-full">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-extrabold text-ink">The Roadmap</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Nine phases, {data?.total_topics ?? "50+"} topics — a complete path from "what is a
            computer?" to shipping AI apps in the cloud. Start anywhere you're curious. Each topic is a
            self-contained 4–5 hour session.
          </p>
        </div>

        <div className="mt-8 space-y-12">
          {data?.phases.map((phase, idx) => (
            <PhaseBlock key={phase.id} phase={phase} index={idx} onPick={setSelected} />
          ))}
        </div>
      </main>

      {selected && <TopicModal topicId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PhaseBlock({ phase, index, onPick }: { phase: Phase; index: number; onPick: (id: string) => void }) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <div
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-soft"
          style={{ background: phase.accent }}
        >
          {index + 1}
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">{phase.title}</h2>
          <p className="text-sm text-slate-500">{phase.subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {phase.topics.map((t, i) => (
          <TopicCard key={t.id} topic={t} accent={phase.accent} delay={i * 35} onClick={() => onPick(t.id)} />
        ))}
      </div>
    </section>
  );
}

function TopicCard({
  topic,
  accent,
  delay,
  onClick,
}: {
  topic: TopicSummary;
  accent: string;
  delay: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
      className="group animate-fade-up relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pt-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-xl transition group-hover:scale-105"
          style={{ background: `${accent}18` }}
        >
          {topic.icon}
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink group-hover:text-indigo-700">{topic.title}</div>
          <div className="text-xs text-slate-400">
            {topic.concept_count} concepts · {topic.hours}h
          </div>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-slate-500">{topic.blurb}</p>
    </button>
  );
}

function TopicModal({ topicId, onClose }: { topicId: string; onClose: () => void }) {
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getTopic(topicId).then(setTopic);
  }, [topicId]);

  const begin = async () => {
    setStarting(true);
    try {
      const session = await createSession(topicId);
      navigate(`/learn/${session.id}`);
    } catch {
      setStarting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-2xl bg-white shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        {!topic ? (
          <div className="grid h-48 place-items-center text-slate-400">Loading…</div>
        ) : (
          <>
            <div
              className="flex items-start gap-3 rounded-t-2xl p-5"
              style={{ background: `${topic.phase_accent}12` }}
            >
              <span className="text-3xl">{topic.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: topic.phase_accent }}>
                  {topic.phase_title}
                </div>
                <h3 className="text-xl font-bold text-ink">{topic.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{topic.blurb}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4 flex gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  ⏱ {topic.hours} hours
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  📚 {topic.concepts.length} concepts
                </span>
                {topic.tool && (
                  <span className="truncate rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                    🛠 {topic.tool.split(" (")[0]}
                  </span>
                )}
              </div>

              <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  🏆 You'll build
                </div>
                <p className="text-sm text-slate-700">{topic.project}</p>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">What you'll learn</div>
              <ol className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[13px] text-slate-600 sm:grid-cols-2">
                {topic.concepts.map((c, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-slate-300">{i + 1}.</span>
                    <span className="leading-snug">{c}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white p-4">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Not yet
              </button>
              <button
                onClick={begin}
                disabled={starting}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                {starting ? "Starting…" : `Begin ${topic.title} →`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

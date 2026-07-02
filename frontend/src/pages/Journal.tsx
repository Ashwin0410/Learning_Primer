import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { getJournal, saveJournalNote } from "../lib/api";
import type { JournalEntry } from "../lib/types";

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);

  useEffect(() => {
    getJournal().then(setEntries);
  }, []);

  return (
    <div className="deco min-h-full">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-extrabold text-ink">Your journal 📔</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            A diary of your journey. Each day fills in with what you learned — add your own thoughts too.
          </p>
        </div>

        {entries === null ? (
          <div className="mt-8 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-2xl shimmer" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <div className="text-3xl">🌱</div>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Your journal is empty — for now. Learn something today and this page will start writing
              itself.
            </p>
            <Link
              to="/curriculum"
              className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Start a topic
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {entries.map((e, i) => (
              <JournalDay key={e.date} entry={e} delay={i * 60} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatChip({ icon, n, label }: { icon: string; n: number; label: string }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      <span>{icon}</span>
      {n} {label}
      {n === 1 ? "" : "s"}
    </span>
  );
}

function JournalDay({ entry, delay }: { entry: JournalEntry; delay: number }) {
  const [note, setNote] = useState(entry.note);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasProgress = entry.concepts + entry.problems + entry.projects + entry.topics_completed > 0;

  const save = async () => {
    if (note === entry.note) return;
    setSaving(true);
    try {
      await saveJournalNote(entry.date, note);
      entry.note = note;
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">{entry.pretty_date}</h2>
        {entry.topics_completed > 0 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
            🎉 Topic completed
          </span>
        )}
      </div>

      {/* auto-generated summary */}
      <div className="mt-2 text-sm text-slate-600">
        {entry.topics.length > 0 ? (
          <p>
            You explored{" "}
            {entry.topics.map((t, i) => (
              <span key={t}>
                <b className="text-ink">{t}</b>
                {i < entry.topics.length - 2 ? ", " : i === entry.topics.length - 2 ? " and " : ""}
              </span>
            ))}
            .
          </p>
        ) : (
          <p>You showed up and kept learning. 🌱</p>
        )}
      </div>

      {(hasProgress || entry.chat_turns > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          <StatChip icon="✅" n={entry.concepts} label="concept" />
          <StatChip icon="💪" n={entry.problems} label="problem" />
          <StatChip icon="🏆" n={entry.projects} label="project" />
          {!hasProgress && entry.chat_turns > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              💬 {entry.chat_turns} lesson{entry.chat_turns === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      {/* her note */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Your thoughts</label>
          <span className="text-[11px] font-medium text-emerald-500">
            {saving ? "Saving…" : saved ? "Saved ✓" : ""}
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={save}
          rows={2}
          placeholder="How did today feel? What clicked? What was tricky?"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
      </div>
    </div>
  );
}

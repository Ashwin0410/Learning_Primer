import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Badge from "../components/Badge";
import StreakBadge from "../components/StreakBadge";
import ProgressBar from "../components/ProgressBar";
import { deleteSession, getCurriculum, getStreak, listSessions } from "../lib/api";
import type { Curriculum, SessionSummary, Streak } from "../lib/types";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { learnerName } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([listSessions(), getCurriculum(), getStreak()])
      .then(([s, c, st]) => {
        setSessions(s);
        setCurriculum(c);
        setStreak(st);
      })
      .finally(() => setLoading(false));
  }, []);

  const active = sessions.filter((s) => s.status === "active");
  const completed = sessions.filter((s) => s.status === "complete");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const remove = async (idToRemove: number) => {
    await deleteSession(idToRemove);
    setSessions((prev) => prev.filter((s) => s.id !== idToRemove));
    setRemovingId(null);
  };

  return (
    <div className="deco min-h-full">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* hero */}
        <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-600 p-8 text-white shadow-lift">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-100">
                {greeting}, {learnerName} 👋
              </p>
              <h1 className="mt-1 max-w-xl text-2xl font-extrabold leading-tight sm:text-3xl">
                Let's learn something today.
              </h1>
              <p className="mt-2 max-w-xl text-sm text-indigo-100">
                Pick any topic and Primer teaches you from absolute zero — the concepts, 50 practice
                problems, and 4–5 real projects you'll be proud to put on GitHub.
              </p>
            </div>
            {streak && streak.current > 0 && (
              <div className="flex flex-shrink-0 flex-col items-center rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-inset ring-white/25 backdrop-blur">
                <span className="text-2xl">🔥</span>
                <span className="text-2xl font-extrabold leading-none">{streak.current}</span>
                <span className="mt-0.5 text-[11px] font-medium text-indigo-100">day streak</span>
              </div>
            )}
          </div>
          <div className="relative mt-5 flex flex-wrap gap-3">
            <Link
              to="/curriculum"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Explore the roadmap →
            </Link>
            {active[0] && (
              <button
                onClick={() => navigate(`/learn/${active[0].id}`)}
                className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/25"
              >
                Resume {active[0].topic_title}
              </button>
            )}
          </div>
        </section>

        {/* stats */}
        {curriculum && (
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Topics to explore" value={curriculum.total_topics} />
            <Stat label="In progress" value={active.length} accent="text-indigo-600" />
            <Stat label="Badges earned" value={completed.length} accent="text-amber-600" />
            <Stat label="Current streak" value={streak?.current ?? 0} accent="text-orange-600" suffix="🔥" />
          </section>
        )}

        {/* achievements */}
        {streak && streak.total > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink">Achievements 🏅</h2>
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Streak milestones</span>
                  <span className="text-xs text-slate-500">Longest: {streak.longest} days</span>
                </div>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                  {streak.badges.map((b) => (
                    <StreakBadge key={b.days} days={b.days} earned={b.earned} size="sm" />
                  ))}
                </div>
              </div>

              {completed.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                  <div className="mb-3 text-sm font-semibold text-ink">Topics mastered</div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {completed.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/learn/${s.id}`)}
                        className="rounded-xl p-2 transition hover:-translate-y-0.5 hover:bg-white"
                        title={`Review ${s.topic_title}`}
                      >
                        <Badge
                          icon={s.topic_icon}
                          title={s.topic_title}
                          date={new Date(s.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                          size="sm"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* continue learning */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink">Continue learning</h2>
          {loading ? (
            <SkeletonRow />
          ) : active.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
              <p className="text-sm text-slate-500">
                {completed.length > 0
                  ? "Nothing in progress right now — ready for the next topic?"
                  : "You haven't started a topic yet. The roadmap is waiting — start wherever you're curious."}
              </p>
              <Link
                to="/curriculum"
                className="mt-3 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {completed.length > 0 ? "Choose the next topic" : "Choose your first topic"}
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {active.map((s, i) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  delay={i * 60}
                  confirming={removingId === s.id}
                  onOpen={() => navigate(`/learn/${s.id}`)}
                  onRemoveRequest={() => setRemovingId(s.id)}
                  onRemoveCancel={() => setRemovingId(null)}
                  onRemoveConfirm={() => remove(s.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "text-ink",
  suffix,
}: {
  label: string;
  value: number;
  accent?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className={`text-2xl font-extrabold ${accent}`}>
        {value}
        {suffix && value > 0 ? <span className="ml-1 text-lg">{suffix}</span> : ""}
      </div>
      <div className="mt-0.5 text-xs font-medium text-slate-400">{label}</div>
    </div>
  );
}

function SessionCard({
  session,
  delay,
  confirming,
  onOpen,
  onRemoveRequest,
  onRemoveCancel,
  onRemoveConfirm,
}: {
  session: SessionSummary;
  delay: number;
  confirming: boolean;
  onOpen: () => void;
  onRemoveRequest: () => void;
  onRemoveCancel: () => void;
  onRemoveConfirm: () => void;
}) {
  const pct = session.concept_total
    ? Math.round((session.completed_concepts.length / session.concept_total) * 100)
    : 0;

  return (
    <div
      className="group animate-fade-up relative rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lift"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {confirming ? (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/95 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">Remove {session.topic_title}?</p>
            <p className="mt-0.5 text-xs text-slate-400">This deletes this topic's progress.</p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={onRemoveCancel}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={onRemoveConfirm}
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onRemoveRequest}
          title="Remove this topic"
          className="absolute right-2.5 top-2.5 z-10 hidden h-6 w-6 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 group-hover:grid"
        >
          ✕
        </button>
      )}

      <button onClick={onOpen} className="flex w-full flex-col text-left">
        <div className="flex items-center gap-2 pr-6">
          <span className="text-lg">{session.topic_icon}</span>
          <span className="font-semibold text-ink group-hover:text-indigo-700">{session.topic_title}</span>
          <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-indigo-600">
            {session.section}
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar pct={pct} height="h-1.5" />
        </div>
        <div className="mt-1.5 flex gap-3 text-xs text-slate-400">
          <span>
            {session.completed_concepts.length}/{session.concept_total} concepts
          </span>
          <span>
            {session.problems_done}/{session.problems_target} problems
          </span>
          <span>
            {session.projects_done}/{session.projects_target} projects
          </span>
        </div>
      </button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="h-24 rounded-2xl shimmer" />
      ))}
    </div>
  );
}

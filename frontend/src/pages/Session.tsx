import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "../components/Markdown";
import ConceptRail from "../components/ConceptRail";
import Badge from "../components/Badge";
import Confetti from "../components/Confetti";
import { getSession, getTopic, resetSession, streamChat } from "../lib/api";
import type { ChatMessage, TopicDetail } from "../lib/types";
import { useAuth } from "../context/AuthContext";

export default function Session() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const { learnerName } = useAuth();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [section, setSection] = useState("concepts");
  const [completed, setCompleted] = useState<string[]>([]);
  const [status, setStatus] = useState("active");
  const [problemsDone, setProblemsDone] = useState(0);
  const [projectsDone, setProjectsDone] = useState(0);
  const [problemsTarget, setProblemsTarget] = useState(50);
  const [projectsTarget, setProjectsTarget] = useState(5);

  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRail, setShowRail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakToast, setStreakToast] = useState<number | null>(null);

  const tempId = useRef(-1);
  const kickedOff = useRef(false);
  const celebrated = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession(id);
        if (cancelled) return;
        setMessages(s.messages);
        setSection(s.section);
        setCompleted(s.completed_concepts);
        setStatus(s.status);
        setProblemsDone(s.problems_done);
        setProjectsDone(s.projects_done);
        setProblemsTarget(s.problems_target);
        setProjectsTarget(s.projects_target);
        if (s.status === "complete") celebrated.current = true; // don't re-celebrate on reopen
        const t = await getTopic(s.topic_id);
        if (cancelled) return;
        setTopic(t);
        setLoading(false);
        if (s.messages.length === 0 && !kickedOff.current) {
          kickedOff.current = true;
          void send("");
        }
      } catch {
        setError("Couldn't load this session.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  async function send(text: string) {
    if (isStreaming) return;
    setError(null);
    const trimmed = text.trim();
    if (trimmed) {
      setMessages((m) => [
        ...m,
        { id: tempId.current--, role: "user", content: trimmed, created_at: new Date().toISOString() },
      ]);
    }
    setInput("");
    setIsStreaming(true);
    setStreamingText("");
    let acc = "";
    await streamChat(id, trimmed, {
      onDelta: (t) => {
        acc += t;
        setStreamingText(acc);
      },
      onDone: (evt) => {
        setMessages((m) => [
          ...m,
          {
            id: evt.message_id ?? tempId.current--,
            role: "assistant",
            content: acc,
            created_at: new Date().toISOString(),
          },
        ]);
        setStreamingText(null);
        setIsStreaming(false);
        if (evt.section) setSection(evt.section);
        setCompleted(evt.completed_concepts);
        setProblemsDone(evt.problems_done);
        setProjectsDone(evt.projects_done);
        setStatus(evt.status);
        if (evt.status === "complete" && !celebrated.current) {
          celebrated.current = true;
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
        if (evt.streak_milestone) {
          setStreakToast(evt.streak_milestone);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          setTimeout(() => setStreakToast(null), 5200);
        }
      },
      onError: (msg) => {
        setStreamingText(null);
        setIsStreaming(false);
        setError(msg);
      },
    });
  }

  async function doReset() {
    setConfirmReset(false);
    if (isStreaming) return;
    try {
      await resetSession(id);
      setMessages([]);
      setSection("concepts");
      setCompleted([]);
      setStatus("active");
      setProblemsDone(0);
      setProjectsDone(0);
      setError(null);
      setShowConfetti(false);
      celebrated.current = false;
      kickedOff.current = true;
      void send(""); // restart from Part 1
    } catch {
      setError("Couldn't reset this topic. Please try again.");
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) void send(input);
    }
  };

  const quickActions =
    status === "complete"
      ? []
      : section === "practice"
      ? ["Continue to the next problem →", "I'm stuck — give me a hint", "Check my answer"]
      : section === "project"
      ? ["Continue to the next step →", "I got an error — help", "Explain that part again"]
      : ["Continue →", "Explain that again, simpler", "Give me a quick exercise"];

  const railProps = {
    completed,
    section,
    status,
    problemsDone,
    problemsTarget,
    projectsDone,
    projectsTarget,
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      {showConfetti && <Confetti />}

      {streakToast !== null && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-toast">
          <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 shadow-lift">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold text-ink">{streakToast}-day streak!</span>
            <span className="text-sm text-slate-400">Keep it going</span>
          </div>
        </div>
      )}

      {/* top bar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-ink"
        >
          ← <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          {topic && <span>{topic.icon}</span>}
          <span className="max-w-[40vw] truncate">{topic?.title ?? "Loading…"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setConfirmReset(true)}
            title="Start this topic over from the beginning"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-ink"
          >
            ↺ <span className="hidden sm:inline">Start over</span>
          </button>
          <button
            onClick={() => setShowRail(true)}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 lg:hidden"
          >
            Progress
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* chat column */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-6">
              {loading ? (
                <div className="grid h-64 place-items-center text-slate-400">Loading your lesson…</div>
              ) : (
                <div className="space-y-5">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} message={m} topicIcon={topic?.icon} />
                  ))}
                  {streamingText !== null && (
                    <MessageBubble
                      message={{ id: -999, role: "assistant", content: streamingText, created_at: "" }}
                      topicIcon={topic?.icon}
                      streaming={streamingText === ""}
                    />
                  )}
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {error}{" "}
                      <button onClick={() => send("Please continue.")} className="font-semibold underline">
                        Retry
                      </button>
                    </div>
                  )}
                  {status === "complete" && topic && (
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 text-center shadow-soft">
                      <Badge icon={topic.icon} title={topic.title} size="lg" />
                      <p className="mx-auto mt-4 max-w-sm text-sm text-slate-600">
                        You understood it, worked through the problems, and built real projects.
                        That's a genuine achievement, {learnerName}. 🎉
                      </p>
                      <Link
                        to="/"
                        className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
                      >
                        Back to dashboard →
                      </Link>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>
          </div>

          {/* composer */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
            <div className="mx-auto max-w-3xl">
              {quickActions.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {quickActions.map((q) => (
                    <button
                      key={q}
                      disabled={isStreaming}
                      onClick={() => send(q)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  disabled={isStreaming}
                  placeholder={isStreaming ? "Primer is teaching…" : "Ask a question, or type your answer…"}
                  className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  onClick={() => input.trim() && send(input)}
                  disabled={isStreaming || !input.trim()}
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* progress rail (desktop) */}
        {topic && (
          <aside className="hidden w-80 flex-shrink-0 border-l border-slate-200 bg-white/60 lg:block">
            <ConceptRail topic={topic} {...railProps} />
          </aside>
        )}
      </div>

      {/* progress rail (mobile drawer) */}
      {showRail && topic && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowRail(false)}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <span className="text-sm font-bold text-ink">Your progress</span>
              <button onClick={() => setShowRail(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="h-[calc(100%-45px)]">
              <ConceptRail topic={topic} {...railProps} />
            </div>
          </div>
        </div>
      )}

      {/* reset confirmation */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
          <div className="w-full max-w-sm animate-fade-up rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="text-2xl">↺</div>
            <h3 className="mt-2 text-lg font-bold text-ink">Start this topic over?</h3>
            <p className="mt-1.5 text-sm text-slate-500">
              This clears the current lesson and all progress for <b>{topic?.title}</b>, and begins
              again from the very start. There's no undo.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={doReset}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
              >
                Yes, start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  topicIcon,
  streaming,
}: {
  message: ChatMessage;
  topicIcon?: string;
  streaming?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm text-white shadow-soft">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base shadow-soft">
        {topicIcon ?? "🌱"}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-soft">
        {streaming ? (
          <div className="flex items-center gap-1 py-2 text-slate-400">
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" />
          </div>
        ) : (
          <Markdown content={message.content} />
        )}
      </div>
    </div>
  );
}

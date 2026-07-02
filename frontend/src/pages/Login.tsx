import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, learner_name } = await login(passcode);
      signIn(token, learner_name);
      navigate("/");
    } catch {
      setError("Hmm, that passcode didn't work. Try again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden bg-gradient-to-br from-indigo-50 via-cream to-violet-50 px-5 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl shadow-lift">
            🌱
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Your personal journey from absolute zero to Full-Stack AI Engineer.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
        >
          <label className="block text-sm font-semibold text-ink">Passcode</label>
          <input
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter your passcode"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
          {error && <p className="mt-3 text-sm font-medium text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Opening your journey…" : "Start learning →"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Built with 💜 so you can learn everything, one confident step at a time.
        </p>
      </div>
    </div>
  );
}

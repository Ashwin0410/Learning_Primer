import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-soft">
            🌱
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-ink">Primer</div>
            <div className="text-[11px] font-medium text-slate-400">Learning Journey</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            to="/"
            className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-white hover:text-ink"
          >
            Home
          </Link>
          <Link
            to="/curriculum"
            className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-white hover:text-ink"
          >
            Roadmap
          </Link>
          <Link
            to="/journal"
            className="rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-white hover:text-ink"
          >
            Journal
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate("/login");
            }}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-400 transition hover:bg-white hover:text-slate-600"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

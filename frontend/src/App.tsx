import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Curriculum from "./pages/Curriculum";
import Journal from "./pages/Journal";
import Session from "./pages/Session";

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/curriculum"
        element={
          <Protected>
            <Curriculum />
          </Protected>
        }
      />
      <Route
        path="/journal"
        element={
          <Protected>
            <Journal />
          </Protected>
        }
      />
      <Route
        path="/learn/:sessionId"
        element={
          <Protected>
            <Session />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

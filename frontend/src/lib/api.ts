import type {
  Curriculum,
  DoneEvent,
  JournalEntry,
  SessionDetail,
  SessionSummary,
  Streak,
  TopicDetail,
} from "./types";

const TOKEN_KEY = "primer_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { ApiError };

export async function login(passcode: string): Promise<{ token: string; learner_name: string }> {
  return request("/login", { method: "POST", body: JSON.stringify({ passcode }) });
}

export async function getHealth(): Promise<{ api_key_configured: boolean; model: string; learner: string }> {
  const res = await fetch("/api/health");
  return res.json();
}

export const getCurriculum = () => request<Curriculum>("/curriculum");
export const getTopic = (id: string) => request<TopicDetail>(`/curriculum/topics/${id}`);

export const getStreak = () => request<Streak>("/streak");
export const getJournal = () => request<JournalEntry[]>("/journal");
export const saveJournalNote = (date: string, note: string) =>
  request<JournalEntry>(`/journal/${date}`, { method: "PUT", body: JSON.stringify({ note }) });

export const listSessions = () => request<SessionSummary[]>("/sessions");
export const createSession = (topicId: string) =>
  request<SessionDetail>("/sessions", { method: "POST", body: JSON.stringify({ topic_id: topicId }) });
export const getSession = (id: number) => request<SessionDetail>(`/sessions/${id}`);
export const resetSession = (id: number) =>
  request<SessionDetail>(`/sessions/${id}/reset`, { method: "POST" });
export const deleteSession = (id: number) => request<{ ok: boolean }>(`/sessions/${id}`, { method: "DELETE" });

export interface StreamHandlers {
  onDelta?: (text: string) => void;
  onDone?: (evt: DoneEvent) => void;
  onError?: (message: string) => void;
}

/** Stream a chat reply from Primer, parsing the SSE event stream. */
export async function streamChat(
  sessionId: number,
  message: string,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ session_id: sessionId, message }),
      signal,
    });
  } catch {
    handlers.onError?.("Couldn't reach the server. Is the backend running?");
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError?.(`Server error (${res.status}). Please try again.`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json);
        if (evt.type === "delta") handlers.onDelta?.(evt.text);
        else if (evt.type === "done") handlers.onDone?.(evt as DoneEvent);
        else if (evt.type === "error") handlers.onError?.(evt.message);
      } catch {
        /* ignore malformed event */
      }
    }
  }
}

export interface TopicSummary {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  hours: string;
  concept_count: number;
}

export interface Phase {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  topics: TopicSummary[];
}

export interface Curriculum {
  learner_name: string;
  total_topics: number;
  phases: Phase[];
}

export interface TopicDetail {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  hours: string;
  tool: string | null;
  concepts: string[];
  project: string;
  phase: string;
  phase_title: string;
  phase_accent: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SessionSummary {
  id: number;
  topic_id: string;
  topic_title: string;
  topic_icon: string;
  section: string;
  status: string;
  completed_concepts: string[];
  concept_total: number;
  problems_done: number;
  problems_target: number;
  projects_done: number;
  projects_target: number;
  created_at: string;
  updated_at: string;
}

export interface SessionDetail extends SessionSummary {
  messages: ChatMessage[];
}

export interface DoneEvent {
  type: "done";
  section: string | null;
  completed_concepts: string[];
  problems_done: number;
  projects_done: number;
  status: string;
  streak_milestone: number | null;
  message_id: number | null;
}

export interface StreakBadge {
  days: number;
  earned: boolean;
}

export interface Streak {
  current: number;
  longest: number;
  total: number;
  today_active: boolean;
  badges: StreakBadge[];
}

export interface JournalEntry {
  date: string;
  pretty_date: string;
  chat_turns: number;
  topics: string[];
  concepts: number;
  problems: number;
  projects: number;
  topics_completed: number;
  note: string;
}

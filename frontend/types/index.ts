// All TypeScript interfaces matching backend Pydantic schemas exactly

export interface Participant {
  id: number;
  meeting_id: number;
  name: string;
  email: string | null;
}

export interface TranscriptLine {
  id: number;
  meeting_id: number;
  speaker: string;
  start_sec: number;
  end_sec: number | null;
  text: string;
  order_index: number;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview_text: string;
  generated_at: string | null;
}

export interface Topic {
  id: number;
  meeting_id: number;
  title: string;
  start_sec: number;
  order_index: number;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  assignee: string | null;
  completed: boolean;
  created_at: string;
}

export interface MeetingListItem {
  id: number;
  title: string;
  date: string;
  duration_sec: number;
  status: string;
  audio_url: string | null;
  created_at: string;
  participants: Participant[];
}

export interface MeetingDetail {
  id: number;
  title: string;
  date: string;
  duration_sec: number;
  audio_url: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  participants: Participant[];
  transcript_lines: TranscriptLine[];
  summary: Summary | null;
  topics: Topic[];
  action_items: ActionItem[];
}

export interface ActionItemCreate {
  text: string;
  assignee?: string;
}

export interface ActionItemUpdate {
  text?: string;
  assignee?: string;
  completed?: boolean;
}

export interface MeetingChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MeetingChatRequest {
  question: string;
  history?: MeetingChatMessage[];
}

export interface MeetingChatResponse {
  answer: string;
}

export interface MeetingUpdate {
  title?: string;
  date?: string;
  participants?: string[];
}

export type SortOrder = 'recent' | 'oldest';

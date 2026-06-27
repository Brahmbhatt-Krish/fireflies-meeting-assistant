import {
  MeetingListItem,
  MeetingDetail,
  MeetingUpdate,
  ActionItem,
  ActionItemCreate,
  ActionItemUpdate,
  MeetingChatMessage,
  MeetingChatResponse,
  SortOrder,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export interface ListParams {
  search?: string;
  participant?: string;
  date_from?: string;
  date_to?: string;
  sort?: SortOrder;
}

export function getMeetings(params: ListParams = {}): Promise<MeetingListItem[]> {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.participant) q.set('participant', params.participant);
  if (params.date_from) q.set('date_from', params.date_from);
  if (params.date_to) q.set('date_to', params.date_to);
  if (params.sort) q.set('sort', params.sort);
  const qs = q.toString() ? `?${q}` : '';
  return request<MeetingListItem[]>(`/api/meetings${qs}`);
}

export function getMeeting(id: number): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/api/meetings/${id}`);
}

export async function createMeeting(formData: FormData): Promise<MeetingDetail> {
  const res = await fetch(`${BASE}/api/meetings`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export function updateMeeting(id: number, body: MeetingUpdate): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/api/meetings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteMeeting(id: number): Promise<void> {
  return request<void>(`/api/meetings/${id}`, { method: 'DELETE' });
}

export function regenerateAI(id: number): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/api/meetings/${id}/generate`, { method: 'POST' });
}

// ─── Action Items ─────────────────────────────────────────────────────────────

export function getActionItems(meetingId: number): Promise<ActionItem[]> {
  return request<ActionItem[]>(`/api/meetings/${meetingId}/action-items`);
}

export function createActionItem(meetingId: number, body: ActionItemCreate): Promise<ActionItem> {
  return request<ActionItem>(`/api/meetings/${meetingId}/action-items`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateActionItem(id: number, body: ActionItemUpdate): Promise<ActionItem> {
  return request<ActionItem>(`/api/action-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteActionItem(id: number): Promise<void> {
  return request<void>(`/api/action-items/${id}`, { method: 'DELETE' });
}

export function chatWithMeeting(
  meetingId: number,
  question: string,
  history: MeetingChatMessage[]
): Promise<MeetingChatResponse> {
  return request<MeetingChatResponse>(`/api/meetings/${meetingId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ question, history }),
  });
}

export async function exportMeetingSummaryPdf(meetingId: number): Promise<Blob> {
  const res = await fetch(`${BASE}/api/meetings/${meetingId}/export-summary.pdf`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.blob();
}

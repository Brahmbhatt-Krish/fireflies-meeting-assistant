from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ---------- Participant ----------
class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None


class ParticipantResponse(ParticipantBase):
    id: int
    meeting_id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- TranscriptLine ----------
class TranscriptLineResponse(BaseModel):
    id: int
    meeting_id: int
    speaker: str
    start_sec: float
    end_sec: Optional[float]
    text: str
    order_index: int
    model_config = ConfigDict(from_attributes=True)


# ---------- Summary ----------
class SummaryResponse(BaseModel):
    id: int
    meeting_id: int
    overview_text: str
    generated_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)


# ---------- Topic ----------
class TopicResponse(BaseModel):
    id: int
    meeting_id: int
    title: str
    start_sec: float
    order_index: int
    model_config = ConfigDict(from_attributes=True)


# ---------- ActionItem ----------
class ActionItemResponse(BaseModel):
    id: int
    meeting_id: int
    text: str
    assignee: Optional[str]
    completed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ActionItemCreate(BaseModel):
    text: str
    assignee: Optional[str] = None


class ActionItemUpdate(BaseModel):
    text: Optional[str] = None
    assignee: Optional[str] = None
    completed: Optional[bool] = None


# ---------- Meeting Chat ----------
class MeetingChatMessage(BaseModel):
    role: str
    content: str


class MeetingChatRequest(BaseModel):
    question: str
    history: list[MeetingChatMessage] = []


class MeetingChatResponse(BaseModel):
    answer: str


# ---------- Meeting List ----------
class MeetingListItem(BaseModel):
    id: int
    title: str
    date: datetime
    duration_sec: int
    status: str
    audio_url: Optional[str]
    created_at: datetime
    participants: list[ParticipantResponse]
    model_config = ConfigDict(from_attributes=True)


# ---------- Meeting Detail ----------
class MeetingDetail(BaseModel):
    id: int
    title: str
    date: datetime
    duration_sec: int
    audio_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    participants: list[ParticipantResponse]
    transcript_lines: list[TranscriptLineResponse]
    summary: Optional[SummaryResponse]
    topics: list[TopicResponse]
    action_items: list[ActionItemResponse]
    model_config = ConfigDict(from_attributes=True)


# ---------- Meeting Create ----------
class MeetingCreate(BaseModel):
    title: str
    date: Optional[datetime] = None
    participants: list[str] = []
    transcript_text: Optional[str] = None
    generate_ai: bool = False


# ---------- Meeting Update ----------
class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    participants: Optional[list[str]] = None

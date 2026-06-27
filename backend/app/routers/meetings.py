from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Meeting, Participant, TranscriptLine, Summary, Topic, ActionItem
from app.schemas.schemas import (
    MeetingCreate, MeetingUpdate, MeetingListItem, MeetingDetail,
    ActionItemCreate, ActionItemResponse, MeetingChatRequest, MeetingChatResponse,
)
from app.services.transcript_parser import parse_transcript
from app.services.ai_generator import generate_ai_content, answer_meeting_question, ChatMessage
from app.services.pdf_export import build_summary_pdf
from app.config import settings

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _run_ai(meeting: Meeting, db: Session):
    """Generate AI content for a meeting and persist it."""
    lines = meeting.transcript_lines
    transcript_text = "\n".join(f"{l.speaker}: {l.text}" for l in lines)
    transcript_dicts = [{"speaker": l.speaker, "start_sec": l.start_sec, "text": l.text} for l in lines]
    participant_names = [p.name for p in meeting.participants]

    result = generate_ai_content(
        title=meeting.title,
        duration_sec=meeting.duration_sec,
        participants=participant_names,
        transcript_text=transcript_text,
        transcript_lines=transcript_dicts,
        api_key=settings.GEMINI_API_KEY,
    )

    # Upsert summary
    if meeting.summary:
        meeting.summary.overview_text = result.summary
        meeting.summary.generated_at = datetime.utcnow()
    else:
        db.add(Summary(meeting_id=meeting.id, overview_text=result.summary, generated_at=datetime.utcnow()))

    # Replace topics
    for t in meeting.topics:
        db.delete(t)
    db.flush()
    for i, t in enumerate(result.topics):
        db.add(Topic(meeting_id=meeting.id, title=t.title, start_sec=t.start_sec, order_index=i))

    # Replace action items
    for a in meeting.action_items:
        db.delete(a)
    db.flush()
    for a in result.action_items:
        db.add(ActionItem(meeting_id=meeting.id, text=a.text, assignee=a.assignee))

    meeting.status = "processed"
    db.commit()
    db.refresh(meeting)


# ── GET /api/meetings ──────────────────────────────────────────────────────────

@router.get("", response_model=list[MeetingListItem])
def list_meetings(
    search: Optional[str] = Query(None),
    participant: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort: str = Query("recent"),
    db: Session = Depends(get_db),
):
    q = db.query(Meeting)

    if search:
        like = f"%{search}%"
        q = q.filter(
            Meeting.title.ilike(like)
            | Meeting.participants.any(Participant.name.ilike(like))
        )
    if participant:
        q = q.filter(Meeting.participants.any(Participant.name.ilike(f"%{participant}%")))
    if date_from:
        q = q.filter(Meeting.date >= date_from)
    if date_to:
        q = q.filter(Meeting.date <= date_to)

    if sort == "oldest":
        q = q.order_by(Meeting.date.asc())
    else:
        q = q.order_by(Meeting.date.desc())

    return q.all()


# ── POST /api/meetings ─────────────────────────────────────────────────────────

@router.post("", response_model=MeetingDetail, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    title: str = Form(...),
    date: Optional[str] = Form(None),
    participants: str = Form("[]"),
    transcript_text: Optional[str] = Form(None),
    generate_ai: bool = Form(False),
    transcript_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    import json as _json

    meeting_date = datetime.fromisoformat(date) if date else datetime.utcnow()
    participant_names: list[str] = _json.loads(participants) if participants else []

    # Determine transcript content + format
    content = ""
    fmt = "text"
    if transcript_file:
        content = (await transcript_file.read()).decode("utf-8")
        fname = transcript_file.filename or ""
        if fname.endswith(".vtt"):
            fmt = "vtt"
        elif fname.endswith(".json"):
            fmt = "json"
    elif transcript_text:
        content = transcript_text

    # Parse transcript
    parsed_lines = parse_transcript(content, fmt=fmt) if content else []

    # Calculate duration from last line end_sec or last start_sec
    duration_sec = 0
    if parsed_lines:
        last = parsed_lines[-1]
        duration_sec = int(last.end_sec or last.start_sec) + 1

    meeting = Meeting(
        title=title,
        date=meeting_date,
        duration_sec=duration_sec,
        status="processing" if (generate_ai and content) else "processed",
    )
    db.add(meeting)
    db.flush()

    for name in participant_names:
        db.add(Participant(meeting_id=meeting.id, name=name.strip()))

    for pl in parsed_lines:
        db.add(TranscriptLine(
            meeting_id=meeting.id,
            speaker=pl.speaker,
            start_sec=pl.start_sec,
            end_sec=pl.end_sec,
            text=pl.text,
            order_index=pl.order_index,
        ))

    db.commit()
    db.refresh(meeting)

    if generate_ai and content:
        _run_ai(meeting, db)
        db.refresh(meeting)

    return meeting


# ── GET /api/meetings/{id} ────────────────────────────────────────────────────

@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# ── PATCH /api/meetings/{id} ──────────────────────────────────────────────────

@router.patch("/{meeting_id}", response_model=MeetingDetail)
def update_meeting(meeting_id: int, body: MeetingUpdate, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if body.title is not None:
        meeting.title = body.title
    if body.date is not None:
        meeting.date = body.date
    if body.participants is not None:
        for p in meeting.participants:
            db.delete(p)
        db.flush()
        for name in body.participants:
            db.add(Participant(meeting_id=meeting.id, name=name.strip()))

    meeting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return meeting


# ── DELETE /api/meetings/{id} ─────────────────────────────────────────────────

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()


# ── POST /api/meetings/{id}/generate ─────────────────────────────────────────

@router.post("/{meeting_id}/generate", response_model=MeetingDetail)
def regenerate_ai(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.transcript_lines:
        raise HTTPException(status_code=400, detail="No transcript lines to generate AI from")
    _run_ai(meeting, db)
    db.refresh(meeting)
    return meeting


@router.post("/{meeting_id}/chat", response_model=MeetingChatResponse)
def chat_with_meeting(meeting_id: int, body: MeetingChatRequest, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.transcript_lines:
        raise HTTPException(status_code=400, detail="No transcript available for this meeting")
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    transcript_text = "\n".join(f"{line.speaker}: {line.text}" for line in meeting.transcript_lines)
    participant_names = [participant.name for participant in meeting.participants]
    history = [ChatMessage(role=message.role, content=message.content) for message in body.history]
    summary_text = meeting.summary.overview_text if meeting.summary else ""

    answer = answer_meeting_question(
        title=meeting.title,
        participants=participant_names,
        summary_text=summary_text,
        transcript_text=transcript_text,
        question=body.question.strip(),
        history=history,
        api_key=settings.GEMINI_API_KEY,
    )
    return MeetingChatResponse(answer=answer)


@router.get("/{meeting_id}/export-summary.pdf")
def export_summary_pdf(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    pdf_bytes = build_summary_pdf(
        title=meeting.title,
        meeting_date=meeting.date,
        participants=[participant.name for participant in meeting.participants],
        summary_text=meeting.summary.overview_text if meeting.summary else "",
        topics=[topic.title for topic in meeting.topics],
    )
    safe_title = "".join(ch if ch.isalnum() or ch in ("-", "_") else "-" for ch in meeting.title).strip("-") or "meeting-summary"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}-summary.pdf"'},
    )


# ── GET /api/meetings/{id}/action-items ──────────────────────────────────────

@router.get("/{meeting_id}/action-items", response_model=list[ActionItemResponse])
def list_action_items(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting.action_items


# ── POST /api/meetings/{id}/action-items ─────────────────────────────────────

@router.post("/{meeting_id}/action-items", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
def create_action_item(meeting_id: int, body: ActionItemCreate, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    item = ActionItem(meeting_id=meeting_id, text=body.text, assignee=body.assignee)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

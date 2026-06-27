from datetime import datetime
from sqlalchemy import (
    Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="processed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    participants: Mapped[list["Participant"]] = relationship(
        "Participant", back_populates="meeting", cascade="all, delete-orphan"
    )
    transcript_lines: Mapped[list["TranscriptLine"]] = relationship(
        "TranscriptLine",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptLine.order_index",
    )
    summary: Mapped["Summary | None"] = relationship(
        "Summary", back_populates="meeting", cascade="all, delete-orphan", uselist=False
    )
    topics: Mapped[list["Topic"]] = relationship(
        "Topic",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Topic.order_index",
    )
    action_items: Mapped[list["ActionItem"]] = relationship(
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan"
    )


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="participants")


class TranscriptLine(Base):
    __tablename__ = "transcript_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    speaker: Mapped[str] = mapped_column(String(150), nullable=False)
    start_sec: Mapped[float] = mapped_column(Float, nullable=False)
    end_sec: Mapped[float | None] = mapped_column(Float, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="transcript_lines")


class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = (UniqueConstraint("meeting_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    overview_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="summary")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_sec: Mapped[float] = mapped_column(Float, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="topics")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee: Mapped[str | None] = mapped_column(String(150), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="action_items")

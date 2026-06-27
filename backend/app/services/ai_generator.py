"""
AI Generator — calls Gemini to produce summary, topics, and action items.

Behaviour:
  • If GEMINI_API_KEY is set: calls Gemini LLM with structured JSON output.
    Tries gemini-1.5-flash, gemini-1.5-pro, gemini-pro gracefully.
  • If GEMINI_API_KEY is missing: returns clearly-labeled mock response.
"""
import json
import re
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

MOCK_LABEL = "[AI UNAVAILABLE — MOCK RESPONSE]"


@dataclass
class GeneratedTopic:
    title: str
    start_sec: float


@dataclass
class GeneratedActionItem:
    text: str
    assignee: Optional[str]


@dataclass
class AIResult:
    summary: str
    topics: list[GeneratedTopic]
    action_items: list[GeneratedActionItem]


@dataclass
class ChatMessage:
    role: str
    content: str


def _mock_result() -> AIResult:
    return AIResult(
        summary=(
            f"{MOCK_LABEL} This is a placeholder summary generated because the Gemini API key "
            "is not configured or the API call failed. Configure GEMINI_API_KEY in backend/.env to enable "
            "real AI-generated summaries."
        ),
        topics=[
            GeneratedTopic(title=f"{MOCK_LABEL} Topic 1", start_sec=0.0),
            GeneratedTopic(title=f"{MOCK_LABEL} Topic 2", start_sec=60.0),
        ],
        action_items=[
            GeneratedActionItem(text=f"{MOCK_LABEL} Review this meeting's transcript", assignee=None),
        ],
    )


def _mock_chat_answer(question: str) -> str:
    return (
        f"{MOCK_LABEL} I couldn't reach Gemini, so here's a transcript-grounded placeholder response. "
        f"Your question was: '{question}'. Configure a working Gemini model/API key to enable real meeting Q&A."
    )


def _build_prompt(title: str, duration_sec: int, participants: list[str], transcript: str) -> str:
    mins = duration_sec // 60
    return f"""You are a meeting analysis assistant. Analyze the transcript below and return ONLY valid JSON — no markdown fences, no preamble, no explanation.

Return exactly this structure:
{{
  "summary": "2-3 paragraph plain-text summary of the meeting",
  "topics": [
    {{"title": "Topic name", "start_sec": 0}}
  ],
  "action_items": [
    {{"text": "Action item description", "assignee": "Person name or null"}}
  ]
}}

Meeting Title: {title}
Duration: {mins} minutes
Participants: {", ".join(participants)}

Transcript:
{transcript[:12000]}"""


def _derive_topic_timestamps(
    topics_raw: list[dict],
    transcript_lines: list[dict],
    duration_sec: int,
) -> list[GeneratedTopic]:
    """Match topic titles to nearest transcript line by keyword search."""
    result = []
    n = len(topics_raw)
    for i, t in enumerate(topics_raw):
        title = t.get("title", f"Topic {i+1}")
        provided_start = t.get("start_sec")

        # Try keyword match against transcript
        words = set(re.sub(r"[^a-z0-9 ]", "", title.lower()).split())
        best_sec: Optional[float] = None
        best_score = 0
        for line in transcript_lines:
            line_words = set(re.sub(r"[^a-z0-9 ]", "", line.get("text", "").lower()).split())
            score = len(words & line_words)
            if score > best_score:
                best_score = score
                best_sec = line.get("start_sec", 0.0)

        if best_sec is None or best_score == 0:
            # Fall back: use provided start_sec or proportional estimate
            if provided_start is not None:
                best_sec = float(provided_start)
            else:
                best_sec = round((i / max(n, 1)) * duration_sec, 2)

        result.append(GeneratedTopic(title=title, start_sec=round(best_sec, 2)))
    return result


def _call_gemini(prompt: str, api_key: str, response_mime_type: str = "application/json") -> str:
    import google.generativeai as genai  # type: ignore
    genai.configure(api_key=api_key.strip())

    preferred_models = [
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
    ]
    candidate_models = list(preferred_models)
    last_err = None

    try:
        available_models = []
        for model in genai.list_models():
            supported = getattr(model, "supported_generation_methods", []) or []
            if "generateContent" not in supported:
                continue
            model_name = getattr(model, "name", "")
            if model_name.startswith("models/"):
                model_name = model_name.split("/", 1)[1]
            if model_name:
                available_models.append(model_name)

        if available_models:
            preferred_available = [m for m in preferred_models if m in available_models]
            remaining_available = [m for m in available_models if m not in preferred_available]
            candidate_models = preferred_available or remaining_available
            logger.info(f"Gemini generateContent models available: {candidate_models[:8]}")
    except Exception as e:
        logger.warning(f"Unable to list Gemini models, falling back to preferred defaults: {e}")

    for model_name in candidate_models:
        try:
            logger.info(f"Attempting Gemini generation with model: {model_name}")
            model = genai.GenerativeModel(
                model_name,
                generation_config={"temperature": 0.3, "response_mime_type": response_mime_type},
            )
            response = model.generate_content(prompt, request_options={"timeout": 25})
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}")
            last_err = e

    raise RuntimeError(f"All Gemini models failed. Last error: {last_err}")


def _parse_response(raw: str, transcript_lines: list[dict], duration_sec: int) -> AIResult:
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    data = json.loads(cleaned)

    topics = _derive_topic_timestamps(data.get("topics", []), transcript_lines, duration_sec)
    action_items = [
        GeneratedActionItem(
            text=a.get("text", ""),
            assignee=a.get("assignee") or None,
        )
        for a in data.get("action_items", [])
    ]
    return AIResult(summary=data.get("summary", ""), topics=topics, action_items=action_items)


def generate_ai_content(
    title: str,
    duration_sec: int,
    participants: list[str],
    transcript_text: str,
    transcript_lines: list[dict],
    api_key: str,
) -> AIResult:
    clean_key = api_key.strip() if api_key else ""
    if not clean_key:
        logger.warning("GEMINI_API_KEY not set — returning mock AI response.")
        return _mock_result()

    prompt = _build_prompt(title, duration_sec, participants, transcript_text)

    for attempt in range(2):
        try:
            raw = _call_gemini(prompt, clean_key)
            return _parse_response(raw, transcript_lines, duration_sec)
        except json.JSONDecodeError as e:
            logger.warning(f"Gemini JSON parse error (attempt {attempt+1}): {e}")
        except Exception as e:
            logger.error(f"Gemini API error (attempt {attempt+1}): {e}")
            break

    logger.error("Falling back to mock AI response after failures.")
    return _mock_result()


def _build_chat_prompt(
    title: str,
    participants: list[str],
    summary_text: str,
    transcript_text: str,
    question: str,
    history: list[ChatMessage],
) -> str:
    history_text = "\n".join(
        f"{message.role.upper()}: {message.content}" for message in history[-8:]
    )
    return f"""You are a meeting assistant answering questions about one specific meeting.

Answer only using the meeting context below. If the answer is not supported by the transcript or summary, say that clearly.
Keep the answer concise, useful, and specific.

Meeting title: {title}
Participants: {", ".join(participants) if participants else "Unknown"}

Summary:
{summary_text or "No summary available."}

Transcript:
{transcript_text[:16000]}

Conversation so far:
{history_text or "No previous messages."}

User question:
{question}
"""


def answer_meeting_question(
    title: str,
    participants: list[str],
    summary_text: str,
    transcript_text: str,
    question: str,
    history: list[ChatMessage],
    api_key: str,
) -> str:
    clean_key = api_key.strip() if api_key else ""
    if not clean_key:
        logger.warning("GEMINI_API_KEY not set — returning mock chat response.")
        return _mock_chat_answer(question)

    prompt = _build_chat_prompt(
        title=title,
        participants=participants,
        summary_text=summary_text,
        transcript_text=transcript_text,
        question=question,
        history=history,
    )

    try:
        return _call_gemini(prompt, clean_key, response_mime_type="text/plain").strip()
    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        return _mock_chat_answer(question)

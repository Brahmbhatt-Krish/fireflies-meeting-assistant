"""
Transcript parser supporting three formats:

1. Plain text  — one utterance per non-empty line: "Speaker Name: text content"
   Timestamps are estimated by distributing lines evenly across duration_sec.
   If duration_sec is unknown (0), uses 30 words-per-minute average to estimate.

2. WebVTT (.vtt) — standard WebVTT cue blocks with HH:MM:SS.mmm --> HH:MM:SS.mmm headers.
   Speaker name embedded in cue text as first line ending in ":" OR via <v Speaker> tags.

3. JSON (.json) — array of objects: [{speaker, start_sec, text, end_sec?}, ...]
"""
import re
import json
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedLine:
    speaker: str
    start_sec: float
    end_sec: Optional[float]
    text: str
    order_index: int


def parse_transcript(content: str, fmt: str = "text", duration_sec: int = 0) -> list[ParsedLine]:
    fmt = fmt.lower().strip()
    if fmt in ("json",):
        return _parse_json(content)
    if fmt in ("vtt",):
        return _parse_vtt(content)
    return _parse_plain(content, duration_sec)


# ─── Plain Text ───────────────────────────────────────────────────────────────

def _parse_plain(content: str, duration_sec: int) -> list[ParsedLine]:
    lines = [l for l in content.splitlines() if l.strip() and ":" in l]
    parsed: list[ParsedLine] = []
    total = len(lines)
    if total == 0:
        return []

    # Estimate duration if not provided
    if duration_sec <= 0:
        word_count = sum(len(l.split()) for l in lines)
        duration_sec = max(60, int(word_count / 2.2))  # ~130 wpm

    step = duration_sec / total
    for i, line in enumerate(lines):
        colon_idx = line.index(":")
        speaker = line[:colon_idx].strip()
        text = line[colon_idx + 1:].strip()
        if not speaker or not text:
            continue
        start = round(i * step, 2)
        end = round((i + 1) * step, 2)
        parsed.append(ParsedLine(speaker=speaker, start_sec=start, end_sec=end, text=text, order_index=i))
    return parsed


# ─── WebVTT ──────────────────────────────────────────────────────────────────

_VTT_TS = re.compile(
    r"(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{3})"
)
_VTT_V_TAG = re.compile(r"<v\s+([^>]+)>(.+?)(?:</v>|$)", re.IGNORECASE)


def _ts_to_sec(h: str, m: str, s: str, ms: str) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def _parse_vtt(content: str) -> list[ParsedLine]:
    blocks = re.split(r"\n{2,}", content.strip())
    parsed: list[ParsedLine] = []
    order = 0
    for block in blocks:
        block = block.strip()
        if not block or block.upper().startswith("WEBVTT"):
            continue
        lines = block.splitlines()
        ts_line = None
        ts_match = None
        for i, l in enumerate(lines):
            m = _VTT_TS.search(l)
            if m:
                ts_match = m
                ts_line = i
                break
        if ts_match is None:
            continue
        start = _ts_to_sec(*ts_match.groups()[:4])
        end = _ts_to_sec(*ts_match.groups()[4:])
        text_lines = lines[ts_line + 1:]
        full_text = " ".join(text_lines).strip()
        if not full_text:
            continue

        # Try <v Speaker> tag
        v_match = _VTT_V_TAG.search(full_text)
        if v_match:
            speaker = v_match.group(1).strip()
            text = re.sub(r"<[^>]+>", "", v_match.group(2)).strip()
        elif text_lines and text_lines[0].rstrip().endswith(":"):
            speaker = text_lines[0].rstrip()[:-1].strip()
            text = " ".join(text_lines[1:]).strip()
            text = re.sub(r"<[^>]+>", "", text).strip()
        else:
            speaker = "Speaker"
            text = re.sub(r"<[^>]+>", "", full_text).strip()

        if text:
            parsed.append(ParsedLine(speaker=speaker, start_sec=start, end_sec=end, text=text, order_index=order))
            order += 1
    return parsed


# ─── JSON ─────────────────────────────────────────────────────────────────────

def _parse_json(content: str) -> list[ParsedLine]:
    data = json.loads(content)
    parsed: list[ParsedLine] = []
    for i, item in enumerate(data):
        parsed.append(ParsedLine(
            speaker=item.get("speaker", "Unknown"),
            start_sec=float(item.get("start_sec", 0)),
            end_sec=float(item["end_sec"]) if item.get("end_sec") is not None else None,
            text=item.get("text", ""),
            order_index=i,
        ))
    return parsed

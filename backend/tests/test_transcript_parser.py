import pytest
from app.services.transcript_parser import parse_transcript


def test_plain_text_basic():
    txt = "Alice: Hello everyone.\nBob: Thanks for joining.\nAlice: Let's get started."
    lines = parse_transcript(txt, fmt="text", duration_sec=90)
    assert len(lines) == 3
    assert lines[0].speaker == "Alice"
    assert lines[0].text == "Hello everyone."
    assert lines[1].speaker == "Bob"
    assert lines[0].start_sec == 0.0
    assert lines[1].start_sec == 30.0


def test_plain_text_colon_in_text():
    txt = "Speaker: Time is 10:30 AM and we begin."
    lines = parse_transcript(txt, fmt="text", duration_sec=60)
    assert lines[0].speaker == "Speaker"
    assert "10:30 AM" in lines[0].text


def test_plain_text_empty():
    lines = parse_transcript("", fmt="text", duration_sec=60)
    assert lines == []


def test_plain_text_skips_no_colon():
    txt = "No colon here\nAlice: Valid line."
    lines = parse_transcript(txt, fmt="text", duration_sec=60)
    assert len(lines) == 1
    assert lines[0].speaker == "Alice"


def test_json_format():
    import json
    data = [
        {"speaker": "Alice", "start_sec": 0.0, "end_sec": 5.0, "text": "Hello."},
        {"speaker": "Bob", "start_sec": 5.0, "end_sec": 10.0, "text": "Hi there."},
    ]
    lines = parse_transcript(json.dumps(data), fmt="json")
    assert len(lines) == 2
    assert lines[0].start_sec == 0.0
    assert lines[1].speaker == "Bob"


def test_vtt_basic():
    vtt = """WEBVTT

00:00:01.000 --> 00:00:04.000
<v Alice>Hello everyone.</v>

00:00:05.000 --> 00:00:08.000
<v Bob>Thanks for joining.</v>
"""
    lines = parse_transcript(vtt, fmt="vtt")
    assert len(lines) == 2
    assert lines[0].speaker == "Alice"
    assert lines[0].start_sec == 1.0
    assert lines[0].end_sec == 4.0
    assert lines[1].speaker == "Bob"


def test_duration_estimated_if_zero():
    txt = "\n".join([f"Speaker: Word " * 20 for _ in range(10)])
    lines = parse_transcript(txt, fmt="text", duration_sec=0)
    assert len(lines) > 0
    assert lines[-1].start_sec > 0

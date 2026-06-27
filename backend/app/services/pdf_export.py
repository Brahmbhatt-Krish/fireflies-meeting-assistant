from datetime import datetime


def _escape_pdf_text(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def _wrap_text(text: str, max_chars: int = 92) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if len(candidate) <= max_chars:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def build_summary_pdf(
    *,
    title: str,
    meeting_date: datetime,
    participants: list[str],
    summary_text: str,
    topics: list[str],
) -> bytes:
    lines: list[tuple[str, int]] = [
        ("Meeting Summary", 18),
        ("", 12),
        (f"Title: {title}", 12),
        (f"Date: {meeting_date.strftime('%b %d, %Y %I:%M %p')}", 12),
        (f"Participants: {', '.join(participants) if participants else 'None listed'}", 12),
        ("", 12),
        ("Summary", 14),
    ]

    for paragraph in (summary_text or "No summary available.").splitlines():
        text = paragraph.strip()
        if not text:
            lines.append(("", 12))
            continue
        for wrapped in _wrap_text(text):
            lines.append((wrapped, 12))

    if topics:
        lines.extend([("", 12), ("Topics", 14)])
        for topic in topics:
            for i, wrapped in enumerate(_wrap_text(f"- {topic}")):
                lines.append((wrapped if i == 0 else f"  {wrapped}", 12))

    page_width = 612
    page_height = 792
    x = 54
    y = 744
    line_gap = 18

    content_parts = ["BT", f"/F1 12 Tf", f"{x} {y} Td"]
    current_font = 12
    current_y = y

    for text, font_size in lines:
        if font_size != current_font:
            content_parts.append(f"/F1 {font_size} Tf")
            current_font = font_size

        if current_y != y:
            content_parts.append(f"0 -{line_gap} Td")
        escaped = _escape_pdf_text(text)
        content_parts.append(f"({escaped}) Tj")
        current_y -= line_gap

    content_parts.append("ET")
    content = "\n".join(content_parts).encode("latin-1", errors="replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_width} {page_height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>".encode(),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(content)} >>\nstream\n".encode() + content + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_start}\n%%EOF"
        ).encode()
    )
    return bytes(pdf)

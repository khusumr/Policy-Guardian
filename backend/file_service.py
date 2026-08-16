from io import BytesIO
from html import escape

from docx import Document

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


def clean_pdf_text(text: str) -> str:
    """
    Replace Unicode characters that may not render correctly
    with ReportLab's default fonts.
    """
    replacements = {
        "\u2010": "-",   # hyphen
        "\u2011": "-",   # non-breaking hyphen
        "\u2012": "-",   # figure dash
        "\u2013": "-",   # en dash
        "\u2014": "-",   # em dash
        "\u2212": "-",   # minus sign
        "\u00a0": " ",   # non-breaking space
        "\u2018": "'",   # left single quote
        "\u2019": "'",   # right single quote
        "\u201c": '"',   # left double quote
        "\u201d": '"',   # right double quote
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def policy_to_docx_bytes(policy_content: str, title: str) -> bytes:
    doc = Document()

    doc.add_heading(title, level=1)

    for paragraph in policy_content.split("\n\n"):
        if paragraph.strip():
            doc.add_paragraph(paragraph.strip())

    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return buffer.read()


def policy_to_pdf_bytes(policy_content: str, title: str) -> bytes:
    buffer = BytesIO()

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        title=title,
    )

    styles = getSampleStyleSheet()
    story = []

    # Add title
    story.append(
        Paragraph(
            escape(clean_pdf_text(title)),
            styles["Title"],
        )
    )

    story.append(Spacer(1, 12))

    # Add policy content
    for paragraph in policy_content.split("\n\n"):
        paragraph = paragraph.strip()

        if paragraph:
            safe_text = escape(
                clean_pdf_text(paragraph)
            ).replace("\n", "<br/>")

            story.append(
                Paragraph(
                    safe_text,
                    styles["BodyText"],
                )
            )

            story.append(Spacer(1, 10))

    pdf.build(story)

    buffer.seek(0)

    return buffer.read()
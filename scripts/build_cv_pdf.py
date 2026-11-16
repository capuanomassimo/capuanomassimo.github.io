#!/usr/bin/env python3
"""Render the Jekyll CV page to the downloadable PDF placed in _site/files."""
from pathlib import Path
import re
import subprocess
import sys

from weasyprint import CSS, HTML


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
HTML_FILE = SITE / "cv" / "index.html"
OUTPUT = SITE / "files" / "Massimo_Capuano_CV.pdf"

PDF_STYLES = CSS(string="""
@page {
  size: A4;
  margin: 11mm 13mm 13mm;
  @bottom-right {
    content: "Page " counter(page) " / " counter(pages);
    color: #64748b;
    font-size: 7pt;
  }
}

html, body {
  color: #172b40 !important;
  background: #ffffff !important;
  font-family: "DejaVu Sans", Arial, sans-serif !important;
  font-size: 8.4pt !important;
  line-height: 1.28 !important;
}

.masthead, .page__footer, .cv-actions, .cv-print-only,
.sidebar, .mobile-profile, .page__meta, .pagination {
  display: none !important;
}

#main.cv-shell {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cv-document {
  width: 100% !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: #ffffff !important;
}

.cv-header {
  display: block !important;
  gap: 0 !important;
  padding: 0 0 4mm !important;
  border-bottom: 1.2pt solid #2f659e !important;
}

.cv-eyebrow {
  margin: 0 0 1mm !important;
  color: #315f91 !important;
  font-size: 7.6pt !important;
}

.cv-header h1 {
  margin: 0 !important;
  font-size: 21pt !important;
  line-height: 1.12 !important;
}

.cv-role {
  margin: 1mm 0 0 !important;
  font-size: 10pt !important;
}

.cv-affiliation {
  margin: 0.5mm 0 2mm !important;
  font-size: 8.1pt !important;
}

.cv-contact {
  display: block !important;
  font-size: 7.7pt !important;
}

.cv-contact a {
  display: inline-block !important;
  margin: 0 3mm 1mm 0 !important;
}

.cv-content {
  padding-top: 0 !important;
}

.cv-section {
  margin-top: 3.4mm !important;
  break-inside: auto !important;
}

.cv-section > h2 {
  margin: 0 0 2mm !important;
  padding: 0 0 1mm !important;
  color: #204d7d !important;
  border-bottom: 0.6pt solid #cbd8e6 !important;
  font-size: 10.2pt !important;
  line-height: 1.2 !important;
}

.cv-entry {
  margin: 0 0 2.2mm !important;
  break-inside: avoid !important;
}

.cv-entry-heading {
  display: flex !important;
  justify-content: space-between !important;
  align-items: baseline !important;
  gap: 2mm !important;
}

.cv-entry h3 {
  margin: 0 !important;
  font-size: 8.8pt !important;
}

.cv-period {
  font-size: 7.7pt !important;
}

.cv-institution {
  margin: 0.3mm 0 0.7mm !important;
  font-size: 8pt !important;
}

.cv-detail, .cv-detail-line, .cv-skill-group {
  margin: 0.4mm 0 !important;
  font-size: 7.9pt !important;
  line-height: 1.3 !important;
}

.cv-list {
  margin: 0.5mm 0 0 4mm !important;
}

.cv-list li {
  margin: 0.35mm 0 !important;
  font-size: 7.8pt !important;
  line-height: 1.28 !important;
}

.cv-publications {
  margin: 0 !important;
  padding: 0 !important;
}

.cv-publications li {
  margin: 0 0 1.2mm !important;
  padding: 0 0 1mm !important;
  border-bottom: 0.4pt solid #e2e8f0 !important;
  font-size: 7.9pt !important;
  line-height: 1.28 !important;
  break-inside: avoid !important;
}

.cv-publication-meta {
  display: block !important;
  margin-top: 0.2mm !important;
  font-size: 7.4pt !important;
}

.cv-inline-list {
  display: block !important;
  margin: 0 !important;
  padding-left: 4mm !important;
}

.cv-inline-list li, .cv-compact-list li {
  margin: 0.3mm 0 !important;
  font-size: 7.9pt !important;
}

.cv-two-column {
  display: block !important;
}

.cv-entry-compact {
  margin-bottom: 1.5mm !important;
}

.cv-compact-list {
  margin: 0 !important;
  padding-left: 4mm !important;
}

a {
  color: #172b40 !important;
  text-decoration: none !important;
}
""")


def main() -> int:
    if not HTML_FILE.is_file():
        print(f"Missing generated CV page: {HTML_FILE}", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    source = HTML_FILE.read_text(encoding="utf-8")

    # Resolve root-relative assets against the generated site folder for WeasyPrint.
    site_uri = SITE.as_uri()
    source = re.sub(
        r'((?:href|src)=["\'])/(assets/[^"\']+)',
        lambda match: f"{match.group(1)}{site_uri}/{match.group(2)}",
        source,
    )

    HTML(string=source, base_url=SITE.as_uri(), media_type="print").write_pdf(
        str(OUTPUT),
        stylesheets=[PDF_STYLES],
    )

    if not OUTPUT.is_file():
        print("Generated CV PDF is missing.", file=sys.stderr)
        return 1
    print(f"Generated PDF size: {OUTPUT.stat().st_size:,} bytes")
    if OUTPUT.stat().st_size < 1_000:
        print("Generated CV PDF is unexpectedly small.", file=sys.stderr)
        return 1

    text = subprocess.run(
        ["pdftotext", "-layout", str(OUTPUT), "-"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout

    required_sections = [
        "Education",
        "Professional Experience",
        "Publications and Scholarly Work",
        "Research Interests",
        "Honours and Awards",
        "Professional Development",
        "Languages",
        "Technical Skills",
    ]
    missing = [section for section in required_sections if section.lower() not in text.lower()]
    if missing:
        print("CV PDF is missing expected sections: " + ", ".join(missing), file=sys.stderr)
        return 1

    forbidden_fragments = ["Fiscal Code", "Date of birth", "Home address"]
    present = [fragment for fragment in forbidden_fragments if fragment.lower() in text.lower()]
    if present:
        print("Unexpected personal identifiers found in CV: " + ", ".join(present), file=sys.stderr)
        return 1

    page_info = subprocess.run(
        ["pdfinfo", str(OUTPUT)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    print(page_info)
    print(f"Generated {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

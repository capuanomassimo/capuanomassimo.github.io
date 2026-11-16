#!/usr/bin/env python3
"""Render the Jekyll CV page to the downloadable PDF placed in _site/files."""
from pathlib import Path
import re
import subprocess
import sys

from weasyprint import HTML


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
HTML_FILE = SITE / "cv" / "index.html"
OUTPUT = SITE / "files" / "Massimo_Capuano_CV.pdf"


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

    HTML(string=source, base_url=SITE.as_uri()).write_pdf(str(OUTPUT))

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

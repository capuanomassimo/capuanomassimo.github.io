#!/usr/bin/env python3
"""Basic content and internal-link checks for the generated academic website."""
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag not in {"a", "link", "img", "script"}:
            return
        values = dict(attrs)
        key = "href" if tag in {"a", "link"} else "src"
        value = values.get(key)
        if value:
            self.links.append(value)


def find_page(path: str) -> Path:
    file = SITE / path / "index.html"
    if not file.is_file():
        raise FileNotFoundError(file)
    return file


def check_page(path: str, required: list[str]) -> list[str]:
    file = find_page(path)
    source = file.read_text(encoding="utf-8")
    errors = [f"{path}: missing expected text '{value}'" for value in required if value.lower() not in source.lower()]
    parser = LinkCollector()
    parser.feed(source)
    for url in parser.links:
        if url.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        parsed = urlparse(url)
        if parsed.scheme in {"http", "https", "data"}:
            continue
        local = url.split("#", 1)[0].split("?", 1)[0]
        if not local:
            continue
        target = (SITE / local.lstrip("/"))
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            errors.append(f"{path}: broken local reference '{url}'")
    return errors


def main() -> int:
    checks = {
        "cv": [
            "Education", "Professional Experience", "Publications and Scholarly Work",
            "Research Interests", "Honours and Awards", "Professional Development",
            "Languages", "Technical Skills", "Massimo Capuano",
        ],
        "research": [
            "Asset Pricing and Financial Economics", "Derivatives and Quantitative Finance",
            "Systemic Risk and Financial Stability", "Sustainable Finance and ESG",
            "Related work",
        ],
        "publications": [
            "Journal Articles", "Working Papers and Preprints",
            "Conference Papers and Book Chapters", "Theses",
            "Credit default swap", "Pricing asian option",
        ],
    }
    errors: list[str] = []
    for path, required in checks.items():
        errors.extend(check_page(path, required))
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Academic site validation passed: CV, Research, Publications and local links.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

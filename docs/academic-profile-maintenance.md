# Maintaining the academic profile

The site uses shared structured academic data. The CV, About page, sidebar profile, and Publications page consume this data during the next GitHub Pages build.

## Where to update information

- `_data/academic_profile.yml`: profile details, education, work experience, awards, academic service, leadership, interests, languages, skills, licences, and certifications.
- `_data/research.yml`: research-area labels and descriptions used in the CV and profile summary.
- `_publications/*.md`: one Markdown record per publication, working paper, book chapter, or thesis.
- `_pages/cv.html`: CV presentation only. Do not duplicate publication records here.
- `_pages/research.md`: currently retained in its previous, simple form by design. Do not change it as part of ordinary profile-data updates.

## Adding a publication

Create one file in `_publications/` with the usual Jekyll front matter:

```yaml
---
title: "Full paper title"
collection: publications
category: working-papers
date: 2026-11-16
authors: "Author One and Author Two"
type: "Preprint"
paperurl: "https://doi.org/..."
---
```

Use one of the existing categories: `journal-articles`, `working-papers`, `conference-papers`, or `theses`. Each publication record is used by Publications and the CV. The Research page is intentionally not yet connected to these records.

## Updating the CV PDF

The CV page at `/cv/` includes a **Download CV (PDF)** link. The Pages deployment workflow builds the HTML site, then uses Playwright to print that same page to A4 PDF at `files/Massimo_Capuano_CV.pdf`. The generated PDF is included in the deployed site. The original PDF in the repository remains available as a fallback source until the migration has been approved.

## Safe workflow

Work on `feature/academic-profile-system` until the review is complete. The pre-migration snapshot is preserved on `backup/pre-academic-profile-2026-11-16`. Do not deploy the preview branch to production.

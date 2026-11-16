# Maintaining the academic profile

The site uses a shared academic data model. Update the source record once; the CV, Research page, sidebar profile, About page, and Publications page consume the same data during the next GitHub Pages build.

## Where to update information

- `_data/academic_profile.yml`: profile details, education, work experience, awards, academic service, leadership, interests, languages, skills, licences, and certifications.
- `_data/research.yml`: research areas and their editorial descriptions.
- `_publications/*.md`: one Markdown record per publication, working paper, book chapter, or thesis.
- `_pages/cv.html`: CV presentation only. Do not duplicate publication records here.
- `_pages/research.md`: research-page presentation only. Related outputs are collected from the publication records.

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
research_areas:
  - asset-pricing-and-derivatives
---
```

Use one of the existing categories: `journal-articles`, `working-papers`, `conference-papers`, or `theses`. Add one or more IDs from `_data/research.yml` in `research_areas` to connect the item to the Research page. The same record is automatically listed in Publications and the CV.

## Updating the CV PDF

The Pages deployment workflow builds the HTML site, then uses Playwright to print `/cv/` to A4 PDF at `files/Massimo_Capuano_CV.pdf`. The generated PDF replaces the old copy in the deployment artifact only; the source PDF in the repository remains available as a fallback. The workflow checks key CV sections and extracts the PDF text before deployment.

## Safe workflow

Work on `feature/academic-profile-system` until the review is complete. The pre-migration snapshot is preserved on `backup/pre-academic-profile-2026-11-16`. Do not deploy the preview branch to production.

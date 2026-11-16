# Academic profile data

The academic website uses structured YAML data as its shared source of truth.

## Where to edit information

- `_data/profile.yml`: name, academic role, affiliation and professional contact links.
- `_data/education.yml`: degrees and exchange programmes.
- `_data/experience.yml`: employment and university roles.
- `_data/research.yml`: research themes and their descriptions.
- `_publications/`: individual scholarly works. Each record has a category, date, authors, type, links and optional `research_areas`.
- `_data/training.yml`, `_data/certifications.yml`, `_data/awards.yml`, `_data/activities.yml`, `_data/languages.yml` and `_data/skills.yml`: the corresponding CV sections.

## Automatic updates

The CV and Research pages read from these data files and the Publications collection. A publication is therefore entered once in `_publications/`; its entry appears in Publications and the CV, and appears under each matching Research theme when its `research_areas` include that theme's ID.

The production GitHub Actions workflow builds the site and generates `files/Massimo_Capuano_CV.pdf` from the same CV page. The PDF is placed in the deployed site artifact and is not maintained as a second manually edited source.

## Local checks

Run `bundle exec jekyll build`, then `python3 scripts/build_cv_pdf.py` after installing WeasyPrint and Poppler, and finally `python3 scripts/validate_academic_site.py`.

Personal identifiers, date of birth and private residential details are intentionally not part of the public academic profile.

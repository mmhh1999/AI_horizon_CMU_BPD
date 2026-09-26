# Data

| Folder | Contents | In git? |
|---|---|---|
| `raw/` | Downloads exactly as retrieved (parcels, zoning, hazards, GTFS, ACS) | No, too large. Scripts re-download them |
| `interim/` | Cleaned and joined intermediates | No |
| `processed/` | Small, demo-ready outputs the app reads (e.g., demo-area parcels with scores) | Yes, if small (under ~20 MB) |
| `reference/` | Hand-curated tables: typology specs, zoning rules with section citations and `verified_by` | Yes |

Rules:

- Log every dataset's source URL and retrieval date in [../docs/data-sources.md](../docs/data-sources.md).
- **No PII.** Drop owner names and mailing addresses from the assessment data at ingest, before anything is written to `interim/`.
- Every row in `reference/` carries its source (a book page or code section).

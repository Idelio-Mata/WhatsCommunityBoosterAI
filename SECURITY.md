# Security Notes

## Known Vulnerabilities

### uuid < 11.1.1 (moderate)
- Dependency of: exceljs
- Risk: Missing buffer bounds check in v3/v5/v6
- Decision: Accepted consciously — uuid is a transitive dependency
  of exceljs and is only used for internal file generation from
  trusted local Excel files, never from external input.
- Reference: https://github.com/advisories/GHSA-w5hq-g745-h8pq
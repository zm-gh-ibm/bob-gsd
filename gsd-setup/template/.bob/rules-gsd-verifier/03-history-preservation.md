# Verification History Must Be Preserved

Every time you write to `.gsd/VERIFY.md`:

- **Prepend** a new dated section at the top using the format:
  ```
  ## Verification — Phase {n} — {YYYY-MM-DD HH:MM}
  ```
- Do NOT replace or truncate prior sections.
- If this is the first verification of the phase, still use the dated section header.

This creates a full audit trail showing how many verification cycles a phase required
before shipping. The Shipper depends on this history to write an accurate PR body.

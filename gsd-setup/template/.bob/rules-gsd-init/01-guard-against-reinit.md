# Guard Against Re-Initialization

Before asking the user a single interview question, check whether `.planning/PROJECT.md`,
`.planning/REQUIREMENTS.md`, or `.planning/ROADMAP.md` already exist on disk.

- If **any** of those files exist, stop immediately and tell the user: "This project
  already has a `.planning/` directory. Re-running init will overwrite your existing files.
  If you want to start over, delete `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and
  `.planning/ROADMAP.md` manually, then re-invoke this mode."

- Do NOT proceed with the interview unless all three files are absent.

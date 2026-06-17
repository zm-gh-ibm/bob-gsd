# Guard Against Re-Initialization

Before asking the user a single interview question, check whether `.gsd/PROJECT.md`,
`.gsd/REQUIREMENTS.md`, or `.gsd/ROADMAP.md` already exist on disk.

- If **any** of those files exist, stop immediately and tell the user: "This project
  already has a `.gsd/` directory. Re-running init will overwrite your existing files.
  If you want to start over, delete `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, and
  `.gsd/ROADMAP.md` manually, then re-invoke this mode."

- Do NOT proceed with the interview unless all three files are absent.

#!/usr/bin/env python3
"""
gen-bob-commands.py
  Converts GSD skills (SKILL.md files) into Bob-native slash commands (.md files).

  Each SKILL.md in SKILLS_DIR is transformed:
    1. Frontmatter: keep description + argument-hint; strip Claude-only fields
       (allowed-tools, effort, etc.)
    2. @$HOME/.../path.md references in <execution_context> are resolved and
       their content is inlined into the output file.
    3. XML wrapper tags (<objective>, <execution_context>, <process>, etc.) are
       converted to clean Markdown headings.

  Output: one .md file per skill written to OUT_DIR.

Usage:
  python3 gen-bob-commands.py [--skills-dir PATH] [--out-dir PATH] [--dry-run]

Defaults:
  --skills-dir  ~/.claude/skills
  --out-dir     ~/.bob/commands
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

HOME = Path.home()
DEFAULT_SKILLS_DIR = HOME / ".claude" / "skills"
DEFAULT_OUT_DIR = HOME / ".bob" / "commands"

# Frontmatter keys to KEEP in the Bob command output
KEEP_KEYS = {"description", "argument-hint"}

# XML tag → Markdown heading mapping (tags we want to promote to ## headings)
TAG_TO_HEADING: dict[str, str] = {
    "objective": "## Objective",
    "context": "## Context",
    "flags": "## Flags",
    "process": "## Process",
    "runtime_note": "## Runtime Note",
    # execution_context is handled specially (inlined), not headlined
}

# Tags to DROP entirely (content is inlined separately or not relevant for Bob)
DROP_TAGS = {"execution_context"}


def resolve_at_ref(ref_path_str: str) -> str:
    """Resolve a @$HOME/... or @./... path and return its content."""
    # Replace $HOME with actual home dir
    resolved = ref_path_str.replace("$HOME", str(HOME))
    p = Path(resolved)
    if p.exists():
        content = p.read_text(encoding="utf-8")
        return f"\n<!-- included: {p.name} -->\n{content.strip()}\n"
    else:
        return f"\n<!-- WARNING: could not resolve @{ref_path_str} -->\n"


def extract_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Split YAML frontmatter from body. Returns (meta_dict, body)."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm_block = text[3:end].strip()
    body = text[end + 4:].lstrip("\n")
    meta: dict[str, str] = {}
    current_key = None
    current_val_lines: list[str] = []
    for line in fm_block.splitlines():
        kv = re.match(r'^(\S[^:]*?):\s*(.*)', line)
        if kv:
            if current_key:
                meta[current_key] = "\n".join(current_val_lines).strip()
            current_key = kv.group(1).strip()
            current_val_lines = [kv.group(2)]
        elif current_key and (line.startswith("  ") or line.startswith("\t")):
            current_val_lines.append(line.strip())
    if current_key:
        meta[current_key] = "\n".join(current_val_lines).strip()
    return meta, body


def build_frontmatter(meta: dict[str, str]) -> str:
    """Rebuild frontmatter keeping only Bob-compatible keys."""
    kept = {k: v for k, v in meta.items() if k in KEEP_KEYS and v}
    if not kept:
        return ""
    lines = ["---"]
    for key in ["description", "argument-hint"]:  # preserve order
        if key in kept:
            val = kept[key]
            # Quote if not already quoted and contains special chars
            if val and not (val.startswith('"') and val.endswith('"')):
                if any(c in val for c in [':', '#', '{', '}']):
                    val = f'"{val}"'
            lines.append(f"{key}: {val}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def collect_execution_context_refs(body: str) -> list[str]:
    """Extract all @path references from the <execution_context> block."""
    match = re.search(
        r'<execution_context>(.*?)</execution_context>',
        body, re.DOTALL
    )
    if not match:
        return []
    block = match.group(1)
    return [
        m.group(1)
        for m in re.finditer(r'@(\S+)', block)
    ]


def transform_body(body: str) -> str:
    """
    Convert the SKILL.md body to a clean Bob command body:
    1. Collect + inline execution_context @refs.
    2. Remove <execution_context>...</execution_context> block.
    3. Convert other XML-style tags to markdown headings.
    4. Append inlined workflow content at the end.
    """
    # Collect refs before removing the block
    refs = collect_execution_context_refs(body)

    # Remove the execution_context block entirely
    body = re.sub(
        r'\n?<execution_context>.*?</execution_context>\n?',
        '\n', body, flags=re.DOTALL
    )

    # Convert known XML tags to Markdown headings.
    # Only match pure-alpha tags (no digits/dashes at start) to avoid mangling
    # angle-bracket patterns like <N>, <file-path>, <endpoint-name> that appear
    # in argument-hint strings and code examples.
    KNOWN_TAGS = set(TAG_TO_HEADING.keys()) | DROP_TAGS | {
        "required_reading", "available_agent_types", "guardrails",
        "success_criteria", "files_to_read", "workflow",
    }

    def replace_open_tag(m: re.Match) -> str:
        tag = m.group(1).lower()
        if tag not in KNOWN_TAGS:
            return m.group(0)  # Not a known tag — leave it alone
        if tag in TAG_TO_HEADING:
            return f"\n{TAG_TO_HEADING[tag]}\n"
        if tag in DROP_TAGS:
            return ""
        return ""  # known structural tags we just remove

    def replace_close_tag(m: re.Match) -> str:
        tag = m.group(1).lower()
        if tag not in KNOWN_TAGS:
            return m.group(0)
        return ""

    body = re.sub(r'<([a-zA-Z_][a-zA-Z0-9_]*)(?:\s[^>]*)?>',
                  replace_open_tag, body)
    body = re.sub(r'</([a-zA-Z_][a-zA-Z0-9_]*)>',
                  replace_close_tag, body)

    # Clean up excessive blank lines
    body = re.sub(r'\n{3,}', '\n\n', body).strip()

    # Inline referenced workflow files
    inlined_parts: list[str] = []
    for ref in refs:
        inlined_parts.append(resolve_at_ref(ref))

    if inlined_parts:
        body += "\n\n---\n\n## Workflow\n\n" + "\n\n---\n\n".join(inlined_parts)

    return body


def convert_skill(skill_dir: Path, out_dir: Path, dry_run: bool) -> str:
    """Convert a single SKILL.md to a Bob command .md file."""
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        return f"SKIP  {skill_dir.name}: no SKILL.md"

    text = skill_file.read_text(encoding="utf-8")
    meta, body = extract_frontmatter(text)

    # Use the folder name as the command name (matches existing skill naming)
    cmd_name = skill_dir.name  # e.g. gsd-progress

    fm = build_frontmatter(meta)
    transformed_body = transform_body(body)

    output = fm + transformed_body

    out_file = out_dir / f"{cmd_name}.md"
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file.write_text(output, encoding="utf-8")
        return f"OK    {cmd_name}.md  ({len(output)} chars)"
    else:
        return f"DRY   {cmd_name}.md  ({len(output)} chars)"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills-dir", default=str(DEFAULT_SKILLS_DIR),
                        help="Directory containing skill subdirectories")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR),
                        help="Destination directory for bob command .md files")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be written without writing")
    parser.add_argument("--skill", default=None,
                        help="Convert only this skill (by name, e.g. gsd-progress)")
    args = parser.parse_args()

    skills_dir = Path(args.skills_dir).expanduser()
    out_dir = Path(args.out_dir).expanduser()

    if not skills_dir.exists():
        print(f"ERROR: skills dir not found: {skills_dir}", file=sys.stderr)
        sys.exit(1)

    if args.skill:
        subdirs = [skills_dir / args.skill]
    else:
        subdirs = sorted(
            [d for d in skills_dir.iterdir() if d.is_dir()],
            key=lambda d: d.name
        )

    print(f"Skills dir : {skills_dir}")
    print(f"Output dir : {out_dir}")
    print(f"Mode       : {'dry-run' if args.dry_run else 'write'}")
    print(f"Skills     : {len(subdirs)}")
    print()

    ok = skip = 0
    for skill_dir in subdirs:
        result = convert_skill(skill_dir, out_dir, args.dry_run)
        print(result)
        if result.startswith("OK") or result.startswith("DRY"):
            ok += 1
        else:
            skip += 1

    print()
    print(f"Done. {ok} converted, {skip} skipped.")
    if not args.dry_run:
        print(f"Commands written to: {out_dir}")
        print()
        print("To use them, type / in Bob-Shell to see all /gsd-* commands.")


if __name__ == "__main__":
    main()

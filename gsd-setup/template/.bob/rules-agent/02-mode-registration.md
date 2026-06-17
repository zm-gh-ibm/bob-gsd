# How to Register the GSD Modes in Bob

The mode definitions live in `.bob/custom_modes.yaml` — this file is both the source of
truth and the deployed runtime copy. Bob does **not** auto-load it as modes — it must be
registered.

## To register for this project only (project-scoped)

Copy (or symlink) the contents of `.bob/custom_modes.yaml` into
`.bob/custom_modes.yaml` under the `customModes:` key. Bob loads `.bob/custom_modes.yaml`
automatically for every session in this project.

## To register globally (all projects)

Copy the mode definitions into Bob's global `custom_modes.yaml`
(Settings → Modes → Edit Global Modes). Global modes are available in every project.

## Keeping them in sync

When you edit `.bob/custom_modes.yaml`, you must also update the corresponding entry in
whichever `custom_modes.yaml` you registered it in. `.bob/custom_modes.yaml` is the source
of truth — the registered copy is a deployment artifact.

## Quick check

If Bob does not offer `gsd-orchestrator`, `gsd-planner`, etc. in the mode switcher,
the modes have not been registered. Re-run the copy step above.

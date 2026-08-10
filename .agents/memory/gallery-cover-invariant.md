---
name: Gallery album cover invariant
description: Album covers must have exactly one source of truth — custom uploaded file OR an is_cover image, never both.
---

The rule: a gallery album's cover is either a standalone uploaded ("custom") file or exactly one gallery image flagged `is_cover` — never both simultaneously.

**Why:** Code review found the cover became inconsistent when a custom cover coexisted with image `is_cover` flags (delete-image promotion silently overwrote a custom cover; setting a custom cover left stale `is_cover` flags).

**How to apply:** Setting a custom cover must clear all `is_cover` flags; `setAsCover` must drop the custom-cover marker; deleting a cover image only promotes another image when the cover is image-backed; first upload adopts cover only when no cover exists at all. Laravel must enforce the same invariant transactionally (e.g. nullable `cover_image_id` FK vs `custom_cover_path`).

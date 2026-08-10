---
name: Tiptap v3 rich text editor
description: Gotchas for the shared admin RichTextEditor built on Tiptap v3.
---

- StarterKit in Tiptap v3 already bundles the Link extension. Adding `@tiptap/extension-link` separately causes repeated "duplicate extension 'link'" console warnings; configure it via `StarterKit.configure({ link: {...} })` instead.
- `editor.commands.setContent(html, false)` is a type error in v3; the second argument is an options object: `setContent(html, { emitUpdate: false })`.

**Why:** Both bit during the admin News module build; the warning floods browser logs and confuses testers.

**How to apply:** When touching the shared `RichTextEditor` or adding Tiptap extensions, check whether StarterKit already ships the extension before installing a standalone package.

---
name: getApiError fields are strings
description: Frontend Laravel error mapping — fields are pre-joined strings, never index [0]
---

`getApiError(error).fields` (artifacts/web services/api.ts) normalizes Laravel `errors` arrays into `Record<string, string>` by joining messages. Indexing `fields[key][0]` yields the first *character*, not the first message.

**Why:** a code review caught DonatePage rendering only "T"/first Arabic letter for server validation errors after copying the pattern from ContactPage — which still contains this latent bug in its own `fields[field][0]` mapping (not fixed, out of scope at the time).

**How to apply:** when mapping server field errors onto a form, assign `fields[key]` directly. If touching ContactPage, fix its `[0]` indexing too.

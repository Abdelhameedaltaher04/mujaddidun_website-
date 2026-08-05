---
name: Authentication UI validation
description: Durable conventions for the bilingual authentication form experience.
---

Authentication failures from Laravel should render inline beneath the related field whenever a field mapping exists, with an inline form-level message for unmapped or general failures. Success states may continue using the existing success dialog pattern.

**Why:** Inline feedback preserves the user's entered values and makes validation actionable without interrupting the form flow.

**How to apply:** Keep loading, disabled, autofocus, Caps Lock, and accessibility behavior centralized in the shared authentication fields and submit controls; map backend snake_case validation keys to the form's display-field names at the page boundary.
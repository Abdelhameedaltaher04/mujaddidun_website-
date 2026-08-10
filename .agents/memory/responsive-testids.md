---
name: Responsive duplicate test ids
description: Desktop table + mobile card render paths must not share data-testid values.
---

Admin list pages render both a desktop table (hidden on small screens) and mobile cards. If action buttons in both paths use the same `data-testid`, automated UI tests can't target the visible one and time out.

**Why:** The Programs participants mobile test was blocked until card-path ids got a `-mobile` suffix.

**How to apply:** When duplicating row actions across table/card layouts, pass a `variant` ('desktop' | 'mobile') and suffix mobile test ids with `-mobile`.

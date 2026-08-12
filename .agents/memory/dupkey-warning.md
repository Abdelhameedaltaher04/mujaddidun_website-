---
name: Unsolved duplicate-key warning on admin pages
description: React "two children with same key" (numeric keys 2/3/4) fires on /admin/messages and /admin/volunteers; source not yet found — what has been ruled out.
---

React dev warning "Encountered two children with the same key, `%s`" with numeric values (2, 3, 4) fires on admin list pages (confirmed on /admin/messages; earlier on /admin/volunteers). Non-blocking; UI renders correctly.

**Ruled out (Aug 2026):**
- Statistics/CTA content lists (public content API returns unique ids)
- MessagesInboxList (`key={message.id}`, ids unique), MessagesFilters, MessagesStats/skeletons (index keys in separate parents)
- AdminPagination/UsersPagination (no numeric page-button lists), AdminSidebar/Navbar/Notifications/Breadcrumbs
- PartnersCarousel (composite keys)

**Blocked on:** component stack — Playwright console events and CDP Runtime.consoleAPICalled don't expose it.

**How to apply:** next attempt, temporarily monkey-patch `console.error` in `main.tsx` to append `new Error().stack` (or use React DevTools in a headed browser) rather than re-grepping key= patterns — static search has been exhausted.

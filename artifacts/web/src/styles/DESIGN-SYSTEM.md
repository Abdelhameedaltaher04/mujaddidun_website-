# Mujaddidun Platform — Design System

## 1. Identity & Philosophy
**Vibe:** Trustworthy, Warm, Humane, Dignified.
**Layout Paradigm:** Clean and minimal container-driven architecture.
**Mood Aesthetic:** "Modern Charity" — a bright Orange & White identity: energetic orange (#F97316) signifying warmth and action on clean white surfaces, with soft cream (#FFF7ED) supporting tones.
**Bilingual Approach:** Arabic (RTL) first, English (LTR) secondary. We use logical CSS properties (`ms-`, `pe-`, `border-s-`) rather than physical directions (`ml-`, `pr-`, `border-l-`).

## 2. Typography
We use premium Google Fonts with flawless support for both Arabic and Latin scripts.

- **Primary Font (Body):** Cairo (`--font-sans`)
- **Display Font (Headings):** Alexandria (`--font-display`)
- **Monospace Font:** IBM Plex Mono (`--font-mono`)

**Typography Scale:**
- **H1:** `text-4xl` / `text-5xl` — `font-display font-bold text-balance`
- **H2:** `text-3xl` / `text-4xl` — `font-display font-semibold`
- **H3:** `text-2xl` — `font-display font-semibold`
- **Body Large:** `text-lg` — `font-sans text-foreground`
- **Body Default:** `text-base` — `font-sans text-muted-foreground`
- **Small / Muted:** `text-sm` — `font-sans text-muted-foreground`

## 3. Color Tokens
Contrast note: text/surface pairs target WCAG AA. The brand-mandated white-on-orange primary button (#FFFFFF on #F97316) is a deliberate brand choice below AA for small text — use it for large/bold labels.

| Role | Light Mode HSL | Dark Mode HSL | Usage |
|------|---------------|---------------|-------|
| `--background` | `0 0% 100%` (White #FFFFFF) | `20 14% 10%` (Deep warm slate) | App background |
| `--foreground` | `215 28% 17%` (#1F2937) | `33 30% 95%` | Main text |
| `--primary` | `25 95% 53%` (Orange #F97316) | `27 96% 61%` | Primary actions, branding |
| `--secondary` | `27 96% 61%` (Light Orange #FB923C) | `25 95% 53%` | Accent actions, donation highlights |
| `--accent` | `33 100% 96%` (Cream #FFF7ED) | `20 12% 22%` | Hover states, soft highlights |
| `--destructive`| `348 83% 47%` (Crimson) | `348 83% 55%` | Danger zones, deletions |
| `--success` | `142 76% 36%` (Green) | `142 70% 45%` | Success alerts |
| `--warning` | `38 92% 50%` (Amber) | `38 92% 55%` | Warnings |
| `--info` | `221 83% 53%` (Blue) | `221 83% 60%` | Informational notes |

## 4. Spacing, Radius, & Containers
- **Spacing Base:** `0.25rem` (Tailwind standard)
- **Radius:** `--radius: 0.5rem` (rounded-lg) for a friendly, approachable structure.
- **Container Narrow (`.container-narrow`):** `max-w-3xl` for forms, reading content.
- **Container Standard (`.container-standard`):** `max-w-5xl` for standard views, dashboards.
- **Container Wide (`.container-wide`):** `max-w-7xl` for dense data, wide tables.

## 5. UI Component Standards (shadcn)
*Do not override these manually; use standard shadcn primitive patterns with our utility classes.*

- **Buttons:** 
  - `default`: Primary Orange, slightly rounded (`rounded-lg`).
  - `secondary`: Light Orange for distinctive actions (like "Donate Now").
  - `outline`: Border matching current theme, used for secondary actions.
  - *Interaction:* subtle scale/transform on active, use `.focus-ring-standard` for keyboard nav.
- **Cards:** 
  - Standard `.card` styling. Clean border (`border-border`), subtle shadow. Padding `p-6`.
- **Inputs & Textarea:**
  - Clear borders (`border-input`), `bg-background` for field.
  - On focus, uses `--ring` (Orange, hover shade #EA580C) for the outline.
- **Select:** 
  - Must display clearly in both RTL/LTR. Use logical property padding.
- **Tables:** 
  - Use `.container-wide`. Striped rows or subtle hover highlight (`hover:bg-accent/50`).
- **Badges:** 
  - Soft background with solid text (e.g., `bg-primary/10 text-primary`).
- **Alerts:** 
  - Muted background based on status (Success, Warning, Destructive).
- **Modals (Dialog):** 
  - Max width based on context. Heavy backdrop (`bg-black/80`).
- **Loading Spinner:** 
  - Use `text-primary` for the stroke, subtle and centered.
- **Skeleton Loader:** 
  - `bg-muted` with `animate-pulse`. Rounded corners matching standard radius.
- **Empty States:** 
  - Centered content inside a card or container. Muted icon, bold title, muted description, clear primary call to action.

## 6. RTL / Accessibility Guidelines
- **Logical Properties:** Always use `marginStart` (`ms-`), `paddingInline` (`px-`), `borderStart` (`border-s-`) rather than left/right utilities.
- **Icons:** Use bidirectional icons where necessary (e.g., arrows flipped for RTL using `rtl:rotate-180`).
- **Focus States:** Every interactive element must have `.focus-ring-standard` applied or inherent via shadcn.
- **Direction Utility:** Use `.rtl-safe` and `.ltr-safe` for specific container overrides, but let the `dir="rtl"` on `<html>` drive the main flow.
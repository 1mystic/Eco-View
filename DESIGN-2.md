# TerraPulse Design System

> **Purpose:** This document is the single source of truth for the TerraPulse visual identity. It is written for AI agents, human designers, and developers to precisely reproduce the brand's look and feel across any surface — web, mobile, print, or presentation.

---

## 1. Brand Identity

| Property | Value |
|---|---|
| **Name** | TerraPulse |
| **Tagline** | Environmental Intelligence |
| **Voice** | Authoritative but approachable. Technical without jargon. Urgent but optimistic. |
| **Personality** | Precision-driven, community-oriented, quietly confident |
| **Logo** | Hexagonal shield with organic leaf/pulse motif inside — symbolizing protection + living data. Rendered as inline SVG (see `/logo` section below). |

### Logo SVG

```svg
<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
  <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" fill="#a8cc38" opacity="0.15"/>
  <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="#6d8f19" stroke-width="1.5" fill="none"/>
  <path d="M9 14c0-3 2.5-6 5-6s5 3 5 6-2.5 4-5 6c-2.5-2-5-3-5-6z" fill="#8ab420"/>
  <path d="M14 10v8M11 13l3-3 3 3" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Usage rules:**
- Always pair the icon with "TerraPulse" in `DM Sans 700` at `18px`.
- Minimum clear space: 10px around the mark.
- Do not recolor the icon. Use the green variant on light backgrounds and a white variant on dark backgrounds.

---

## 2. Color System

### 2.1 Primary — Lime/Chartreuse Green

This is the signature brand color. It conveys growth, nature, and data-driven optimism.

| Token | Hex | Usage |
|---|---|---|
| `--green-50` | `#f6f9ec` | Badge backgrounds, subtle tints |
| `--green-100` | `#e8f2cc` | Light fills, card tints |
| `--green-200` | `#d4e89e` | Borders on green elements, icon circle borders |
| `--green-300` | `#bdd966` | Hover state for primary buttons |
| `--green-400` | `#a8cc38` | **Primary brand color** — buttons, active states, featured cards, dot indicators |
| `--green-500` | `#8ab420` | Icons, stat accents, sparkline strokes |
| `--green-600` | `#6d8f19` | Icon circles, logo stroke, positive change indicators |
| `--green-700` | `#536c14` | Badge text (on green bg), dark icon fills |
| `--green-800` | `#3a4c0f` | Featured card label text |
| `--green-900` | `#222d09` | Deepest green — use sparingly for contrast |

### 2.2 Neutral — Warm Grays

All grays carry a very slight warm/yellow undertone. Never use pure `#000` or cold blue-grays.

| Token | Hex | Usage |
|---|---|---|
| `--gray-50` | `#f8f8f6` | Alternate section backgrounds, input fills |
| `--gray-100` | `#f0f0ed` | Light borders, dividers |
| `--gray-200` | `#e5e5e2` | Default card/component borders |
| `--gray-300` | `#d0d0cc` | Hover borders |
| `--gray-400` | `#a0a09a` | Disabled text, faint icons |
| `--gray-500` | `#777772` | Tertiary text, captions |
| `--gray-600` | `#555550` | Secondary body text |
| `--gray-700` | `#333330` | Heading color (alternative) |
| `--gray-800` | `#1e1e1c` | **Primary text color** |
| `--gray-900` | `#111110` | Darkest — dark section backgrounds |

### 2.3 Semantic Colors

| Color | Hex | Usage |
|---|---|---|
| **Elevated / Danger** | `#e06070` | Elevated pollution indicators, negative change arrows, alert dots |
| **Moderate / Info** | `#4da6e0` | Moderate status dots, water-related metrics |
| **Stable / Success** | `var(--green-400)` `#a8cc38` | Stable status, positive trends |

### 2.4 Backgrounds

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#ffffff` | Default page background |
| `--bg-alt` | `var(--gray-50)` `#f8f8f6` | Alternating sections (every other section) |
| `--bg-dark` | `#111110` | Dark-mode sections, footer variants |

### 2.5 Usage Rules

- **Never** use gradients as primary backgrounds. The aesthetic is flat and clean.
- **Never** use blue or purple as accent colors. Green is the sole brand hue.
- Semantic colors (red, blue) are reserved for data visualization only.
- Alternating section backgrounds (`--bg` → `--bg-alt` → `--bg`) create visual rhythm without color overload.
- Featured/CTA cards use `--green-400` as a solid fill with `--gray-900` text.

---

## 3. Typography

### 3.1 Font Stack

| Role | Family | Weight | Load URL |
|---|---|---|---|
| **Display / Headings** | `Instrument Serif` | 400 (regular + italic) | `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap` |
| **Body / UI** | `DM Sans` | 300–700, regular + italic | `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap` |

**CSS variables:**
```css
--font-display: 'Instrument Serif', Georgia, serif;
--font-body: 'DM Sans', system-ui, sans-serif;
```

### 3.2 Type Scale

| Class | Family | Size | Weight | Line-Height | Style | Letter-Spacing | Usage |
|---|---|---|---|---|---|---|---|
| `.display-xl` | Instrument Serif | `clamp(40px, 5.5vw, 72px)` | 400 | 1.08 | *italic* | -0.02em | Hero headline |
| `.display-lg` | Instrument Serif | `clamp(32px, 4vw, 52px)` | 400 | 1.12 | *italic* | -0.01em | Section headlines |
| `.display-md` | Instrument Serif | `clamp(24px, 3vw, 36px)` | 400 | 1.2 | *italic* | 0 | Sub-headlines, bento card titles |
| `.heading-lg` | DM Sans | `clamp(20px, 2vw, 26px)` | 600 | 1.3 | normal | 0 | Card titles, feature names |
| `.heading-md` | DM Sans | `clamp(17px, 1.5vw, 20px)` | 600 | 1.4 | normal | 0 | Pipeline step titles, sub-headings |
| `.heading-sm` | DM Sans | `14px` | 600 | 1.4 | normal | 0.06em | Overlines, section labels (uppercase) |
| `.body-lg` | DM Sans | `18px` | 400 | 1.65 | normal | 0 | Hero description, CTA body |
| `.body-md` | DM Sans | `15px` | 400 | 1.6 | normal | 0 | Card descriptions, feature copy |
| `.body-sm` | DM Sans | `13px` | 400 | 1.55 | normal | 0 | Captions, meta text, small labels |

### 3.3 Typography Rules

- **All display headings are italic.** This is the signature editorial feel. Never use bold serif — only `font-weight: 400; font-style: italic`.
- **Body text uses `DM Sans`** at weight 400 for body, 500 for UI labels, 600 for headings, 700 for brand name only.
- Uppercase text is reserved for `.heading-sm` overlines and metric labels. Use `letter-spacing: 0.06em–0.08em` when uppercased.
- Use `text-wrap: pretty` on headings for better line breaks.
- Maximum body text width: `560px` for centered paragraphs, `480px` for CTA contexts.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `4px` | — | Tight inner spacing (badge padding, icon gaps) |
| `8px` | — | Button group gaps, small element margins |
| `12px` | — | Card internal gaps, metric card padding |
| `16px` | — | Default component gaps, grid gaps (small) |
| `20px` | — | Bento grid gaps, nav link padding |
| `24px` | — | Card grid gaps, feature list gaps |
| `32px` | — | Card internal padding, stats grid gaps |
| `48px` | — | Section sub-content margins, footer column gaps |
| `56px` | — | Space between section heading group and content |
| `64px`–`120px` | `clamp(64px, 8vw, 120px)` | Section vertical padding (`--section-py`) |

### 4.2 Container

```css
--container-max: 1200px;
--container-px: clamp(20px, 4vw, 48px);
```

Content is centered with `max-width: 1200px` and responsive horizontal padding.

### 4.3 Grid Patterns

| Pattern | Grid Definition | Usage |
|---|---|---|
| **2-col equal** | `grid-template-columns: 1fr 1fr` | Capabilities, solutions content |
| **3-col equal** | `repeat(3, 1fr)` | Trust bar, bento, pricing, metrics |
| **4-col equal** | `repeat(4, 1fr)` | Pipeline steps, data source cards, stats |
| **Hero** | `1fr 1.1fr` | Text left, visual right (slightly wider) |
| **Footer** | `1.2fr 1fr 1fr 1fr` | Brand column wider, link columns equal |
| **Bento** | `repeat(3, 1fr)` with `span 2` | Asymmetric feature grid |

### 4.4 Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `> 1024px` | Full layout — all grids at max columns |
| `768px–1024px` | Hero stacks, bento goes 2-col, sidebar nav hides |
| `< 640px` | Everything single-column, pipeline 2-col, simplified layouts |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Nav items, small UI elements, inner cards |
| `--radius-md` | `12px` | Cards, data cards, metric cards, map containers |
| `--radius-lg` | `16px` | Main cards, bento cards, feature cards |
| `--radius-xl` | `24px` | Dashboard preview, CTA section, hero visual |
| `--radius-pill` | `999px` | Buttons, badges, nav links, input fields |

**Rules:**
- Buttons and badges are **always** pill-shaped (`border-radius: 999px`).
- Cards use `--radius-lg` (16px).
- Nested elements (maps inside cards, metric cards inside dashboard) use `--radius-md` (12px).

---

## 6. Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04)` | Active nav links, subtle lifts |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.06)` | Card hover states |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.08)` | Dashboard preview, elevated elements |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.10)` | Hero visual, modal overlays |

**Rules:**
- Shadows are subtle and never dark. Maximum opacity is `0.10`.
- Cards have **no shadow at rest** — only a `1px solid var(--border)` border. Shadow appears on `:hover`.
- Featured cards (green bg) get a colored shadow: `0 8px 32px rgba(168, 204, 56, 0.25)`.

---

## 7. Motion & Transitions

| Token | Value | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for all transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions (rare) |
| `--transition-fast` | `150ms var(--ease-out)` | Hover color changes, border changes |
| `--transition-base` | `250ms var(--ease-out)` | Card hovers, button transforms |
| `--transition-slow` | `400ms var(--ease-out)` | Accordion open/close, content reveals |

### Scroll Animations

Elements use the `.animate-in` class which starts at `opacity: 0; transform: translateY(24px)` and transitions to visible when in viewport via IntersectionObserver (`threshold: 0.15`).

**Rules:**
- No spring/bounce on scroll animations — keep them smooth and subtle.
- Button hover: `transform: translateY(-1px)` with increased shadow.
- Accordion: `max-height` transition from `0` to `300px`.

---

## 8. Component Library

### 8.1 Badge / Pill

```html
<div class="badge">
  <svg>...</svg>
  Section Label
</div>
```

- Pill shape, `1px` border, white background
- `padding: 6px 16px`, `font-size: 13px`, `font-weight: 500`
- Icon: `16×16` SVG in `--green-500`
- Variant: `.badge--green` — green-tinted background + border

**Used at:** Top of every section as a category label (e.g., "Intelligence Pipeline", "Product Features", "Community Stories").

### 8.2 Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| `.btn-primary` | `--green-400` | `--gray-900` | none | Main CTAs |
| `.btn-secondary` | `#fff` | `--text-primary` | `1px solid --border` | Secondary actions |
| `.btn-outline` | transparent | `--text-primary` | `1px solid --border` | Tertiary actions, pricing |
| `.btn-ghost` | transparent | `--text-secondary` | none | Inline text links |

Sizes: `.btn-sm` (8px 18px), default (14px 28px), `.btn-lg` (18px 36px).

All buttons are **pill-shaped**. Primary buttons have a green glow shadow.

### 8.3 Cards

| Variant | Background | Border | Hover |
|---|---|---|---|
| `.card` (default) | white | `1px solid --border` | shadow + darker border |
| `.card--flat` | `--bg-alt` | none | — |
| `.card--featured` | `--green-400` | `--green-400` | lighter green + colored shadow |

Standard padding: `32px`. Border radius: `--radius-lg` (16px).

### 8.4 Icon Circle

```html
<div class="icon-circle">
  <svg>...</svg>
</div>
```

- `48×48` circle, `--green-50` background, `1px solid --green-200` border
- Icon: `22×22` SVG in `--green-600`
- Sizes: `--sm` (36px), default (48px), `--lg` (56px)

### 8.5 Navigation

- **Fixed/sticky** with `backdrop-filter: blur(16px)` and `rgba(255,255,255,0.8)` background.
- Border-bottom appears on scroll (`1px solid var(--border)`).
- Nav links sit in a pill-shaped gray container (`--gray-50` bg).
- Active link: white bg, shadow, green dot prefix (`8×8` circle).
- CTA button in `btn-primary btn-sm` at far right.

### 8.6 Section Pattern

Every major section follows this structure:

```
Badge (centered)
↓ 20px
Display heading (centered, italic serif)
↓ 16px
Subtitle paragraph (centered, max-width: 560px)
↓ 48–56px
Content (cards, grids, etc.)
```

Alternating sections use `section--alt` for `--bg-alt` background.

### 8.7 Dashboard Preview

A faux-app mockup with:
- **Top bar:** Gray background, pill tabs (active = green fill), sync status indicator
- **Sidebar:** Logo, nav items with icons, active state has green-50 bg
- **Main area:** Title, subtitle, map visualization, metric cards below
- **Map:** Soft gradient background, dashed contour circles, colored dots (stable/moderate/elevated)
- **Metric cards:** Label (uppercase), large value, change indicator with arrow, mini sparkline

### 8.8 Testimonial Card

```
Large green quote mark (" — 48px Instrument Serif)
↓
Quote text (15px, body color)
↓ 24px
Author row: Avatar circle (40px, initials) + Name (14px 600) + Role (13px tertiary)
```

### 8.9 FAQ Accordion

- Items separated by `1px solid --border` bottom borders.
- Question: `16px, weight 500`, full-width button with `+` icon on right.
- Answer: hidden via `max-height: 0; overflow: hidden`, revealed with transition.
- `+` icon rotates `45deg` to become `×` when open.

### 8.10 Pricing Card

```
Label (13px, uppercase, tertiary)
Price (44px, Instrument Serif)
  └ period span (16px, tertiary, DM Sans)
Description (14px, tertiary)
↓ 24px
Feature list (14px, green check icon + text)
↓ 28px
Full-width button
```

Popular card: green border + "Most Popular" pill badge above (`position: absolute; top: -12px`).

### 8.11 Data Source Card

```
Icon circle (centered)
↓ 14px
Title (14px, weight 600)
Description (12px, tertiary)
```

`padding: 24px`, centered text, hover lifts with shadow.

---

## 9. Iconography

- **Style:** Outlined, `1.2–1.5px` stroke weight, round caps and joins.
- **Size:** 16×16 (inline), 22×22 (icon circles), 24×24 (feature icons).
- **Color:** `currentColor` — inherits from parent. Default `--green-600` in icon circles.
- **Format:** Inline SVG only. No icon fonts or external sprite sheets.
- **Viewbox:** Always `0 0 16 16` for small, `0 0 24 24` for medium.

**Do not use emoji.** All icons are custom SVG.

---

## 10. Data Visualization

### Map Visualization

| Element | Style |
|---|---|
| **Background** | Multi-stop gradient: `#f0faf0 → #fafaf5 → #fff5f5 → #f5f0fa` |
| **Contour lines** | Dashed circles: `1px dashed rgba(140,180,100,0.2)` |
| **Stable dots** | `--green-400` with `0.2` opacity glow |
| **Moderate dots** | `#4da6e0` with `0.2` opacity glow |
| **Elevated dots** | `#e06070` with `0.2` opacity glow |
| **Legend** | Bottom-right, `11px`, colored dots + text |

### Sparklines

- `<svg>` with `<path>` — no fills, stroke only.
- Stroke width: `1.5px`, rounded caps.
- Colors match the metric's semantic color.
- Forecast lines use `stroke-dasharray: 4 4` at `0.5` opacity.

### Metric Cards

```
[icon 12px] LABEL (10px, uppercase, 0.08em tracking, tertiary)
VALUE (24px, weight 700) + CHANGE (12px, colored arrow)
Sparkline SVG (28px height)
```

Change colors: `--up` = `#e06070` (bad), `--down` = `var(--green-600)` (good, improving).

---

## 11. Page Structure & Rhythm

The landing page follows this exact section order:

| # | Section | Background | Key Component |
|---|---|---|---|
| 1 | Navigation | Transparent → blur on scroll | Sticky nav bar |
| 2 | Hero | White | Display heading + dashboard mockup |
| 3 | Trust Bar | White (bordered) | 3-col icon + text grid |
| 4 | How It Works | White | 4-step pipeline with connecting line |
| 5 | Capabilities | Alt (gray-50) | 2-col card grid with featured card |
| 6 | Solutions | White | Sidebar tabs + visual + features |
| 7 | Bento Features | Alt (gray-50) | 3-col asymmetric grid |
| 8 | Dashboard Preview | White | Full-width app mockup |
| 9 | Data Sources | Alt (gray-50) | 4-col icon card grid |
| 10 | Impact Stats | White | 4-col stat counters |
| 11 | Pricing | Alt (gray-50) | 3-col pricing cards |
| 12 | CTA | White | Centered card with green badges |
| 13 | Testimonials | Alt (gray-50) | 3-col: heading + 2 quote cards |
| 14 | FAQ | White | Centered accordion list |
| 15 | Footer | White (bordered top) | 4-col links + newsletter |

**Rhythm rule:** Sections alternate between `white` and `gray-50` backgrounds. This creates visual breathing room without color.

---

## 12. Copywriting Style

| Principle | Example |
|---|---|
| **Headlines are poetic, italic** | "Crowdsourced Precision, Built to Protect Our Planet" |
| **Sub-headlines explain clearly** | "Each feature enhances a different part of your workflow" |
| **Feature titles are short and active** | "Smart Classification", "Automated Alerts" |
| **Descriptions are one sentence** | "Understands your environmental data across every modality." |
| **Stats use large numbers + units** | "2.4M", "98%", "12s" |
| **Avoid jargon** | Say "classifies pollution" not "performs multi-label inference" |
| **Avoid exclamation marks** | The design conveys energy; the copy stays calm |

---

## 13. Anti-Patterns (Do NOT Do)

- ❌ Gradient backgrounds on sections or cards
- ❌ Emoji anywhere in the UI
- ❌ Rounded-corner cards with colored left border accent
- ❌ Drop shadows at rest (only on hover)
- ❌ Blue or purple accent colors
- ❌ Bold serif text (serif is always weight 400, italic)
- ❌ System fonts / Inter / Roboto — always use Instrument Serif + DM Sans
- ❌ Dark mode as default — the aesthetic is light-first
- ❌ Animated gradients, glowing borders, or neon effects
- ❌ Icon fonts (Font Awesome, etc.) — use inline SVG only
- ❌ Filler content or lorem ipsum — every element earns its place
- ❌ Pure black (`#000000`) — always use `--gray-800` (`#1e1e1c`) or warmer

---

## 14. File Reference

| File | Purpose |
|---|---|
| `styles.css` | Complete CSS with all custom properties, components, and responsive rules |
| `TerraPulse Landing Page.html` | Full landing page implementation with all 15 sections |

---

## 15. Quick Start for AI Agents

To replicate this design in a new page:

1. **Load fonts:** Include both Google Font links in `<head>`.
2. **Load styles:** Link `styles.css`.
3. **Section structure:** Use `<section class="section">` with alternating `section--alt`.
4. **Container:** Wrap content in `<div class="container">`.
5. **Section header pattern:** Badge → display heading → subtitle paragraph → 48px gap → content.
6. **Cards:** Use `.card` with `.icon-circle` + `.heading-lg` + `.body-md`.
7. **Buttons:** `.btn .btn-primary` for CTAs, `.btn .btn-secondary` for secondary.
8. **Colors:** Reference CSS custom properties (`var(--green-400)`, etc.).
9. **Animations:** Add `.animate-in` class to elements that should fade in on scroll.

```html
<!-- Minimal section template -->
<section class="section section--alt">
  <div class="container">
    <div style="text-align:center;">
      <div class="badge" style="margin:0 auto;">
        <svg>...</svg>
        Section Label
      </div>
      <h2 class="display-lg" style="margin-top:20px;">Section Headline</h2>
      <p class="section-subtitle">Supporting description text.</p>
    </div>
    <!-- Content grid here -->
  </div>
</section>
```

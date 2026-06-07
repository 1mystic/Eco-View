---
name: Lumina Terra
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424936'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727a64'
  outline-variant: '#c2cab0'
  surface-tint: '#446900'
  primary: '#446900'
  on-primary: '#ffffff'
  primary-container: '#a3e635'
  on-primary-container: '#416400'
  inverse-primary: '#98da27'
  secondary: '#4e6536'
  on-secondary: '#ffffff'
  secondary-container: '#d0ecb0'
  on-secondary-container: '#546b3b'
  tertiary: '#5c5f5c'
  on-tertiary: '#ffffff'
  tertiary-container: '#d1d3cf'
  on-tertiary-container: '#585b58'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b2f746'
  primary-fixed-dim: '#98da27'
  on-primary-fixed: '#121f00'
  on-primary-fixed-variant: '#334f00'
  secondary-fixed: '#d0ecb0'
  secondary-fixed-dim: '#b4cf96'
  on-secondary-fixed: '#0e2000'
  on-secondary-fixed-variant: '#374d20'
  tertiary-fixed: '#e1e3df'
  tertiary-fixed-dim: '#c5c7c3'
  on-tertiary-fixed: '#191c1a'
  on-tertiary-fixed-variant: '#444845'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 80px
---

## Brand & Style

The brand personality is high-tech, optimistic, and precise. It targets environmental scientists, urban planners, and policy makers who require advanced ML insights delivered through an intuitive, non-intimidating interface.

The design style is a hybrid of **Minimalism** and **Glassmorphism**, specifically optimized for high-fidelity data visualization. It relies on extensive whitespace and a sophisticated "clean-room" aesthetic. Key visual markers include high-fidelity isometric 3D illustrations that serve as functional metaphors for complex data processing. The UI should feel like a futuristic laboratory: sterile but vibrant, technical but accessible.

**Visual Principles:**
- **Clarity over Clutter:** Every element must serve a functional purpose in the data narrative.
- **Optimistic Tech:** Use the lime-green accents to suggest growth and energy efficiency.
- **Precision:** Perfect alignment and consistent corner radii convey the reliability of the underlying ML models.

## Colors

The palette is anchored by "Bio-Lime," a high-vibrancy green used to highlight intelligence and action. This is balanced against a sophisticated neutral scale of whites and cool grays to maintain a professional, academic feel.

- **Primary (Bio-Lime):** Used for CTA buttons, active states, and "ML-powered" insights. It represents the "pulse" of the system.
- **Secondary (Deep Forest):** A high-contrast dark green used primarily for headings and text to ensure maximum legibility against light backgrounds.
- **Surface (Cloud):** A range of very light grays and off-whites used to differentiate container levels without heavy lines.
- **Accent (Atmosphere):** Soft, translucent blues or pinks are used sparingly in background blurs (glassmorphism) to represent environmental data types (e.g., air quality or temperature).

## Typography

The typography system uses a pairing of **Plus Jakarta Sans** for headlines and **Hanken Grotesk** for body text.

- **Plus Jakarta Sans** provides a friendly yet modern geometric structure that matches the roundedness of the UI components. 
- **Hanken Grotesk** is chosen for its exceptional legibility in data-heavy environments and technical reports.
- **Weight Strategy:** Use Bold/SemiBold for headers to create strong visual anchors. Use Regular (400) for body text to maintain a light, airy feel.
- **Scaling:** Large display headers (XL) should only be used on Desktop. Mobile headers should scale down to prevent excessive wrapping.

## Layout & Spacing

This design system utilizes a **Fluid Grid** with fixed maximum widths for content readability. 

- **Grid Model:** A 12-column grid for desktop (max-width 1440px), 8-column for tablet, and 4-column for mobile.
- **The 8px Rhythm:** All padding, margins, and component heights must be multiples of 8px to maintain a consistent mathematical scale.
- **White Space:** Generous vertical spacing (80px - 120px) between major sections is required to prevent the UI from feeling cluttered, reinforcing the "clean-tech" aesthetic.
- **Safe Zones:** Use 24px horizontal margins on mobile to ensure content doesn't hit the screen edges.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Glassmorphism** rather than traditional heavy shadows.

- **Surface Tiers:** The background is always the lightest color. Containers sit one "step" above using either a white fill or a very subtle gray border (1px #F1F5F9).
- **Glass Effects:** Use backdrop-filters (blur: 20px) on navigation bars and floating panels to maintain context of the underlying data/maps.
- **Ambient Shadows:** When shadows are necessary for interactive elements (like cards or buttons), use very soft, expanded blurs with a low opacity (e.g., `box-shadow: 0 10px 30px rgba(0,0,0,0.03)`).
- **Isometric Depth:** 3D illustrations provide the primary sense of Z-axis depth. UI elements should feel like they are floating just above these illustrations.

## Shapes

The shape language is consistently **Rounded**, reflecting the soft, approachable side of modern AI.

- **Components:** Standard buttons and input fields use a 0.5rem (8px) radius.
- **Large Containers:** Cards and main content areas use 1rem (16px) or 1.5rem (24px) for a "smooth" appearance.
- **Pills:** Use fully rounded corners (pill-shaped) for tags, chips, and "Status" indicators to distinguish them from actionable buttons.
- **Iconography:** Icons should feature rounded caps and corners to match the typography and container styles.

## Components

### Buttons
- **Primary:** Bio-Lime (#A3E635) fill with Deep Forest text. Subtle 2px bottom "press" effect or soft outer glow on hover.
- **Secondary:** Ghost style with a 1px #E2E8F0 border.
- **Tertiary:** Text-only with a Bio-Lime underline or arrow icon.

### Cards
- Pure white background with a 1px border (#F1F5F9). 
- Avoid heavy shadows. 
- Headers inside cards should use a light gray background tint to separate title from content.

### Inputs & Selects
- Background should be slightly darker than the page (e.g., #F8FAFC).
- Focus state: 2px Bio-Lime border.
- Floating labels are preferred for a modern, compact look.

### Data Chips
- Pill-shaped. Use background tints of the data they represent (e.g., light green for "Stable," light red for "Alert").

### Navigation
- Top-mounted nav bar with glassmorphism (blur) to show the underlying environmental maps or 3D visuals as the user scrolls.

### ML Feedback
- Use a dedicated "Intelligence" component: a small, floating chip with a sparkle icon and Bio-Lime gradient to indicate that a specific piece of data was generated by the ML model.
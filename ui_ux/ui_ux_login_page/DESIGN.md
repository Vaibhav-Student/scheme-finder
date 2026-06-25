---
name: Luminous Clarity
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
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#46494b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6163'
  on-tertiary-container: '#dadcde'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
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
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is centered on the concept of "Luminous Clarity"—a high-end, minimalist aesthetic that prioritizes breathability and precision. It targets professional SaaS and enterprise users who value a calm, focused environment. The emotional response is one of trust, efficiency, and quiet sophistication.

The style leans heavily into **Modern Minimalism** with a focus on:
- **Expansive Whitespace:** Using generous margins to reduce cognitive load.
- **Micro-interactions:** Subtle transitions that provide feedback without distraction.
- **Refined Precision:** Utilizing a strict grid and "Inter" for a systematic, utilitarian, yet premium feel.
- **Soft Depth:** Avoiding harsh lines in favor of light-based elevation and delicate outlines.

## Colors

The palette is anchored by a stark white background and elevated through a vibrant Indigo primary accent. This creates a high-contrast focal point for calls to action while maintaining a pristine environment.

- **Primary (#4F46E5):** A vibrant Indigo used for primary buttons, active states, and critical links.
- **Secondary (#0F172A):** A deep Slate used for high-contrast text and headers to ensure maximum legibility.
- **Tertiary (#F8FAFC):** An ultra-light gray used for subtle container backgrounds or input fields to distinguish them from the pure white page background.
- **Neutral (#64748B):** A balanced gray for secondary text, icons, and placeholder elements.

## Typography

This design system utilizes **Inter** exclusively to leverage its systematic and neutral character. The hierarchy is established through weight and optical sizing rather than decorative changes.

- **Headlines:** Use Semi-bold (600) or Bold (700) with slight negative letter-spacing to create a "compact," premium editorial look.
- **Body Text:** Standardized at 16px for optimal readability with a comfortable 1.5x line height.
- **Labels:** Set in Medium (500) weight. Small labels (e.g., overline text or captions) use uppercase with increased tracking for a modern, architectural feel.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy with a fixed maximum container width for desktop to prevent line lengths from becoming unreadable.

- **Grid Model:** 12-column layout for desktop, 8-column for tablet, and 4-column for mobile.
- **Spacing Rhythm:** Based on a 4px baseline. Most components use `md` (24px) for internal padding to maintain the "airy" feel.
- **Responsive Reflow:** For login pages, content is centered vertically and horizontally on desktop. On mobile, the container expands to 100% width with `sm` (16px) side margins.

## Elevation & Depth

Depth is communicated through **Ambient Shadows** and **Tonal Layers**. This system avoids heavy borders.

- **Shadows:** Use extremely soft, multi-layered shadows. For the primary login card, use a "Large" shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)`.
- **Surface Tiers:**
    - Level 0: Pure White (#FFFFFF) - The canvas.
    - Level 1: Off-white (#F8FAFC) - Background for subtle sections or input fields.
- **Interactions:** Hover states on cards should slightly lift the element by increasing shadow spread and decreasing Y-offset, creating a "magnetic" effect.

## Shapes

The shape language is consistently **Rounded**, providing a soft, approachable contrast to the rigorous typography.

- **Base Radius:** 0.5rem (8px) for inputs and smaller components.
- **Large Radius:** 1rem (16px) for the primary login container and modals.
- **Buttons:** Follow the base radius of 8px to maintain a professional, structured look without appearing too "bubbly."

## Components

### Buttons
- **Primary:** Solid Indigo background (#4F46E5) with white text. No border. On hover, darken to #4338CA.
- **Secondary:** Transparent background with a light gray border (#E2E8F0) and slate text.

### Input Fields
- **Default State:** Background #F8FAFC, border 1px solid #E2E8F0.
- **Focus State:** Border changes to Indigo (#4F46E5) with a subtle 3px outer glow (ring) of the same color at 10% opacity.

### Cards
- The central login card should be pure white, with a 1px soft border (#F1F5F9) to define its edge against the background if they are similar in value.

### Checkboxes & Radio Buttons
- Use the primary Indigo color for the "checked" state. The "unchecked" state should use a light gray border and white interior, keeping it minimal.

### Links
- Inline links use the primary Indigo color with a 500 weight. They do not have an underline until hovered.
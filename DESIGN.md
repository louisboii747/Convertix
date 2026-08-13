---
name: Convertix
description: A bright consumer conversion path with approachable utility and disciplined product craft.
colors:
  cobalt: "#315cf5"
  cobalt-dark: "#2147d4"
  cobalt-soft: "#e8eeff"
  violet-soft: "#f0eaff"
  mint: "#d9f4e5"
  mint-ink: "#17603c"
  danger: "#b4233d"
  danger-soft: "#fff0f2"
  ink-950: "#0d1b34"
  ink-800: "#20304e"
  ink-650: "#465575"
  ink-500: "#66728d"
  surface: "#ffffff"
  canvas: "#f7f9fc"
  line: "#dbe2ef"
  line-strong: "#c8d3e6"
  red-soft: "#ffeaed"
  green-soft: "#e5f6ed"
  orange-soft: "#fff0e1"
  slate-soft: "#eef1f6"
typography:
  display:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(2.7rem, 5.25vw, 4.15rem)"
    fontWeight: 720
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(2.25rem, 4.25vw, 3.8rem)"
    fontWeight: 720
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "21px"
    fontWeight: 680
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Figtree, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.4
rounded:
  tag: "7px"
  compact: "10px"
  control: "12px"
  inset: "14px"
  panel: "18px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "58px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cobalt-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 19px"
    height: "48px"
  converter-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-950}"
    rounded: "{rounded.panel}"
    padding: "24px"
  route-step:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-950}"
    rounded: "{rounded.control}"
    padding: "13px 19px"
    height: "84px"
  format-tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-800}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "6px 9px"
---

# Design System: Convertix

## Overview

**Creative North Star: "The Bright Conversion Path"**

Convertix is a bright consumer utility whose conversion route is visible, continuous, and reassuring. Its atmosphere is approachable rather than technical: a pale powder-blue environment supports a broad translucent-feeling canvas, nested white controls, cool hairlines, and a single cobalt path through the task.

Disciplined product craft keeps the friendliness precise. Compact display type introduces the job, the converter arrives immediately beneath it, and every border, badge, chevron, numbered circle, and status label helps a user understand what happens next. Named external products are quality benchmarks only; Convertix does not imitate their visual identities.

**Key Characteristics:**

- Bright, calm consumer utility with the conversion task in the foreground.
- One cobalt route connects file, source, target, action, and honest lifecycle status.
- Broad white surfaces sit on powder-blue canvas with cool hairlines and shallow structural shadows.
- Bricolage Grotesque supplies warm compact display moments; Figtree keeps controls and guidance plain.
- Violet supports format recognition, neutral slate marks unavailable choices, and mint appears only after confirmed success.

## Colors

The palette is mineral and cool: deep navy establishes trust, cobalt carries action and route continuity, and pale tints clarify state without making the product feel decorative.

### Primary

- **Route Cobalt:** The sole high-emphasis action color. Use it for the conversion rail, numbered progress markers, primary buttons, links, focus-adjacent cues, and active progress.
- **Deep Route Cobalt:** The hover and high-contrast companion to Route Cobalt, used for interactive text and pressed or hovered actions.
- **Powder Cobalt:** A low-emphasis field for selected, confirmed, or route-related icon backgrounds.

### Secondary

- **Format Violet:** A secondary format-family accent reserved for format symbols and badges; it never competes with the primary route.
- **Success Mint:** Confirmation color for backend-confirmed completion only. Pair the pale field with its dark mint ink.
- **Format Tints:** Red, green, and orange soft fields distinguish familiar file families while keeping chroma subordinate to cobalt.

### Tertiary

- **Honest Danger:** Failed conversion and validation messaging use the restrained danger pair; error color is explanatory, not theatrical.

### Neutral

- **Deep Navy:** Primary text, dark feature bands, and the strongest brand anchor.
- **Slate Ink:** Navigation, links, and secondary high-value copy.
- **Quiet Slate:** Explanatory text and labels; muted slate is reserved for disabled or unavailable content.
- **Mineral White:** Nested controls, converter steps, cards, and footer surfaces.
- **Powder Canvas:** The page environment behind the white working surfaces.
- **Cool Hairlines:** Default and strong dividers that define structure with one-pixel rules.
- **Unavailable Slate:** Disabled controls, unavailable format symbols, and neutral placeholders.

**The Route Color Rule.** Cobalt describes the active conversion path. Do not scatter it across decorative surfaces or use mint before the backend confirms success.

## Typography

**Display Font:** Bricolage Grotesque (with sans-serif fallback)  
**Body Font:** Figtree (with Segoe UI and sans-serif fallbacks)

**Character:** The pairing balances human warmth with straightforward utility. Bricolage Grotesque makes the product memorable through compact, slightly expressive headings; Figtree keeps every instruction, status, and control easy to scan.

### Hierarchy

- **Display** (720, fluid 43.2–66.4px, 0.98 line-height): Homepage and route-specific hero statements, balanced and normally limited to roughly 22 characters per line on wide screens.
- **Headline** (720, fluid 36–60.8px, 1.02 line-height): Major supporting sections and dark feature bands.
- **Title** (680, 21px): Detected formats, target selectors, and compact functional titles.
- **Body** (400, 16px, 1.5 line-height): Product explanations and workflow guidance; keep reading measures near 66–68 characters where a paragraph grows beyond one line.
- **Label** (650, 13px, 1.4 line-height): Route labels, status detail, format families, and small trust statements. Use sentence case rather than generic uppercase UI labels.

**The Two-Voice Rule.** Bricolage Grotesque names destinations and moments; Figtree explains actions and state. Do not use the display face for long instructional copy.

## Layout

The core page uses a centered 1240px content frame with 24px outer gutters on wide screens and 16px gutters below 720px. A compact 1440px header frame sits above it. The first viewport is deliberately tight: a centered hero with a maximum 1100px text measure gives way immediately to the wide converter, while the converter itself uses a nested 24px inset and a left route gutter for the cobalt rail.

Spacing follows an 8px-oriented rhythm with 4px optical corrections. Controls cluster at 8–24px intervals; major sections breathe at roughly 76–140px depending on viewport size. Supporting content alternates between quiet single-column bands, split editorial sections, four-column format grids, and the dark product-proof band.

Below 980px, split sections stack and four-column collections become two columns. Below 720px, the hero aligns left, the file picker becomes full width, and the conversion status collapses to two columns. Below 480px, file selection centers into one column, route controls simplify, progress and recovery actions span the full row, and format families become a single column.

**The Task-First Rule.** The converter remains the first substantial surface after the headline; supporting persuasion may follow it but must not displace it.

## Elevation & Depth

Convertix is near-flat and uses a hybrid of tonal layering, one-pixel cool rules, and two shallow structural shadows. White controls nest inside a white panel through line contrast and spacing; shadow is reserved for the converter boundary and the primary action, not repeated on every card.

### Shadow Vocabulary

- **Panel Structure** (`0 22px 54px -34px rgba(29, 51, 94, 0.35)`): A diffuse, low-contrast shadow used by the primary converter shell to separate the working surface from the canvas.
- **Action Structure** (`0 12px 24px -16px rgba(35, 75, 217, 0.72)`): A compact cobalt-tinted shadow under the primary conversion action; it strengthens slightly on hover.

**The Structural Shadow Rule.** Shadows establish task hierarchy, never decoration. Ordinary cards, format grids, FAQ rows, and route steps stay flat and rely on tonal layers or hairlines.

## Shapes

The form language is gently rectilinear: broad product panels use 18px corners, inset regions use 14px, controls use 12px, compact icon buttons use 10px, and tags use 7px. Circles are purposeful markers for route numbers, confirmation, and status—not a general container style. Borders are cool one-pixel rules; the file target alone uses a 1.5px dashed outline to preserve the familiar drop-zone affordance.

**The Nested Radius Rule.** Radius decreases as surfaces nest: panel, inset, control, compact element. Avoid unrelated pill shapes except for true circular markers or a deliberately capsule-like status primitive.

## Components

### Buttons

- **Shape:** Gently curved controls with a 12px radius; icon-only actions tighten to 10px.
- **Primary:** A full-width 58px cobalt action with white text, a centered label, a leading conversion icon, a trailing arrow, and the compact action shadow.
- **Hover / Focus:** Hover deepens cobalt, lifts by 1px, and advances the trailing arrow by 3px. Keyboard focus uses a visible 3px soft-blue outline with a 3px offset. Active returns to the resting plane; reduced motion collapses transitions.
- **Secondary:** A 48px white button with a light cobalt border and deep-cobalt text. Hover uses the powder-cobalt field and a 1px lift.
- **Disabled:** Neutral slate replaces cobalt, text drops to muted slate, shadow disappears, and the cursor communicates unavailability.

### Chips

- **Style:** Format tags are compact white rectangles with a cool hairline, 7px corners, and 13px semibold text. Format symbols use soft family tints inside 10px square containers.
- **State:** Cobalt indicates an active route or detection; violet, red, green, and orange distinguish formats; slate indicates unavailable or unknown.

### Cards / Containers

- **Corner Style:** 18px for the primary converter, 14px for inset collections, and 12px for route and status rows.
- **Background:** Mineral-white working surfaces on the powder canvas; the feature-proof band inverts to deep navy.
- **Shadow Strategy:** Only the converter shell receives the panel shadow; nested rows stay flat.
- **Border:** One-pixel cool hairlines, strengthened only at important container boundaries.
- **Internal Padding:** 24px is the normal panel inset, with 13–19px inside functional rows and 22–30px in the file target.

### Inputs / Fields

- **Style:** The native file input is visually hidden behind a clear button, while the target select is transparent inside the route step with a persistent chevron. The drop zone uses a dashed cobalt-tinted boundary and a lightly tinted file icon tile.
- **Focus:** All interactive elements retain the global 3px soft-blue focus outline. Dragging shifts the file field to powder cobalt and strengthens its internal boundary.
- **Error / Disabled:** Failed states use the danger field and border. Disabled selects and submit actions use neutral slate and remain visibly distinct from success or loading.

### Navigation

Navigation is compact, quiet, and secondary to the converter. The 14px semibold links sit in the header opposite the 24px display wordmark; a one-pixel underline draws from right to left on hover or keyboard focus. On small screens the middle route hides to preserve a calm header while the remaining links stay available.

### Conversion Route

The signature component joins the drop zone, detected source, target choice, primary action, and lifecycle status into one continuous cobalt rail. Numbered circles anchor each decision, repeated format symbols support recognition, and the rail fill advances only when the corresponding application state advances. Status lives inside the same surface with a plain-language title, supporting detail, progress treatment, and recovery or download action where real behavior exists.

### FAQ Row

FAQ items remain flat between strong hairlines. The 18px Bricolage summary pairs with a cobalt plus that rotates into a minus when open; body copy expands beneath it without introducing a separate card.

**The Honest State Rule.** Every color, marker, and motion in the conversion route corresponds to real state. Never simulate upload, completion, availability, or download readiness.

## Do's and Don'ts

### Do:

- **Do** keep the conversion route continuous, with the file target immediately above source, target, action, and status.
- **Do** use cobalt for primary action and route continuity, violet and other soft tints for format recognition, slate for unavailable choices, and mint only for confirmed success.
- **Do** preserve visible keyboard focus, native file-picker access, semantic status announcements, and reduced-motion behavior.
- **Do** alternate broad quiet fields with denser functional bands while keeping the 1240px content frame and responsive collapse rules.
- **Do** use shallow structural shadows selectively and let cool hairlines carry most separation.

### Don't:

- **Don't** turn the converter into a collection of disconnected cards or move marketing content ahead of the task.
- **Don't** imitate named benchmark products, fabricate testimonials or guarantees, or introduce glossy gradients and decorative visual noise.
- **Don't** use mint for readiness, selection, or aspiration; it means confirmed success.
- **Don't** hide unavailable routes behind optimistic labels or motion that suggests backend progress which has not occurred.
- **Don't** replace the Bricolage Grotesque and Figtree hierarchy with a single generic voice or use display type for long body copy.

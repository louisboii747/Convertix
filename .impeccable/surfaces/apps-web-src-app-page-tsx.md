---
version: 1
slug: "apps-web-src-app-page-tsx"
primary_target: "apps/web/src/app/page.tsx"
related_targets: ["apps/web/src/app/convert/[conversion]/page.tsx"]
---

## Scope and mode

- Surface: public homepage and reusable `/convert/[pair]` conversion pages.
- Visitor mode: Operate. The task must lead; supporting persuasion follows.

## Audience, job, and action

- An ordinary web user with an immediate file-conversion need.
- Primary job: select a file, confirm its detected source format, choose a compatible destination, and start a conversion without an account.
- Primary action: Convert file.

## Proof and constraints

- The interface may demonstrate only centrally enabled conversion pairs.
- Browser upload and download plumbing is incomplete; the UI must expose honest states through a service boundary without simulating completion.
- Accessibility, mobile use, keyboard operation, reduced motion, and plain-language status are launch requirements.

## Chosen direction

- Bright, familiar consumer converter executed with exceptional typography, spacing, and interaction craft; no visual imitation of the named benchmark products.
- Approved composition: Single Flow. Its durable commitments are captured in this brief and `DESIGN.md`; generated workshop imagery is intentionally excluded from the repository.
- One continuous conversion surface connects file selection, detected source, target selection, primary action, and lifecycle status with a thin cobalt route line.
- Memorable moment: the route line and status marker advance through the same surface as the backend-confirmed job state changes.

## Implementation fidelity

| Ingredient | Commitment | Medium |
| --- | --- | --- |
| Header | Compact wordmark and three quiet in-page routes | Semantic HTML/CSS |
| Headline | Compact, centered, warm humanist grotesk with converter immediately below | Semantic HTML/CSS |
| File area | Full-width familiar drop/select region with selected-file metadata and removal/replacement | Semantic HTML/CSS/SVG icons |
| Route rail | Source and target rows physically joined by a thin cobalt step line | Semantic HTML/CSS |
| Primary action | Full-width cobalt action integrated into the route sequence | Semantic button/CSS |
| Lifecycle | One modelled status region with accessible live announcements and determinate/indeterminate progress treatment | React state/CSS |
| Supporting content | Popular enabled routes, honest product benefits, configured format families, FAQ, and footer in alternating dense and quiet bands | Semantic HTML/CSS |

Component grammar: 14-18px primary corners, 10-12px compact corners, 1px cool-gray rules, near-flat elevation, 48-56px controls. Type ramp: 52-60px homepage display, 32-40px section headings, 18px lead, 16px body, 13-14px labels. Palette: mineral white, deep navy, cobalt, pale sky, and success mint.

## Unresolved

- Production upload/download URLs, polling/status endpoints, and guaranteed retention behavior remain backend-dependent.

---
version: 1
slug: "src-main-java-uk-convertix-app-ui-convertixapp-kt"
primary_target: "apps/android/app/src/main/java/uk/convertix/app/ui/ConvertixApp.kt"
related_targets: ["apps/android/app/src/main/java/uk/convertix/app/ui/screens/ConvertScreen.kt","apps/android/app/src/main/java/uk/convertix/app/ui/screens/ToolsScreen.kt","apps/android/app/src/main/java/uk/convertix/app/ui/screens/ActivityScreen.kt"]
---

# Android application foundation

- **Mode and scope:** Operate; native Kotlin/Compose foundation for phones and tablets.
- **Audience and job:** A person with a file on their Android device who wants to choose it, select an output, and understand the next step immediately.
- **Primary task:** Open Android's document picker, retain a visible file summary, choose an output format, and stop at an honest disconnected-service state.
- **Constraints:** No AWS calls, fake progress, authentication, or conversion claims. Preserve Convertix's bright task-first identity, accessible touch targets, dark theme, and native system behavior.
- **Chosen direction:** Focused route. The upload target leads directly into three connected steps. Bottom navigation becomes a rail at 840dp, where the file target and route form a two-pane workbench.
- **Approved composition:** `.impeccable/mocks/android-foundation-a-focused-route.png`.
- **Memorable moment:** The cobalt route marker turns the generic file picker into one continuous, legible conversion path.
- **Component grammar:** 18dp task surfaces, 12-14dp nested controls, 1-1.5dp cool lines, cobalt-only active emphasis, no decorative elevation.
- **Implementation inventory:** Brand mark and route geometry are authored Compose canvas; controls and navigation are semantic Material 3; icons use Material Icons; all text remains native Compose text.
- **Future seams:** Conversion service, share intent, scanner, local tools, persistent activity, and auth can attach behind the stable destinations without restructuring the shell.

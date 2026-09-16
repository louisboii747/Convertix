# Convertix Android app

Native Kotlin + Jetpack Compose application for Android phones and tablets.

Open this `apps/android` directory as the project root in Android Studio.

## Current UI foundation

- Task-first Convert screen with Android's native document picker.
- Output-format selection and honest disabled conversion state.
- Phone bottom navigation and tablet navigation rail.
- Expandable Tools and Activity destinations.
- Convertix light and dark Material 3 themes.
- Phone and tablet Compose previews in `ConvertScreen.kt`.

The AWS conversion path, authentication, persistence, and history data are intentionally not connected yet. The UI does not simulate upload or conversion progress.

## Local build

Android Studio normally writes `local.properties` for the installed Android SDK. From this directory, the debug build can then be verified with:

```powershell
.\gradlew.bat :app:assembleDebug
```

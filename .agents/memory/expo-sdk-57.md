---
name: Expo SDK 57 compatibility
description: Non-obvious SDK 57 upgrade and device-validation constraints for Lofte Mobile.
---

Keep the package-local Expo CLI aligned with Expo SDK 57, and configure the splash screen through the `expo-splash-screen` plugin rather than the removed top-level `splash` field.

**Why:** Expo Doctor continued to apply SDK 57 schema validation only after the local CLI was aligned, then rejected the legacy top-level splash field. Moving the same settings into the plugin resolved the schema check. Lofte was subsequently confirmed working in stock Expo Go 57 on a physical Android device.

**How to apply:** When changing Expo dependencies or app config, run Expo's install check and Expo Doctor with the package-local CLI. Preserve the plugin-based splash configuration and treat physical iOS Expo Go validation as not yet performed.
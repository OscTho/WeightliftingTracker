---
name: Mockup preview E2E
description: Routing and interaction timing constraints for browser checks of the design preview artifact
---

Playwright checks for the design preview should navigate through the complete `/__mockup/...` artifact route rather than relying on a root-relative preview path. The preview also smooth-scrolls to the current day after mounting, so checks should wait for that target to be in the viewport and explicitly scroll interactive controls into view before clicking them.

**Why:** The Vite base path is not automatically preserved when a test uses a leading-slash URL, and the mount-time smooth scroll can otherwise intercept the first interaction even though the component handler is working.

**How to apply:** Keep the artifact prefix in preview URLs and use viewport-aware waits before asserting state changes on controls.
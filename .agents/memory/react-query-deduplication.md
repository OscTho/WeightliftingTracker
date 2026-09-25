---
name: React Query production deduplication
description: Why the web bundle must share one React Query module across the app and workspace API client.
---

Keep React Query deduplicated in the web app's Vite dependency resolution whenever the app consumes hooks from the shared workspace API client.

**Why:** The workspace can contain multiple peer-resolved React Query installations tied to different React versions. Production bundling can include both, causing generated hooks to read a different context from the app's provider and crash with “No QueryClient set” even though the provider is present.

**How to apply:** When changing Vite resolution, React versions, pnpm catalogs, or the shared API client's dependency declarations, validate the built production bundle in a browser and preserve a single React Query module instance.
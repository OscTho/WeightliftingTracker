---
name: Expo React typings
description: Compatibility constraint between Expo SDK 54, React type packages, and react-native-gesture-handler
---

Expo SDK 54 expects the React 19.1 type family, while the workspace web/design packages use the pinned React 19.2 types. If the mobile package consumes the workspace React 19.2 types, `GestureHandlerRootView` can lose its inherited `children` and `style` props during JSX checking; keep the compatibility boundary localized to that wrapper rather than changing global React typings.

**Why:** The gesture-handler declaration extends React Native `ViewProps` with `PropsWithChildren`, but React 19.2's interaction with the Expo/RN declarations produces a false missing-props error. The native component and Expo bundles still work when the props are typed at the boundary.

**How to apply:** When changing mobile React type versions or the root provider tree, preserve the typed gesture-handler wrapper boundary and verify both `pnpm --filter @workspace/lofte-mobile run typecheck` and the Expo iOS/Android bundle build.
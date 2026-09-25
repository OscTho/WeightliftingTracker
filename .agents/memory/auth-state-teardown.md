---
name: Auth state teardown
description: Prevent stale authenticated state from overriding navigation after destructive account transitions.
---

After a transition that permanently invalidates the current session, clear user-scoped client state and load the authentication page as a fresh document rather than relying only on SPA navigation.

**Why:** Clearing the query cache does not synchronously discard the successful value held by an active session observer. If SPA navigation renders the sign-in route first, that observer can redirect the user back into the app.

**How to apply:** Use this for successful account deletion and similar irreversible auth transitions. Keep ordinary navigation inside the SPA when the current session remains valid.
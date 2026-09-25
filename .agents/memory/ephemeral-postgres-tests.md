---
name: Ephemeral PostgreSQL tests
description: Starting isolated temporary PostgreSQL clusters in this Replit workspace.
---

Set the PostgreSQL Unix socket directory explicitly to a writable location inside the temporary cluster directory.

**Why:** This environment does not provide the default `/run/postgresql` socket directory, so a local cluster can exit during startup even when `initdb` succeeds.

**How to apply:** For isolated integration tests, initialize a disposable data directory, start PostgreSQL with `-k <data-directory>`, and remove that directory after the owning test process exits.
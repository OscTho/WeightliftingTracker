---
name: GitHub workflow push permission
description: Permission boundary when syncing Lofte commits that add or update GitHub Actions workflows.
---

GitHub repository write/admin access does not necessarily allow a token to push a commit that adds or changes a file under `.github/workflows`. A classic personal access token needs the `workflow` scope in addition to `repo`; a fine-grained token needs repository Contents write and Workflows write. An OAuth integration's granted scope set may lack `workflow` even when its API can create Git objects.

**Why:** GitHub can accept the objects but reject the branch update, or explicitly reject a Git push, when workflow-specific permission is absent. Retrying the same credential or bypassing the workflow file does not deliver the intended tree.

**How to apply:** Before syncing a tree with workflow changes, check the effective token permission and use a repository-limited credential provided through the secure Secrets flow if the connected integration cannot request the needed grant. Keep pushes non-force and verify the resulting remote ref and tree.
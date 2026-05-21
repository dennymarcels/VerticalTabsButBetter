# Changelog

All notable changes to this project will be documented in this file.

## [0.0.3] - 2026-05-21
### Bug Fixes
- Sort root folders alphabetically in the `Vertical Tabs But Better` Explorer view. Previously root folders followed the order in which open files were encountered; now they are ordered by label for a predictable, alphabetical listing.
- Adjust `publish_new_version` script to read the release `version` from `package.json` (the script now requires you to bump and commit the version manually before running). The script will abort if the working tree is dirty or if the tag `v<version>` already exists. Controlled by environment variables:
  - `CREATE_VSIX=true` creates a local `.vsix` during the publish step.
  - `VSCE_PAT` publishes directly via `vsce` (not recommended; prefer CI).

### Documentation
- Added `DEV.md` with developer packaging and publishing instructions and examples.

---

For older changes, see previous commits in the repository history.

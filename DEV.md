# Developer: Packaging and Publishing

This file contains developer-facing instructions for packaging and publishing the extension.

Prerequisites
- Commit all your changes before running the publishing script — the script does not create commits.
- Ensure `package.json`'s `publisher` is set correctly (the Marketplace publisher).

## Local packaging

Create a `.vsix` package locally:

```bash
npm run package:vsix
# or equivalently
npx -y vsce package
```

## Publishing a new version (recommended via `npm` script)


This repository includes a helper script `publish_new_version` that:
- reads `version` from `package.json` (you MUST bump and commit this manually before running)
- creates an annotated git tag `v<version>` and pushes it to `origin`
- optionally creates a `.vsix` package locally if `CREATE_VSIX=true` is set in the environment
- optionally publishes via `vsce` if `VSCE_PAT` is set in the environment

Usage (recommended):

```bash
# ensure your changes are committed and package.json contains the release version
git status --porcelain

# run the helper via npm (do not pass a version)
npm run publish_new_version
```

Control the optional behaviors with environment variables:

- Create a local `.vsix` when running the helper:

```bash
CREATE_VSIX=true npm run publish_new_version
```

- Publish directly from the machine (less recommended than CI):

```bash
VSCE_PAT=your_token_here npm run publish_new_version
```

The script will abort if:
- the working tree has uncommitted changes, or
- the tag `v<version>` already exists (prevents duplicate releases)


CI publishing

There is a GitHub Actions workflow at `.github/workflows/publish.yml` that publishes when a tag matching `v*` is pushed. To allow CI to publish to the Marketplace, add the secret `VSCE_PAT` (your VSCE Personal Access Token) in the repository Settings → Secrets → Actions.

Notes
- The script will abort if there are uncommitted changes — this is intentional to avoid mismatched source and tags.
- `npm run publish_new_version` only modifies `package.json` locally and pushes the tag; you still control commits and the release commit if desired.

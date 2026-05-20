# Vertical Tabs But Better

Bring the ergonomics of modern browser vertical tabs to VS Code without replacing the native horizontal tabs. `Vertical Tabs But Better` adds a view to the Explorer that shows only the files currently open in the editor, organized by directory to make navigation, context, and quick closing easier.

## What the extension does

- Keeps VS Code's horizontal tabs exactly as they are.
- Adds a vertical alternative focused only on open tabs.
- Shows files in their real project context, nested inside their folders.
- Makes it easier to open, locate, and close files without relying on the horizontal tab strip.

## Features

- An always-available Explorer view called **Vertical Tabs But Better**.
- Lists only the files that are actually open in the editor, using `vscode.window.tabGroups` to reflect the visible tabs.
- Groups files by folder and workspace root, so each file appears in its proper directory.
- Compacts single-folder chains in the same style as Explorer. Example: `folder1/folder2/file` can appear as `folder1/folder2` > `file` when the chain has only one visible branch.
- Uses Explorer-like icons and appearance through `resourceUri`.
- Automatically expands the ancestor paths of open files, opening only the branches that matter.
- View title bar buttons: **Expand All** and **Collapse All**.
- Inline actions: an `X` icon appears next to files and folders. Closing a file closes its corresponding tab; closing a folder closes every open tab inside that folder and its subfolders.
- Immediate updates: the view reflects the current set of open tabs, and closed tabs are removed from the view correctly.

## How to use

1. Open the Explorer and select the **Vertical Tabs But Better** view.
2. Click any file to open it in the editor.
3. Use the inline `X` to close a file or close the entire group of files inside a folder.
4. Use the title bar buttons to expand or collapse the tree quickly.

## Limitations and intent

- The extension does not remove or replace VS Code's native horizontal tabs.
- Its goal is to replicate the convenience of modern browser vertical tabs using an approach that fits naturally into the Explorer.
- The view shows only the subset of files currently open in the editor, so the folder structure is a filtered slice of the project rather than the full workspace tree.

## Local packaging

To generate the `.vsix` locally, run this from the project root:

```bash
npx -y vsce package
```

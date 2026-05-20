
const vscode = require('vscode');
const path = require('path');

class TreeNode {
  constructor(label, uri, isFolder = false) {
    this.label = label;
    this.uri = uri;
    this.isFolder = isFolder;
    this.children = [];
  }
}

class OpenEditorsProvider {
  /** @param {vscode.ExtensionContext} context */
  constructor(context) {
    this.context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.enabled = false;
    this._tree = [];
    this._expanded = new Set();

    this._registerListeners();
  }

  _registerListeners() {
    vscode.workspace.onDidOpenTextDocument(() => this.refresh(), this, this.context.subscriptions);
    vscode.workspace.onDidCloseTextDocument(() => this.refresh(), this, this.context.subscriptions);
    if (vscode.window.tabGroups && typeof vscode.window.tabGroups.onDidChangeTabs === 'function') {
      vscode.window.tabGroups.onDidChangeTabs(() => this.refresh(), this, this.context.subscriptions);
    }
    if (vscode.window.tabGroups && typeof vscode.window.tabGroups.onDidChangeTabGroups === 'function') {
      vscode.window.tabGroups.onDidChangeTabGroups(() => this.refresh(), this, this.context.subscriptions);
    }
  }

  refresh() {
    this._buildTree();
    this._markOpenFileAncestorsExpanded();
    this._onDidChangeTreeData.fire();
  }

  _getOpenFilePaths() {
    if (vscode.window.tabGroups && Array.isArray(vscode.window.tabGroups.all)) {
      const tabPaths = vscode.window.tabGroups.all
        .flatMap(group => group.tabs || [])
        .map(tab => this._getUriFromTabInput(tab.input))
        .filter(uri => uri && uri.scheme === 'file')
        .map(uri => uri.fsPath);

      return [...new Set(tabPaths)];
    }

    return vscode.workspace.textDocuments
      .filter(document => document.uri && document.uri.scheme === 'file')
      .map(document => document.uri.fsPath)
      .filter((value, index, all) => all.indexOf(value) === index);
  }

  _getOpenTabsWithUris() {
    if (!vscode.window.tabGroups || !Array.isArray(vscode.window.tabGroups.all)) {
      return [];
    }

    return vscode.window.tabGroups.all.flatMap(group =>
      (group.tabs || [])
        .map(tab => ({ tab, uri: this._getUriFromTabInput(tab.input) }))
        .filter(entry => entry.uri && entry.uri.scheme === 'file')
    );
  }

  _getUriFromTabInput(input) {
    if (!input || typeof input !== 'object') {
      return undefined;
    }

    if ('uri' in input && input.uri instanceof vscode.Uri) {
      return input.uri;
    }

    if ('modified' in input && input.modified instanceof vscode.Uri) {
      return input.modified;
    }

    if ('original' in input && input.original instanceof vscode.Uri) {
      return input.original;
    }

    return undefined;
  }

  _buildTree() {
    if (!this.enabled) {
      this._tree = [];
      return;
    }

    const docs = this._getOpenFilePaths();

    const rootsMap = new Map();

    docs.forEach(fsPath => {
      const uri = vscode.Uri.file(fsPath);
      const wf = vscode.workspace.getWorkspaceFolder(uri);
      const rootKey = wf ? wf.uri.fsPath : path.parse(fsPath).root;
      const relPath = wf ? path.relative(wf.uri.fsPath, fsPath) : path.relative(rootKey, fsPath);
      const segments = relPath.split(path.sep).filter(Boolean);

      if (!rootsMap.has(rootKey)) {
        const rootUri = wf ? wf.uri : vscode.Uri.file(rootKey);
        rootsMap.set(rootKey, new TreeNode(wf ? wf.name : rootKey, rootUri, true));
      }

      let parent = rootsMap.get(rootKey);
      let currentPath = wf ? wf.uri.fsPath : rootKey;

      segments.forEach((segment, idx) => {
        currentPath = path.join(currentPath, segment);
        const existing = parent.children.find(c => c.label === segment && c.isFolder);
        if (idx < segments.length - 1) {
          // folder
          if (existing) {
            parent = existing;
          } else {
            const node = new TreeNode(segment, vscode.Uri.file(currentPath), true);
            parent.children.push(node);
            parent = node;
          }
        } else {
          // file (leaf)
          const fileNode = new TreeNode(segment, vscode.Uri.file(currentPath), false);
          parent.children.push(fileNode);
        }
      });
    });

    // Convert rootsMap to array, sort children
    const roots = Array.from(rootsMap.values()).map(root => this._compactFolders(this._sortTree(root), true));
    this._tree = roots;
  }

  _sortTree(node) {
    if (node.children && node.children.length) {
      node.children.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.label.localeCompare(b.label);
        return a.isFolder ? -1 : 1;
      });
      node.children = node.children.map(c => this._sortTree(c));
    }
    return node;
  }

  _compactFolders(node, isRoot = false) {
    if (!node || !node.isFolder || !node.children || !node.children.length) {
      return node;
    }

    node.children = node.children.map(child => this._compactFolders(child, false));

    if (isRoot) {
      return node;
    }

    while (node.children.length === 1 && node.children[0].isFolder) {
      const onlyChild = node.children[0];
      node.label = path.join(node.label, onlyChild.label).replace(/\\/g, '/');
      node.uri = onlyChild.uri;
      node.children = onlyChild.children;
    }

    return node;
  }

  getTreeItem(node) {
    if (!node) return null;
    if (node.isFolder) {
      const expanded = this._expanded.has(node.uri.fsPath);
      const ti = new vscode.TreeItem(node.label, expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
      ti.id = `${node.uri.toString()}::${expanded ? 'expanded' : 'collapsed'}`;
      ti.resourceUri = node.uri;
      ti.contextValue = 'folder';
      return ti;
    }

    const ti = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
    ti.id = node.uri.toString();
    ti.resourceUri = node.uri;
    ti.command = { command: 'vscode.open', title: 'Open File', arguments: [node.uri] };
    ti.contextValue = 'file';
    return ti;
  }

  getChildren(element) {
    if (!this.enabled) return [];
    if (!this._tree.length) this._buildTree();
    if (!element) {
      return this._tree;
    }
    return element.children || [];
  }

  _pruneExpandedFolders() {
    const availablePaths = new Set();

    const collect = nodes => {
      for (const node of nodes) {
        if (node.isFolder && node.uri && node.uri.fsPath) {
          availablePaths.add(node.uri.fsPath);
        }
        if (node.children && node.children.length) {
          collect(node.children);
        }
      }
    };

    collect(this._tree);
    this._expanded = new Set([...this._expanded].filter(fsPath => availablePaths.has(fsPath)));
  }

  _markOpenFileAncestorsExpanded() {
    if (!this._tree.length) {
      this._buildTree();
    }

    this._pruneExpandedFolders();

    for (const fsPath of this._getOpenFilePaths()) {
      const uri = vscode.Uri.file(fsPath);
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      const rootPath = workspaceFolder ? workspaceFolder.uri.fsPath : path.parse(fsPath).root;
      const relativePath = workspaceFolder ? path.relative(workspaceFolder.uri.fsPath, fsPath) : path.relative(rootPath, fsPath);
      const segments = relativePath.split(path.sep).filter(Boolean);

      this._expanded.add(rootPath);

      let currentPath = rootPath;
      for (let index = 0; index < segments.length - 1; index += 1) {
        currentPath = path.join(currentPath, segments[index]);
        this._expanded.add(currentPath);
      }
    }
  }

  expandAllFolders() {
    if (!this._tree.length) {
      this._buildTree();
    }

    const collect = nodes => {
      for (const node of nodes) {
        if (node.isFolder && node.uri && node.uri.fsPath) {
          this._expanded.add(node.uri.fsPath);
        }
        if (node.children && node.children.length) {
          collect(node.children);
        }
      }
    };

    collect(this._tree);
    this._onDidChangeTreeData.fire();
  }

  collapseAllFolders() {
    this._expanded.clear();
    this._onDidChangeTreeData.fire();
  }

  async closeNode(node) {
    if (!node || !node.uri || node.uri.scheme !== 'file') {
      return;
    }

    const openTabs = this._getOpenTabsWithUris();
    const tabsToClose = node.isFolder
      ? openTabs
          .filter(entry => this._isUriInsideFolder(entry.uri, node.uri))
          .map(entry => entry.tab)
      : openTabs
          .filter(entry => entry.uri.fsPath === node.uri.fsPath)
          .map(entry => entry.tab);

    if (!tabsToClose.length) {
      return;
    }

    await vscode.window.tabGroups.close(tabsToClose);
  }

  _isUriInsideFolder(childUri, folderUri) {
    if (!childUri || !folderUri) {
      return false;
    }

    const folderPath = folderUri.fsPath;
    return childUri.fsPath === folderPath || childUri.fsPath.startsWith(`${folderPath}${path.sep}`);
  }

  setFolderExpanded(node, expanded) {
    if (!node || !node.uri || !node.uri.fsPath) {
      return;
    }

    if (expanded) {
      this._expanded.add(node.uri.fsPath);
      return;
    }

    this._expanded.delete(node.uri.fsPath);
  }
}

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const provider = new OpenEditorsProvider(context);

  const treeView = vscode.window.createTreeView('verticalTabsButBetter', { treeDataProvider: provider });
  context.subscriptions.push(treeView);

  // Provider is always enabled: the view shows currently open editors
  provider.enabled = true;
  provider.refresh();

  const expandCommand = vscode.commands.registerCommand('verticalTabsButBetter.expandAll', async () => {
    try {
      console.log('[VerticalTabsButBetter] expandAll invoked');
      // expand all folders by setting provider state
      provider.expandAllFolders();
      console.log('[VerticalTabsButBetter] expandAll completed');
    } catch (err) {
      console.error('expandAll error', err);
    }
  });

  const collapseCommand = vscode.commands.registerCommand('verticalTabsButBetter.collapseAll', async () => {
    try {
      console.log('[VerticalTabsButBetter] collapseAll invoked');
      provider.collapseAllFolders();
      console.log('[VerticalTabsButBetter] collapseAll completed');
    } catch (err) {
      console.error('collapseAll error', err);
    }
  });

  const closeNodeCommand = vscode.commands.registerCommand('verticalTabsButBetter.closeNode', async node => {
    try {
      await provider.closeNode(node);
      provider.refresh();
    } catch (error) {
      console.error('[VerticalTabsButBetter] closeNode error', error);
    }
  });

  context.subscriptions.push(expandCommand, collapseCommand, closeNodeCommand);

  treeView.onDidExpandElement(event => {
    provider.setFolderExpanded(event.element, true);
  }, null, context.subscriptions);

  treeView.onDidCollapseElement(event => {
    provider.setFolderExpanded(event.element, false);
  }, null, context.subscriptions);

  // Expand the view by default when activated (set provider expanded state)
  setTimeout(() => {
    try {
      provider.refresh();
    } catch (e) {
      console.error('[VerticalTabsButBetter] auto expand error', e);
    }
  }, 200);
}

function deactivate() {}

module.exports = { activate, deactivate };

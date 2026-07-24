// Copyright © 2025, SAS Institute Inc., Cary, NC, USA.  All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FileType, Uri, workspace } from "vscode";

import { v4 } from "uuid";

import { onRunError } from "../../commands/run";
import {
  Messages,
  SAS_SERVER_ROOT_FOLDER,
  SAS_SERVER_ROOT_FOLDERS,
  SERVER_FOLDER_ID,
} from "../../components/ContentNavigator/const";
import {
  ContentAdapter,
  ContentItem,
  RootFolderMap,
} from "../../components/ContentNavigator/types";
import {
  ContextMenuAction,
  ContextMenuProvider,
  convertStaticFolderToContentItem,
  createStaticFolder,
  homeDirectoryNameAndType,
  sortedContentItems,
} from "../../components/ContentNavigator/utils";
import { getGlobalStorageUri } from "../../components/ExtensionContext";
import { ProfileWithFileRootOptions } from "../../components/profile";
import { getSasServerUri } from "../rest/util";
import { executeRawCode, runCode } from "./CodeRunner";

interface SaspyFileItem {
  name: string;
  isDir: boolean;
  uri: string;
  parentUri: string;
  size: number;
  modified: string;
  created: string;
}

class SaspyServerAdapter implements ContentAdapter {
  protected sessionId: string;
  private rootFolders: RootFolderMap;
  private contextMenuProvider: ContextMenuProvider;

  public constructor(
    protected readonly fileNavigationCustomRootPath: ProfileWithFileRootOptions["fileNavigationCustomRootPath"],
    protected readonly fileNavigationRoot: ProfileWithFileRootOptions["fileNavigationRoot"],
  ) {
    this.rootFolders = {};
    this.contextMenuProvider = new ContextMenuProvider(
      [
        ContextMenuAction.CreateChild,
        ContextMenuAction.Delete,
        ContextMenuAction.Update,
        ContextMenuAction.CopyPath,
        ContextMenuAction.AllowDownload,
      ],
      {
        [ContextMenuAction.CopyPath]: (item) => item.id !== SERVER_FOLDER_ID,
      },
    );
  }

  public async addChildItem(): Promise<boolean> {
    throw new Error("Method not implemented");
  }
  public async addItemToFavorites(): Promise<boolean> {
    throw new Error("Method not implemented");
  }
  public removeItemFromFavorites(): Promise<boolean> {
    throw new Error("Method not implemented");
  }
  public getRootFolder(): ContentItem | undefined {
    return undefined;
  }

  public async getParentOfItem(
    item: ContentItem,
  ): Promise<ContentItem | undefined> {
    if (!item.parentFolderUri) {
      return undefined;
    }
    return await this.getItemAtPath(item.parentFolderUri);
  }

  public async getFolderPathForItem(): Promise<string> {
    return "";
  }

  public async connect(): Promise<void> {
    return;
  }

  public connected(): boolean {
    return true;
  }

  public async createNewFolder(
    parentItem: ContentItem,
    folderName: string,
  ): Promise<ContentItem | undefined> {
    try {
      const sasCode = `
        %let rc = %sysfunc(dcreate(${folderName}, ${parentItem.uri}));
        %put <CREATEDIR>&rc</CREATEDIR>;
      `;
      const output = await this.runSASCode(sasCode, "<CREATEDIR>", "</CREATEDIR>");
      const rc = output.replace(/[^0-9]/g, "");
      if (rc === "0") {
        return undefined;
      }

      const sep = await this.getDirectorySeparator();
      const newUri = `${parentItem.uri}${sep}${folderName}`;
      return this.createContentItem({
        name: folderName,
        isDir: true,
        uri: newUri,
        parentUri: parentItem.uri,
        size: 0,
        modified: "",
        created: "",
      });
    } catch (error) {
      return undefined;
    }
  }

  public async createNewItem(
    parentItem: ContentItem,
    fileName: string,
    buffer?: ArrayBufferLike,
  ): Promise<ContentItem | undefined> {
    try {
      const sep = await this.getDirectorySeparator();
      const remotePath = `${parentItem.uri}${sep}${fileName}`;

      if (buffer && buffer.byteLength > 0) {
        const base64Content = Buffer.from(buffer).toString("base64");
        const pythonCode = `
import tempfile, os, base64
_temp = tempfile.mktemp()
_content = base64.b64decode("${base64Content}")
with open(_temp, 'wb') as _f:
    _f.write(_content)
_result = sas.upload(_temp, r"${remotePath}", overwrite=True)
os.unlink(_temp)
print(_result.get('Success', False))
`;
        const output = await this.executePython(pythonCode);
        if (output.trim() !== "True") {
          return undefined;
        }
      } else {
        const sasCode = `
          data _null_;
            rc = filename('newfile', "${remotePath}");
            fid = fopen('newfile', 'O');
            if fid > 0 then rc = fclose(fid);
            put rc=;
          run;
        `;
        await this.runSASCode(sasCode);
      }

      return this.createContentItem({
        name: fileName,
        isDir: false,
        uri: remotePath,
        parentUri: parentItem.uri,
        size: buffer ? buffer.byteLength : 0,
        modified: "",
        created: "",
      });
    } catch (error) {
      return undefined;
    }
  }

  public async deleteItem(item: ContentItem): Promise<boolean> {
    try {
      const pythonCode = `
_result = sas.file_delete(r"${item.uri}")
print(_result.get('Success', False))
`;
      const output = await this.executePython(pythonCode);
      return output.trim() === "True";
    } catch (error) {
      return false;
    }
  }

  public async getChildItems(parentItem: ContentItem): Promise<ContentItem[]> {
    if (parentItem.id === SERVER_FOLDER_ID) {
      const rootPath = await this.resolveRootPath();
      if (!rootPath) {
        if (this.fileNavigationRoot === "CUSTOM") {
          throw new Error(Messages.FileNavigationRootUserError);
        }
        return [];
      }

      const homeFolder = convertStaticFolderToContentItem(
        createStaticFolder(
          rootPath,
          ...homeDirectoryNameAndType(
            this.fileNavigationRoot,
            this.fileNavigationCustomRootPath,
          ),
          rootPath,
          "getDirectoryMembers",
        ),
        {
          write: false,
          delete: false,
          addMember: true,
        },
      );
      homeFolder.contextValue =
        this.contextMenuProvider.availableActions(homeFolder);
      return [homeFolder];
    }

    const path = this.getLinkUri(parentItem);
    try {
    const pythonCode = `
import json
_path = r"${path}"
_result = []
try:
    _items = sas.dirlist(_path)
    for _item in _items:
        _is_dir = _item.endswith(sas.hostsep)
        _name = _item[:-len(sas.hostsep)] if _is_dir else _item
        _full = _path + sas.hostsep + _name
        _size = 0
        _modified = ''
        _created = ''
        if not _is_dir:
            try:
                _info = sas.file_info(_full)
                if _info:
                    for _k, _v in _info.items():
                        _kl = _k.lower()
                        if 'size' in _kl and 'byte' in _kl:
                            try: _size = int(_v)
                            except: _size = 0
                        elif 'modified' in _kl or ('last' in _kl and 'mod' in _kl):
                            _modified = str(_v) if _v else ''
                        elif 'created' in _kl or ('date' in _kl and 'creat' in _kl):
                            _created = str(_v) if _v else ''
            except:
                pass
        _result.append({
            'name': _name,
            'isDir': _is_dir,
            'uri': _full,
            'parentUri': _path,
            'size': _size,
            'modified': _modified,
            'created': _created
        })
except Exception as _e:
    print(json.dumps({'error': str(_e)}))
else:
    print(json.dumps(_result))
`;
      const output = await this.executePython(pythonCode);
      const items: SaspyFileItem[] = JSON.parse(output || "[]");
      const childItems = items.map((item) => this.createContentItem(item));
      return sortedContentItems(childItems);
    } catch (error) {
      return [];
    }
  }

  public async getPathOfItem(item: ContentItem): Promise<string> {
    return item.uri;
  }

  private async getTempFile() {
    const tempFile = v4();
    const globalStorageUri = getGlobalStorageUri();
    try {
      await workspace.fs.readDirectory(globalStorageUri);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      await workspace.fs.createDirectory(globalStorageUri);
    }

    const outputFile = Uri.joinPath(globalStorageUri, tempFile);
    return outputFile;
  }

  public async getContentOfItem(item: ContentItem): Promise<string> {
    const filePath = item.uri;
    const outputFile = await this.getTempFile();

    try {
      const pythonCode = `
_result = sas.download(r"${outputFile.fsPath}", r"${filePath}", overwrite=True)
print(_result.get('Success', False))
`;
      const output = await this.executePython(pythonCode);
      if (output.trim() !== "True") {
        return "";
      }
    } catch (error) {
      return "";
    }

    const file = await workspace.fs.readFile(outputFile);
    await workspace.fs.delete(outputFile);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return file as unknown as string;
  }

  public async getContentOfUri(uri: Uri): Promise<string> {
    const item = await this.getItemOfUri(uri);
    return ((await this.getContentOfItem(item)) || "").toString();
  }

  public async getItemOfUri(uri: Uri): Promise<ContentItem> {
    const resourceId = uri.query.substring(3); // ?id=...
    return this.getItemAtPath(resourceId);
  }

  public async getRootItems(): Promise<RootFolderMap> {
    for (let index = 0; index < SAS_SERVER_ROOT_FOLDERS.length; ++index) {
      const delegateFolderName = SAS_SERVER_ROOT_FOLDERS[index];
      this.rootFolders[delegateFolderName] = {
        uid: `${index}`,
        ...convertStaticFolderToContentItem(SAS_SERVER_ROOT_FOLDER, {
          write: false,
          delete: false,
          addMember: false,
        }),
      };
    }

    return this.rootFolders;
  }

  public async getUriOfItem(item: ContentItem): Promise<Uri> {
    return item.vscUri ?? getSasServerUri(item, false);
  }

  public async moveItem(
    item: ContentItem,
    targetParentFolderUri: string,
  ): Promise<Uri | undefined> {
    return await this.renameOrMove(item, targetParentFolderUri, item.name);
  }

  public async renameItem(
    item: ContentItem,
    newName: string,
  ): Promise<ContentItem | undefined> {
    const result = await this.renameOrMove(item, item.parentFolderUri, newName);
    if (!result) {
      return undefined;
    }

    const sep = await this.getDirectorySeparator();
    const newUri = `${item.parentFolderUri}${sep}${newName}`;
    return this.createContentItem({
      name: newName,
      isDir: item.fileStat?.type === FileType.Directory,
      uri: newUri,
      parentUri: item.parentFolderUri,
      size: item.fileStat?.size ?? 0,
      modified: "",
      created: "",
    });
  }

  private async renameOrMove(
    item: ContentItem,
    targetParentFolderUri: string,
    newName: string,
  ): Promise<Uri | undefined> {
    try {
      const sep = await this.getDirectorySeparator();
      const newPath = `${targetParentFolderUri}${sep}${newName}`;
      const sasCode = `
        %let rc1 = %sysfunc(filename(oldref, "${item.uri}"));
        %let rc2 = %sysfunc(filename(newref, "${newPath}"));
        %let rc = %sysfunc(frename(oldref, newref));
        %put <RENAME>&rc</RENAME>;
      `;
      const output = await this.runSASCode(sasCode, "<RENAME>", "</RENAME>");
      const rc = output.replace(/[^0-9]/g, "");
      if (rc !== "0") {
        return undefined;
      }
      return getSasServerUri(
        {
          ...item,
          name: newName,
          uri: newPath,
          parentFolderUri: targetParentFolderUri,
        },
        false,
      );
    } catch (error) {
      return undefined;
    }
  }

  public async updateContentOfItem(uri: Uri, content: string): Promise<void> {
    try {
      const resourceId = uri.query.substring(3);
      const outputFile = await this.getTempFile();
      await workspace.fs.writeFile(
        outputFile,
        new TextEncoder().encode(content),
      );

      const pythonCode = `
_result = sas.upload(r"${outputFile.fsPath}", r"${resourceId}", overwrite=True)
print(_result.get('Success', False))
`;
      await this.executePython(pythonCode);
      await workspace.fs.delete(outputFile);
    } catch (error) {
      return;
    }
  }

  protected async getItemAtPath(path: string): Promise<ContentItem> {
    const sep = await this.getDirectorySeparator();
    const pathPieces = path.split(sep);
    const name = pathPieces.pop() || path;
    const parentPath = pathPieces.join(sep);

    return this.createContentItem({
      name,
      isDir: false,
      uri: path,
      parentUri: parentPath,
      size: 0,
      modified: "",
      created: "",
    });
  }

  private async resolveRootPath(): Promise<string | undefined> {
    if (
      this.fileNavigationRoot === "CUSTOM" &&
      this.fileNavigationCustomRootPath
    ) {
      return this.fileNavigationCustomRootPath;
    }

    try {
      const pythonCode = `
import re
_ll = sas.submit("%put HOMEPATH=%sysfunc(pathname(home));")
_match = re.search(r'HOMEPATH=(.+)', _ll['LOG'])
print(_match.group(1).strip() if _match else '')
`;
      const output = await this.executePython(pythonCode);
      const homePath = output.trim();
      return homePath || undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async getDirectorySeparator(): Promise<string> {
    try {
      const pythonCode = `print(sas.hostsep)`;
      const output = await this.executePython(pythonCode);
      return output.trim() || "/";
    } catch (error) {
      return "/";
    }
  }

  private getLinkUri(item: ContentItem): string {
    const link = item.links.find(
      (l) => l.rel === "getDirectoryMembers" || l.rel === "self",
    );
    return link?.uri || item.uri;
  }

  private createContentItem(fileItem: SaspyFileItem): ContentItem {
    const type = fileItem.isDir ? FileType.Directory : FileType.File;
    const uri = fileItem.uri;
    const links = [
      type === FileType.Directory && {
        method: "GET",
        rel: "getDirectoryMembers",
        href: uri,
        uri: uri,
        type: "GET",
      },
      { method: "GET", rel: "self", href: uri, uri: uri, type: "GET" },
    ].filter((link) => link);

    const modifiedTimeStamp = fileItem.modified
      ? new Date(fileItem.modified).getTime() || 0
      : 0;
    const creationTimeStamp = fileItem.created
      ? new Date(fileItem.created).getTime() || 0
      : 0;

    const item: ContentItem = {
      id: uri,
      uri,
      name: fileItem.name,
      creationTimeStamp,
      modifiedTimeStamp,
      links,
      permission: {
        write: true,
        delete: true,
        addMember: type === FileType.Directory,
      },
      type: "",
      parentFolderUri: fileItem.parentUri,
      fileStat: {
        ctime: creationTimeStamp,
        mtime: modifiedTimeStamp,
        size: fileItem.size,
        type,
      },
    };

    return {
      ...item,
      contextValue: this.contextMenuProvider.availableActions(item),
      vscUri: getSasServerUri(item, false),
    };
  }

  private async executePython(code: string): Promise<string> {
    try {
      return await executeRawCode(code);
    } catch (e) {
      onRunError(e);
      return "";
    }
  }

  private async runSASCode(
    code: string,
    startTag: string = "",
    endTag: string = "",
  ): Promise<string> {
    try {
      return await runCode(code, startTag, endTag);
    } catch (e) {
      onRunError(e);
      return "";
    }
  }
}

export default SaspyServerAdapter;

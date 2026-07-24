// Copyright © 2023, SAS Institute Inc., Cary, NC, USA.  All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { BaseConfig } from "..";

export enum LineCodes {
  ResultsFetchedCode = "--vscode-sas-extension-results-fetched--",
  RunCancelledCode = "--vscode-sas-extension-run-cancelled--",
  RunEndCode = "--vscode-sas-extension-submit-end--",
  SessionCreatedCode = "--vscode-sas-extension-session-created--",
  LogLineType = "--vscode-sas-extension-log-line-type--",
  LogLineStarter = "--vscode-sas-extension-log-line-starter--",
}

// XML-style tags for structured log parsing (mirrors ITC's env.json pattern).
// Defined here so saspy is self-contained — no cross-module dependency on ssh.
export const WORK_DIR_START_TAG = "<SaspyWorkDir>";
export const WORK_DIR_END_TAG = "</SaspyWorkDir>";

/**
 * Configuration parameters for this connection provider
 */
export interface Config extends BaseConfig {
  cfgname: string;
  pythonpath: string;
}

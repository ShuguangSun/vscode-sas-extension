// Copyright © 2024, SAS Institute Inc., Cary, NC, USA.  All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { SortModelItem } from "ag-grid-community";
import { commands, l10n } from "vscode";

import { ChildProcessWithoutNullStreams } from "child_process";

import { onRunError } from "../../commands/run";
import {
  LibraryAdapter,
  LibraryItem,
  TableData,
  TableQuery,
  TableRow,
} from "../../components/LibraryNavigator/types";
import { Column, ColumnCollection, TableInfo } from "../rest/api/compute";
import { getColumnIconType } from "../util";
import { runCode } from "./CodeRunner";
import { Config, LineCodes } from "./types";

class SaspyLibraryAdapter implements LibraryAdapter {
  protected hasEstablishedConnection: boolean = false;
  protected shellProcess: ChildProcessWithoutNullStreams;
  protected pollingForLogResults: boolean = false;
  protected log: string[] = [];
  protected endTag: string = "";
  protected outputFinished: boolean = false;
  protected config: Config;

  public async connect(): Promise<void> {
    this.hasEstablishedConnection = true;
  }

  public async setup(): Promise<void> {
    if (this.hasEstablishedConnection) {
      return;
    }

    await this.connect();
  }

  public async deleteTable(item: LibraryItem): Promise<void> {
    const code = `
      proc datasets library=${item.library} nolist nodetails; delete ${item.name}; run;
    `;

    await this.runCode(code);
  }

  public async getColumns(item: LibraryItem): Promise<ColumnCollection> {
    const sql = `
      %let OUTPUT;
      proc sql;
        select catx('|', name, type, varnum, format, informat, label, length)
          into: OUTPUT separated by '~'
        from sashelp.vcolumn
        where libname='${item.library}' and memname='${item.name}'
        order by varnum;
      quit;
      %put <COLOUTPUT> &OUTPUT; %put </COLOUTPUT>;
    `;

    const columnLines = processQueryRows(
      await this.runCode(sql, "<COLOUTPUT>", "</COLOUTPUT>"),
    );

    const columns = columnLines.map((lineText): Column => {
      const [name, type, index, format, informat, label, length] =
        lineText.split("|");

      return {
        name,
        type: getColumnIconType({ type, format: { name: format || "" } }),
        index: parseInt(index, 10),
        label: label || undefined,
        length: parseInt(length, 10) || undefined,
        format: format ? { name: format } : undefined,
        informat: informat ? { name: informat } : undefined,
      };
    });

    return {
      items: columns,
      count: -1,
    };
  }

  public async getLibraries(): Promise<{
    items: LibraryItem[];
    count: number;
  }> {
    const sql = `
      %let OUTPUT;
      proc sql;
        select catx(',', libname, readonly) as libname_target into: OUTPUT separated by '~'
        from sashelp.vlibnam order by libname asc;
      quit;
      %put <LIBOUTPUT> &OUTPUT; %put </LIBOUTPUT>;
    `;

    const libNames = processQueryRows(
      await this.runCode(sql, "<LIBOUTPUT>", "</LIBOUTPUT>"),
    );

    const libraries = libNames.map((lineText): LibraryItem => {
      const [libName, readOnlyValue] = lineText.split(",");

      return {
        type: "library",
        uid: libName,
        id: libName,
        name: libName,
        readOnly: readOnlyValue === "yes",
      };
    });

    return {
      items: libraries,
      count: -1,
    };
  }

  public async getRows(
    item: LibraryItem,
    start: number,
    limit: number,
    sortModel: SortModelItem[],
    query: TableQuery | undefined,
  ): Promise<TableData> {
    const { rows: rawRowValues, count } = await this.getDatasetInformation(
      item,
      start,
      limit,
      sortModel,
      query,
    );

    const rows = rawRowValues.map((line, idx: number): TableRow => {
      const rowData = [`${start + idx + 1}`].concat(line);
      return { cells: rowData };
    });

    return {
      rows,
      count,
    };
  }

  public async getRowsAsCSV(
    item: LibraryItem,
    start: number,
    limit: number,
  ): Promise<TableData> {
    // We only need the columns for the first page of results
    const columns =
      start === 0
        ? {
            columns: ["INDEX"].concat(
              (await this.getColumns(item)).items.flatMap((column) =>
                column.name ? [column.name] : [],
              ),
            ),
          }
        : {};

    const { rows } = await this.getRows(item, start, limit, [], undefined);

    rows.unshift(columns);

    // Fetching csv doesn't rely on count. Instead, we get the count
    // upfront via getTableRowCount
    return { rows, count: -1 };
  }

  public async getTableRowCount(
    item: LibraryItem,
  ): Promise<{ rowCount: number; maxNumberOfRowsToRead: number }> {
    const code = `
      proc sql;
        SELECT COUNT(1) into: COUNT FROM  ${item.library}.${item.name};
      quit;
      %put <Count>&COUNT</Count>;
    `;

    const output = await this.runCode(code, "<Count>", "</Count>");
    const rowCount = parseInt(output.replace(/[^0-9]/g, ""), 10);

    return { rowCount, maxNumberOfRowsToRead: 100 };
  }

  public async getTables(item: LibraryItem): Promise<{
    items: LibraryItem[];
    count: number;
  }> {
    const sql = `
      %let OUTPUT;
      proc sql;
        select memname into: OUTPUT separated by '~'
        from sashelp.vtable
        where libname='${item.name!}'
        order by memname asc;
      quit;
      %put <TABLEOUTPUT> &OUTPUT; %put </TABLEOUTPUT>;
    `;

    const tableNames = processQueryRows(
      await this.runCode(sql, "<TABLEOUTPUT>", "</TABLEOUTPUT>"),
    );

    const tables = tableNames.map((lineText): LibraryItem => {
      const [table] = lineText.split(",");

      return {
        type: "table",
        uid: `${item.name!}.${table}`,
        id: table,
        name: table,
        library: item.name,
        readOnly: item.readOnly,
      };
    });

    return { items: tables, count: -1 };
  }

  public async getTableInfo(item: LibraryItem): Promise<TableInfo> {
    const basicInfo: TableInfo = {
      bookmarkLength: 0,
      columnCount: 0,
      compressionRoutine: "",
      creationTimeStamp: "",
      encoding: "",
      engine: "",
      extendedType: "",
      label: "",
      libref: item.library,
      logicalRecordCount: 0,
      modifiedTimeStamp: "",
      name: item.name,
      physicalRecordCount: 0,
      recordLength: 0,
      rowCount: 0,
      type: "DATA",
    };

    try {
      const sql = `
        %let OUTPUT;
        proc sql;
          select catx('|', memtype, nvar, nobs, crdate, modate, engine, label,
                       compress, encrypt, encoding, reclength)
            into: OUTPUT separated by '~'
          from sashelp.vtable
          where libname='${item.library}' and memname='${item.name}';
        quit;
        %put <TABLEINFO> &OUTPUT; %put </TABLEINFO>;
      `;

      const output = await this.runCode(sql, "<TABLEINFO>", "</TABLEINFO>");
      const infoLines = processQueryRows(output);

      if (infoLines.length === 0) {
        return basicInfo;
      }

      const [
        memtype,
        nvar,
        nobs,
        crdate,
        modate,
        engine,
        label,
        compress,
        ,
        encoding,
        reclength,
      ] = infoLines[0].split("|");

      return {
        ...basicInfo,
        columnCount: parseInt(nvar, 10) || 0,
        rowCount: parseInt(nobs, 10) || 0,
        logicalRecordCount: parseInt(nobs, 10) || 0,
        physicalRecordCount: parseInt(nobs, 10) || 0,
        creationTimeStamp: crdate || "",
        modifiedTimeStamp: modate || "",
        engine: engine || "",
        label: label || "",
        compressionRoutine: compress || "",
        encoding: encoding || "",
        recordLength: parseInt(reclength, 10) || 0,
        type: memtype === "VIEW" ? "VIEW" : "DATA",
      };
    } catch (error) {
      console.warn("Failed to get table info:", error);
      return basicInfo;
    }
  }

  protected async getDatasetInformation(
    item: LibraryItem,
    start: number,
    limit: number,
    sortModel: SortModelItem[] = [],
    query: TableQuery | undefined = undefined,
  ): Promise<{ rows: Array<string[]>; count: number }> {
    const maxTableNameLength = 32;
    const tempTable = `${item.name}${hms()}${start}`.substring(
      0,
      maxTableNameLength,
    );

    // Build WHERE clause from query filter
    const filterValue = query?.filterValue?.trim() || "";
    const whereClause = filterValue
      ? `where %nrstr(${filterValue});`
      : "";

    // Build sort string from sortModel (convert to SAS syntax)
    const sortString = sortModel
      .map((col) =>
        col.sort === "desc" ? `descending ${col.colId}` : col.colId,
      )
      .join(" ");

    const code = `
      options nonotes nosource nodate nonumber;
      %let COUNT;
      proc sql;
        SELECT COUNT(1) into: COUNT FROM  ${item.library}.${item.name}
        ${filterValue ? `where %nrstr(${filterValue})` : ""};
      quit;
      data work.${tempTable};
        set ${item.library}.${item.name};
        ${whereClause}
        if ${start + 1} <= _N_ <= ${start + limit} then output;
      run;
      ${sortString ? `proc sort data=work.${tempTable}; by ${sortString}; run;` : ""}
      filename out temp;
      proc json nokeys out=out pretty; export work.${tempTable}; run;

      %put <TABLEDATA>;
      %put <Count>&COUNT</Count>;
      data _null_; infile out; input; put _infile_; run;
      %put </TABLEDATA>;
      proc datasets library=work nolist nodetails; delete ${tempTable}; run; quit;
      options notes source date number;
    `;

    let output = await this.runCode(code, "<TABLEDATA>", "</TABLEDATA>");

    // Remove LogLineStarter
    const rxLineType: RegExp = new RegExp(`${LineCodes.LogLineStarter}=(\\w+):LINE=`, 'igm');
    output = output.replace(rxLineType, "");

    // Extract result count
    const countRegex = /<Count>(.*)<\/Count>/;
    const countMatches = output.match(countRegex);
    const count = countMatches
      ? parseInt(countMatches[1].replace(/\s|\n/gm, ""), 10)
      : 0;
    output = output.replace(countRegex, "");

    const rows = output.replace(/\n|\t/gm, "").slice(output.indexOf("{"));
    try {
      const tableData = JSON.parse(rows);
      return { rows: tableData[`SASTableData+${tempTable}`], count };
    } catch (e) {
      console.warn("Failed to load table data with error", e);
      console.warn("Raw output", rows);
      throw new Error(
        l10n.t(
          "An error was encountered when loading table data. This usually happens when a table is too large or the data couldn't be processed. See console for more details.",
        ),
      );
    }
  }

  protected async runCode(
    code: string,
    startTag: string = "",
    endTag: string = "",
  ): Promise<string> {
    try {
      return await runCode(code, startTag, endTag);
    } catch (e) {
      onRunError(e);
      commands.executeCommand("setContext", "SAS.librariesDisplayed", false);
      return "";
    }
  }
}

const processQueryRows = (response: string): string[] => {
  const processedResponse = response.trim().replace(/\n|\t/gm, "");
  if (!processedResponse) {
    return [];
  }

  return processedResponse
    .split("~")
    .filter((value, index, array) => array.indexOf(value) === index);
};

const hms = () => {
  const date = new Date();
  return `${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
};

export default SaspyLibraryAdapter;

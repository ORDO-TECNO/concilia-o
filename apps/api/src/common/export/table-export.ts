import { stringify } from 'csv-stringify';
import { stringify as stringifySync } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import { Writable } from 'stream';

export type ExportRow = (string | number)[];

// ---------------------------------------------------------------------------
// Buffered helpers (kept for tests and one-off small exports)
// ---------------------------------------------------------------------------

export async function buildCsvBuffer(headers: string[], rows: ExportRow[]): Promise<Buffer> {
  const csv = stringifySync([headers, ...rows], { delimiter: ';' });
  // BOM UTF-8 para o Excel abrir acentos corretamente no Windows
  return Buffer.concat([Buffer.from('﻿', 'utf8'), Buffer.from(csv, 'utf8')]);
}

export async function buildXlsxBuffer(
  headers: string[],
  rows: ExportRow[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  sheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value ?? '').length);
    });
    column.width = Math.min(maxLength + 2, 40);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Streaming helpers
// ---------------------------------------------------------------------------

/**
 * Streams CSV rows into a Writable (typically an Express Response).
 * The caller must set Content-Type and Content-Disposition before calling
 * when using an Express Response.
 * It writes a UTF-8 BOM first, then header + batches as they arrive.
 *
 * @param dest - Any Node.js Writable (Express Response, PassThrough, etc.)
 * @param headers - Column header labels
 * @param batches - Async iterable that yields one row-array per iteration batch
 */
export async function streamCsvExport(
  dest: Writable,
  headers: string[],
  batches: AsyncIterable<ExportRow[]>,
): Promise<void> {
  // BOM UTF-8 so Excel on Windows reads accented characters correctly
  dest.write(Buffer.from('﻿', 'utf8'));

  await new Promise<void>((resolve, reject) => {
    const stringifier = stringify({ delimiter: ';' });

    stringifier.on('data', (chunk: Buffer | string) => {
      dest.write(chunk);
    });

    stringifier.on('error', reject);
    stringifier.on('finish', resolve);

    // Write header row first
    stringifier.write(headers);

    // Process batches asynchronously, writing each row into the stringifier
    (async () => {
      try {
        for await (const batch of batches) {
          for (const row of batch) {
            stringifier.write(row);
          }
        }
        stringifier.end();
      } catch (err) {
        stringifier.destroy(err instanceof Error ? err : new Error(String(err)));
        reject(err);
      }
    })();
  });
}

/**
 * Streams XLSX rows into a Writable (typically an Express Response, which
 * extends Node's http.ServerResponse and therefore Writable) using ExcelJS
 * WorkbookWriter. The caller must set Content-Type / Content-Disposition
 * before calling when using an Express Response.
 *
 * @param dest - Any Node.js Writable (Express Response, PassThrough, etc.)
 * @param headers - Column header labels
 * @param sheetName - Worksheet name
 * @param batches - Async iterable that yields one row-array per iteration batch
 */
export async function streamXlsxExport(
  dest: Writable,
  headers: string[],
  sheetName: string,
  batches: AsyncIterable<ExportRow[]>,
): Promise<void> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: dest,
    useStyles: true,
    useSharedStrings: false,
  });

  const sheet = workbook.addWorksheet(sheetName);

  // Bold header row
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.commit();

  for await (const batch of batches) {
    for (const row of batch) {
      sheet.addRow(row).commit();
    }
  }

  await sheet.commit();
  await workbook.commit();
}

import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';

export async function buildCsvBuffer(headers: string[], rows: (string | number)[][]): Promise<Buffer> {
  const csv = stringify([headers, ...rows], { delimiter: ';' });
  // BOM UTF-8 para o Excel abrir acentos corretamente no Windows
  return Buffer.concat([Buffer.from('﻿', 'utf8'), Buffer.from(csv, 'utf8')]);
}

export async function buildXlsxBuffer(
  headers: string[],
  rows: (string | number)[][],
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

import { ImportSource, ImportStatus } from '../enums';

export interface ImportPeriodSummary {
  year: number;
  month: number;
  recordCount: number;
  openingBalance: number | null;
  closingBalance: number | null;
}

export interface ImportSummary {
  importBatchId: string;
  source: ImportSource;
  status: ImportStatus;
  originalFileName: string;
  totalRecords: number;
  newRecords: number;
  duplicateRecords: number;
  ignoredRecords: number;
  statementStartDate: string | null;
  statementEndDate: string | null;
  statementStartBalance: number | null;
  statementEndBalance: number | null;
  periods: ImportPeriodSummary[];
  errorMessage: string | null;
}

export interface CsvPreviewResponse {
  headers: string[];
  sampleRows: string[][];
  suggestedMapping: {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
    documentColumn?: string;
    balanceColumn?: string;
    creditDebitColumn?: string;
  };
  previewToken: string;
}

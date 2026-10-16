import { DFCLine } from '../enums';

export interface DFCLineValues {
  line: DFCLine;
  label: string;
  monthly: number[]; // length 12, index 0 = Janeiro
  total: number;
}

export interface DFCSectionValues {
  key: string;
  label: string;
  lines: DFCLineValues[];
  monthly: number[];
  total: number;
}

export interface DFCGroupValues {
  key: string;
  label: string;
  resultLabel: string;
  sections: DFCSectionValues[];
  monthly: number[];
  total: number;
}

export interface DFCReport {
  companyId: string;
  year: number;
  groups: DFCGroupValues[];
  openingBalance: number[];
  closingBalance: number[];
  netFlow: number[];
  /** Fluxo do mês que ainda não está numa linha da DFC (sem categoria ou categoria sem linha). Fora dos saldos. */
  unclassified: number[];
}

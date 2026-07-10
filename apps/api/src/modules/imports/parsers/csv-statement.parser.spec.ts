import { detectDelimiter, parseCsvStatement, previewCsv } from './csv-statement.parser';

const SEMICOLON_CSV = `Data;Historico;Documento;Valor;Saldo
01/07/2026;PAGAMENTO FORNECEDOR XYZ;123;-450,00;5000,00
03/07/2026;RECEBIMENTO CLIENTE ABC;456;2200,50;7200,50
15/07/2026;TARIFA BANCARIA;;-35,90;7164,60
`;

describe('detectDelimiter', () => {
  it('detecta ; como delimitador em CSV brasileiro típico', () => {
    expect(detectDelimiter(SEMICOLON_CSV)).toBe(';');
  });

  it('detecta , como delimitador em CSV padrão americano', () => {
    const csv = 'date,description,amount\n2026-01-01,Test,100.00\n';
    expect(detectDelimiter(csv)).toBe(',');
  });
});

describe('previewCsv', () => {
  it('sugere o mapeamento de colunas por heurística de nome de cabeçalho', () => {
    const preview = previewCsv(SEMICOLON_CSV, ';');
    expect(preview.headers).toEqual(['Data', 'Historico', 'Documento', 'Valor', 'Saldo']);
    expect(preview.suggestedMapping.dateColumn).toBe('Data');
    expect(preview.suggestedMapping.descriptionColumn).toBe('Historico');
    expect(preview.suggestedMapping.amountColumn).toBe('Valor');
    expect(preview.suggestedMapping.documentColumn).toBe('Documento');
    expect(preview.suggestedMapping.balanceColumn).toBe('Saldo');
    expect(preview.sampleRows).toHaveLength(3);
  });
});

describe('parseCsvStatement', () => {
  const baseMapping = {
    dateColumn: 'Data',
    descriptionColumn: 'Historico',
    amountColumn: 'Valor',
    documentColumn: 'Documento',
    balanceColumn: 'Saldo',
    delimiter: ';',
    dateFormat: 'DD/MM/YYYY' as const,
    decimalSeparator: ',' as const,
  };

  it('parseia data BR, valor com vírgula decimal e saldo corrente', () => {
    const result = parseCsvStatement(SEMICOLON_CSV, baseMapping);
    expect(result.transactions).toHaveLength(3);

    const [first] = result.transactions;
    expect(first.date).toBe('2026-07-01');
    expect(first.amount).toBe(-450);
    expect(first.description).toBe('PAGAMENTO FORNECEDOR XYZ');
    expect(first.document).toBe('123');
    expect(first.balanceAfter).toBe(5000);
  });

  it('deriva startDate/endDate e startBalance/endBalance do range completo', () => {
    const result = parseCsvStatement(SEMICOLON_CSV, baseMapping);
    expect(result.startDate).toBe('2026-07-01');
    expect(result.endDate).toBe('2026-07-15');
    expect(result.startBalance).toBe(5000);
    expect(result.endBalance).toBe(7164.6);
  });

  it('aplica coluna de crédito/débito quando o valor vem sempre positivo', () => {
    const csv = `Data;Historico;Valor;Tipo
01/07/2026;Compra;450,00;D
02/07/2026;Venda;200,00;C
`;
    const result = parseCsvStatement(csv, {
      ...baseMapping,
      documentColumn: undefined,
      balanceColumn: undefined,
      creditDebitColumn: 'Tipo',
    });
    expect(result.transactions[0].amount).toBe(-450);
    expect(result.transactions[1].amount).toBe(200);
  });

  it('interpreta separador decimal ponto (formato US) corretamente', () => {
    const csv = `Data;Historico;Valor
01/07/2026;Compra;-1234.56
`;
    const result = parseCsvStatement(csv, { ...baseMapping, decimalSeparator: '.', documentColumn: undefined, balanceColumn: undefined });
    expect(result.transactions[0].amount).toBe(-1234.56);
  });

  it('ignora linhas sem data ou valor válidos em vez de quebrar o import inteiro', () => {
    const csv = `Data;Historico;Valor
;Sem data;100,00
01/07/2026;Valor inválido;abc
02/07/2026;Linha válida;50,00
`;
    const result = parseCsvStatement(csv, { ...baseMapping, documentColumn: undefined, balanceColumn: undefined });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].description).toBe('Linha válida');
  });
});

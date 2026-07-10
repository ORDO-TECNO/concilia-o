import { parseOfxStatement } from './ofx-statement.parser';

const SAMPLE_OFX_1X = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>341
<BRANCHID>0001
<ACCTID>12345-6
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260501
<DTEND>20260601
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260505
<TRNAMT>1500.00
<FITID>OFX-0001
<NAME>RECEBIMENTO PIX CLIENTE ABC
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260510120000
<TRNAMT>-320.50
<FITID>OFX-0002
<NAME>PAG PIX JOAO FORNECEDOR
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>1179.50
<DTASOF>20260601
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

describe('parseOfxStatement', () => {
  it('extrai banco/agência/conta do BANKACCTFROM', () => {
    const result = parseOfxStatement(SAMPLE_OFX_1X);
    expect(result.bankCode).toBe('341');
    expect(result.agencia).toBe('0001');
    expect(result.conta).toBe('12345-6');
  });

  it('extrai as datas de início/fim como data pura (sem timezone)', () => {
    const result = parseOfxStatement(SAMPLE_OFX_1X);
    expect(result.startDate).toBe('2026-05-01');
    expect(result.endDate).toBe('2026-06-01');
  });

  it('extrai o saldo final do LEDGERBAL', () => {
    const result = parseOfxStatement(SAMPLE_OFX_1X);
    expect(result.endBalance).toBe(1179.5);
  });

  it('parseia cada STMTTRN com sinal correto e trunca hora da data', () => {
    const result = parseOfxStatement(SAMPLE_OFX_1X);
    expect(result.transactions).toHaveLength(2);

    const [credito, debito] = result.transactions;
    expect(credito.date).toBe('2026-05-05');
    expect(credito.amount).toBe(1500);
    expect(credito.description).toBe('RECEBIMENTO PIX CLIENTE ABC');
    expect(credito.fitId).toBe('OFX-0001');

    // DTPOSTED com hora (20260510120000) deve truncar para a data pura
    expect(debito.date).toBe('2026-05-10');
    expect(debito.amount).toBe(-320.5);
  });

  it('lança erro claro quando a tag <OFX> não existe', () => {
    expect(() => parseOfxStatement('conteúdo qualquer sem ofx')).toThrow();
  });

  it('degrada graciosamente quando BANKID/BRANCHID estão ausentes', () => {
    const withoutBankInfo = SAMPLE_OFX_1X.replace('<BANKID>341\n', '').replace('<BRANCHID>0001\n', '');
    const result = parseOfxStatement(withoutBankInfo);
    expect(result.bankCode).toBeUndefined();
    expect(result.agencia).toBeUndefined();
    expect(result.conta).toBe('12345-6');
    expect(result.transactions).toHaveLength(2);
  });
});

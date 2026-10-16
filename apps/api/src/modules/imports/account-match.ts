function digits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * O extrato (OFX) informa a conta de origem; se ela claramente não é a conta
 * escolhida pelo usuário, importar misturaria movimentações de contas
 * diferentes. A comparação é tolerante: só dígitos, sem zeros à esquerda, com
 * ou sem o dígito verificador, e aceita quando um contém o outro (bancos
 * formatam ACCTID de jeitos diferentes, às vezes com a agência junto).
 * Sem informação suficiente dos dois lados, não bloqueia.
 */
export function statementMatchesAccount(
  parsedConta: string | undefined,
  account: { conta: string; contaDigito?: string | null },
): boolean {
  const fromFile = digits(parsedConta);
  const base = digits(account.conta);
  if (!fromFile || !base) return true;
  const withDigit = digits(`${account.conta}${account.contaDigito ?? ''}`);
  return [base, withDigit].some((candidate) => fromFile.includes(candidate) || candidate.includes(fromFile));
}

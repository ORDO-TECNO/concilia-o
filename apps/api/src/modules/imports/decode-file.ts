import * as iconv from 'iconv-lite';

/**
 * Extratos bancários brasileiros costumam vir em Windows-1252/Latin1, não
 * UTF-8. Tenta UTF-8 primeiro; se aparecer o caractere de substituição
 * (U+FFFD), a decodificação falhou silenciosamente e refaz como windows-1252.
 */
export function decodeFileBuffer(buffer: Buffer): string {
  const asUtf8 = buffer.toString('utf8');
  if (!asUtf8.includes('�')) {
    return asUtf8;
  }
  return iconv.decode(buffer, 'windows-1252');
}

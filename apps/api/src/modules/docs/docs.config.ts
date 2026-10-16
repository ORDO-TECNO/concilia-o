import type { ConfigService } from '@nestjs/config';

/**
 * Documentação (manual + Swagger) fica ligada por padrão. Para esconder num
 * ambiente — por exemplo, produção aberta ao público — defina DOCS_ENABLED=false.
 */
export function docsEnabled(config: ConfigService): boolean {
  return config.get<string>('DOCS_ENABLED') !== 'false';
}

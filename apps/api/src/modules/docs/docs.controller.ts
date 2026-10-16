import { readFileSync } from 'fs';
import { join } from 'path';
import { Controller, Get, Header, NotFoundException, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { docsEnabled } from './docs.config';

// Fonte única do manual: docs/manual/index.html na raiz do monorepo. Mesma
// profundidade a partir de src/ (dev, testes) e de dist/ (build/Docker):
// <root>/apps/api/{src,dist}/modules/docs → 5 níveis acima = <root>.
const MANUAL_PATH = join(__dirname, '..', '..', '..', '..', '..', 'docs', 'manual', 'index.html');

@ApiExcludeController()
@Controller('docs')
export class DocsController {
  private manual: string | null = null;

  constructor(private readonly config: ConfigService) {}

  @Get()
  @Redirect('/docs/ledger-manual', 302)
  index() {
    this.assertEnabled();
  }

  @Get('ledger-manual')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  ledgerManual(): string {
    this.assertEnabled();
    if (this.manual === null) {
      try {
        this.manual = readFileSync(MANUAL_PATH, 'utf-8');
      } catch {
        throw new NotFoundException('Manual não encontrado neste build (docs/manual/index.html)');
      }
    }
    return this.manual;
  }

  private assertEnabled() {
    if (!docsEnabled(this.config)) throw new NotFoundException();
  }
}

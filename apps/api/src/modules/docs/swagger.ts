import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { docsEnabled } from './docs.config';

export const SWAGGER_PATH = 'docs/api';

/**
 * Swagger UI em /docs/api e o JSON OpenAPI em /docs/api-json. Os schemas dos
 * DTOs vêm do plugin do @nestjs/swagger (nest-cli.json), que lê os tipos e os
 * decorators do class-validator no build — não é preciso @ApiProperty.
 * API_PUBLIC_URL, quando definida, vira o servidor do "Try it out" (útil
 * quando a doc é aberta pelo domínio do web via rewrite).
 */
export function setupSwagger(app: INestApplication, config: ConfigService): void {
  if (!docsEnabled(config)) return;

  const builder = new DocumentBuilder()
    .setTitle('Ledger API')
    .setDescription(
      'Conciliação bancária, classificação e DFC. Manual completo em <a href="/docs/ledger-manual">/docs/ledger-manual</a>.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addCookieAuth('refresh_token');
  const publicUrl = config.get<string>('API_PUBLIC_URL');
  if (publicUrl) builder.addServer(publicUrl);

  const document = SwaggerModule.createDocument(app, builder.build());
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'Ledger API',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });
}

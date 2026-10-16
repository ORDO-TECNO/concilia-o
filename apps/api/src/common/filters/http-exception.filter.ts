import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * Erros conhecidos do Prisma que são culpa da requisição, não do servidor.
 * Sem esse mapeamento, um CNPJ ou conta duplicada respondia 500.
 */
function fromPrismaError(error: Prisma.PrismaClientKnownRequestError): HttpException | null {
  switch (error.code) {
    case 'P2002':
      return new HttpException('Já existe um registro com esses dados', HttpStatus.CONFLICT);
    case 'P2003':
      return new HttpException('Registro relacionado inexistente ou ainda em uso', HttpStatus.CONFLICT);
    case 'P2025':
      return new HttpException('Registro não encontrado', HttpStatus.NOT_FOUND);
    default:
      return null;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(caught: unknown, host: ArgumentsHost) {
    const exception =
      caught instanceof Prisma.PrismaClientKnownRequestError ? (fromPrismaError(caught) ?? caught) : caught;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Erro interno do servidor' };

    const message =
      typeof body === 'string'
        ? body
        : typeof body === 'object' && body !== null && 'message' in body
          ? String((body as Record<string, unknown>).message)
          : 'Erro interno do servidor';

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.path} → ${status}: ${message}`);
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(`${request.method} ${request.path} → ${status}: ${message}`);
    }

    response.status(status).json(
      typeof body === 'string'
        ? { statusCode: status, message: body }
        : { statusCode: status, ...(body as Record<string, unknown>) },
    );
  }
}

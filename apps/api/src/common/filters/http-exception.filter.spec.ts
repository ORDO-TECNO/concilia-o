import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from './http-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'POST', path: '/x' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return { status: status.mock.calls[0][0] as number, body: json.mock.calls[0][0] };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: 'test' });
}

describe('HttpExceptionFilter', () => {
  it.each([
    ['P2002', 409],
    ['P2003', 409],
    ['P2025', 404],
  ])('mapeia erro do Prisma %s para %d', (code, expected) => {
    expect(run(prismaError(code)).status).toBe(expected);
  });

  it('erro do Prisma desconhecido continua 500 sem vazar a mensagem interna', () => {
    const { status, body } = run(prismaError('P1001'));
    expect(status).toBe(500);
    expect(body.message).toBe('Erro interno do servidor');
  });

  it('preserva HttpException', () => {
    expect(run(new BadRequestException('x')).status).toBe(400);
  });
});

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Garante que o usuário autenticado (definido por JwtAuthGuard, que deve
 * rodar antes) pertence à empresa referenciada por :companyId na rota.
 * Multiempresa no MVP é só isso — RBAC granular por papel fica para a Fase 2.
 */
@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.params?.companyId;
    const userId = request.user?.userId;

    if (!companyId || !userId) {
      throw new ForbiddenException('Empresa não informada ou usuário não autenticado');
    }

    const membership = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!membership) {
      throw new ForbiddenException('Usuário não pertence a esta empresa');
    }

    return true;
  }
}

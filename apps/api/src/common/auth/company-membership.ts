import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Usado por rotas que recebem apenas :id (não :companyId) — o recurso é
 * carregado primeiro, seu companyId extraído, e então validamos que o
 * usuário pertence àquela empresa. Mesma regra do CompanyAccessGuard,
 * aplicada depois de já saber a que empresa o recurso pertence.
 */
export async function assertUserBelongsToCompany(
  prisma: PrismaService,
  userId: string,
  companyId: string,
): Promise<void> {
  const membership = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
  if (!membership) {
    throw new ForbiddenException('Usuário não pertence a esta empresa');
  }
}

import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

type Db = Pick<PrismaService, 'category' | 'party'>;

/**
 * Uma categoria só pode ser atribuída a um lançamento (manualmente ou por
 * regra) se for da mesma empresa, estiver ativa e for uma folha mapeada a uma
 * linha da DFC. Categoria agrupadora ou sem linha faria o valor sumir da DFC.
 */
export async function assertAssignableCategory(db: Db, companyId: string, categoryId: string): Promise<void> {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { companyId: true, isActive: true, dfcLine: true, name: true, _count: { select: { children: true } } },
  });
  if (!category || category.companyId !== companyId) {
    throw new BadRequestException('Categoria inválida para esta empresa');
  }
  if (!category.isActive) {
    throw new BadRequestException(`A categoria "${category.name}" está inativa`);
  }
  if (category._count.children > 0 || !category.dfcLine) {
    throw new BadRequestException(
      `"${category.name}" é uma categoria agrupadora — escolha uma subcategoria mapeada a uma linha da DFC`,
    );
  }
}

/** Fornecedor/cliente precisa ser da mesma empresa do lançamento/regra. */
export async function assertPartyBelongsToCompany(db: Db, companyId: string, partyId: string): Promise<void> {
  const party = await db.party.findUnique({ where: { id: partyId }, select: { companyId: true } });
  if (!party || party.companyId !== companyId) {
    throw new BadRequestException('Fornecedor/cliente inválido para esta empresa');
  }
}

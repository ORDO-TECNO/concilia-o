import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, CategoryKind, DFCLine } from '@prisma/client';
import { isDfcLineAllowedForKind } from '@conciliacao/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { CategoryDto, UpdateCategoryDto } from './dto/category.dto';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, flat: boolean) {
    const categories = await this.prisma.category.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });

    if (flat) return categories;

    const byId = new Map<string, CategoryNode>();
    categories.forEach((c) => byId.set(c.id, { ...c, children: [] }));
    const roots: CategoryNode[] = [];
    byId.forEach((node) => {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  private assertKindMatchesLine(kind: CategoryKind, dfcLine: DFCLine | null | undefined) {
    if (dfcLine && !isDfcLineAllowedForKind(kind, dfcLine)) {
      throw new BadRequestException('A linha da DFC escolhida não é compatível com o tipo da categoria');
    }
  }

  private async assertValidParent(companyId: string, parentId: string) {
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.companyId !== companyId) {
      throw new BadRequestException('Categoria pai inválida');
    }
    return parent;
  }

  /**
   * Mover uma categoria para debaixo de um dos seus descendentes criaria um
   * ciclo — e categorias em ciclo somem da árvore (nenhuma vira raiz).
   * Sobe a partir do novo pai até a raiz procurando a própria categoria.
   */
  private async assertNotDescendant(categoryId: string, newParentId: string) {
    let current: string | null = newParentId;
    const visited = new Set<string>();
    while (current && !visited.has(current)) {
      if (current === categoryId) {
        throw new BadRequestException('Uma categoria não pode ficar abaixo de uma das suas subcategorias');
      }
      visited.add(current);
      const node: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      current = node?.parentId ?? null;
    }
  }

  async create(companyId: string, dto: CategoryDto) {
    this.assertKindMatchesLine(dto.kind, dto.dfcLine);
    if (dto.parentId) {
      await this.assertValidParent(companyId, dto.parentId);
    }
    return this.prisma.category.create({
      data: {
        companyId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        kind: dto.kind,
        dfcLine: dto.dfcLine ?? null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, category.companyId);

    this.assertKindMatchesLine(
      dto.kind ?? category.kind,
      dto.dfcLine !== undefined ? dto.dfcLine : category.dfcLine,
    );
    if (dto.parentId === id) {
      throw new BadRequestException('Uma categoria não pode ser pai de si mesma');
    }
    if (dto.parentId) {
      await this.assertValidParent(category.companyId, dto.parentId);
      await this.assertNotDescendant(id, dto.parentId);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        kind: dto.kind,
        dfcLine: dto.dfcLine,
        parentId: dto.parentId,
        isActive: dto.isActive,
      },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, category.companyId);

    const [childCount, transactionCount] = await Promise.all([
      this.prisma.category.count({ where: { parentId: id } }),
      this.prisma.transaction.count({ where: { categoryId: id } }),
    ]);

    if (childCount > 0) {
      throw new BadRequestException('Remova ou mova as subcategorias antes de excluir esta categoria');
    }
    if (transactionCount > 0) {
      throw new BadRequestException('Existem lançamentos usando esta categoria — desative-a em vez de excluir');
    }

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}

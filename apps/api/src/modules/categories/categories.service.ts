import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserBelongsToCompany } from '../../common/auth/company-membership';
import { CategoryDto } from './dto/category.dto';

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

  async create(companyId: string, dto: CategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.companyId !== companyId) {
        throw new BadRequestException('Categoria pai inválida');
      }
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

  async update(userId: string, id: string, dto: Partial<CategoryDto>) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    await assertUserBelongsToCompany(this.prisma, userId, category.companyId);

    if (dto.parentId === id) {
      throw new BadRequestException('Uma categoria não pode ser pai de si mesma');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        kind: dto.kind,
        dfcLine: dto.dfcLine,
        parentId: dto.parentId,
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

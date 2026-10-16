import { BadRequestException } from '@nestjs/common';
import { assertAssignableCategory, assertPartyBelongsToCompany } from './assignable';

function db(category: unknown, party: unknown = null) {
  return {
    category: { findUnique: jest.fn().mockResolvedValue(category) },
    party: { findUnique: jest.fn().mockResolvedValue(party) },
  } as never;
}

const leaf = { companyId: 'co-1', isActive: true, dfcLine: 'FOLHA', name: 'Folha', _count: { children: 0 } };

describe('assertAssignableCategory', () => {
  it('aceita folha ativa da mesma empresa com linha da DFC', async () => {
    await expect(assertAssignableCategory(db(leaf), 'co-1', 'cat')).resolves.toBeUndefined();
  });

  it.each([
    ['inexistente', null],
    ['de outra empresa', { ...leaf, companyId: 'co-2' }],
    ['inativa', { ...leaf, isActive: false }],
    ['agrupadora (tem filhas)', { ...leaf, _count: { children: 2 } }],
    ['sem linha da DFC', { ...leaf, dfcLine: null }],
  ])('rejeita categoria %s', async (_label, category) => {
    await expect(assertAssignableCategory(db(category), 'co-1', 'cat')).rejects.toThrow(BadRequestException);
  });
});

describe('assertPartyBelongsToCompany', () => {
  it('aceita parte da mesma empresa', async () => {
    await expect(assertPartyBelongsToCompany(db(null, { companyId: 'co-1' }), 'co-1', 'p')).resolves.toBeUndefined();
  });

  it('rejeita parte de outra empresa', async () => {
    await expect(assertPartyBelongsToCompany(db(null, { companyId: 'co-2' }), 'co-1', 'p')).rejects.toThrow(
      BadRequestException,
    );
  });
});

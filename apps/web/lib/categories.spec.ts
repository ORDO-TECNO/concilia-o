import { toCategoryOptions } from './categories';

describe('toCategoryOptions', () => {
  it('indenta por nível e só permite selecionar folhas com linha da DFC', () => {
    const options = toCategoryOptions([
      {
        id: 'g',
        name: 'Despesas',
        dfcLine: null,
        children: [
          { id: 'f', name: 'Folha', dfcLine: 'FOLHA', children: [] },
          { id: 'x', name: 'Sem linha', dfcLine: null, children: [] },
        ],
      },
    ]);
    expect(options).toEqual([
      { id: 'g', label: 'Despesas', depth: 0, selectable: false },
      { id: 'f', label: '— Folha', depth: 1, selectable: true },
      { id: 'x', label: '— Sem linha', depth: 1, selectable: false },
    ]);
  });
});

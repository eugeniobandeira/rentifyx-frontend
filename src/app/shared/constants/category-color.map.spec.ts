import { getCategorySlot } from './category-color.map';

describe('getCategorySlot', () => {
  it('resolves curated categories to their documented slot', () => {
    expect(getCategorySlot('tools')).toEqual({
      slot: 1,
      textToken: 'category-1-subtle-foreground',
      bgToken: 'category-1-subtle',
    });
    expect(getCategorySlot('real-estate')).toEqual({
      slot: 7,
      textToken: 'category-7-subtle-foreground',
      bgToken: 'category-7-subtle',
    });
  });

  it('is case-insensitive and trims whitespace for curated categories', () => {
    expect(getCategorySlot('  Tools  ')).toEqual(getCategorySlot('tools'));
  });

  it('falls back to slot 0 for an empty or blank slug', () => {
    expect(getCategorySlot('').slot).toBe(0);
    expect(getCategorySlot('   ').slot).toBe(0);
  });

  it('assigns an unmapped category a deterministic slot between 1 and 8', () => {
    const result = getCategorySlot('underwater-basket-weaving');

    expect(result.slot).toBeGreaterThanOrEqual(1);
    expect(result.slot).toBeLessThanOrEqual(8);
    expect(getCategorySlot('underwater-basket-weaving')).toEqual(result);
  });
});

import { suggestQuantities } from './quantity-suggestions';

describe('Adaptive quantity suggestions', () => {
  it('offers simple shares of the current available quantity', () => {
    expect(suggestQuantities(1000, 1000)).toEqual([100, 200, 500]);
    expect(suggestQuantities(1000, 400)).toEqual([50, 100, 200]);
    expect(suggestQuantities(1000, 130)).toEqual([20, 50, 100]);
    expect(suggestQuantities(1000, 37)).toEqual([5, 10, 20]);
    expect(suggestQuantities(1000, 9)).toEqual([1, 2, 5]);
  });

  it('avoids duplicates and leaves the full remaining quantity to Tout', () => {
    expect(suggestQuantities(1000, 3)).toEqual([1, 2]);
    expect(suggestQuantities(1000, 2)).toEqual([1]);
    expect(suggestQuantities(1000, 1)).toEqual([]);
    expect(suggestQuantities(1000, 0)).toEqual([]);
    expect(suggestQuantities(0, 10)).toEqual([]);
  });
});

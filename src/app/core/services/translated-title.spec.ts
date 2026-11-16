import { pageIndexing } from './translated-title';

describe('Public page indexing', () => {
  it('indexes the home page and the public information pages', () => {
    expect(pageIndexing('/').indexable).toBeTrue();
    expect(pageIndexing('/aide').indexable).toBeTrue();
    expect(pageIndexing('/confidentialite').indexable).toBeTrue();
    expect(pageIndexing('/conditions/').path).toBe('/conditions');
    expect(pageIndexing('/conditions/').indexable).toBeTrue();
  });

  it('keeps personal wirds and account pages out of search results', () => {
    expect(pageIndexing('/wird/exemple').indexable).toBeFalse();
    expect(pageIndexing('/connexion').indexable).toBeFalse();
    expect(pageIndexing('/mes-parts').indexable).toBeFalse();
    expect(pageIndexing('/creer/apercu?etape=1').path).toBe('/creer/apercu');
  });
});

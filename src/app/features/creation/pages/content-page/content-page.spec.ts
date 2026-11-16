import { filterTitleSuggestions, TitleSuggestion } from './content-page';

const suggestions: TitleSuggestion[] = [
  { title: 'Salat ala Nabi', target: 1000 },
  { title: 'Al Fatiha', target: 100 },
  { title: 'Istighfar', target: 1000 },
  { title: 'Notre famille', target: null },
];

describe('Wird title suggestions', () => {
  it('offers the catalog while the name is empty and hides an exact match', () => {
    expect(filterTitleSuggestions(suggestions, '').map((item) => item.title)).toEqual([
      'Salat ala Nabi',
      'Al Fatiha',
      'Istighfar',
      'Notre famille',
    ]);
    expect(filterTitleSuggestions(suggestions, 'Al Fatiha')).toEqual([]);
  });

  it('filters without accents and keeps the matching target', () => {
    expect(filterTitleSuggestions(suggestions, 'sal')).toEqual([
      { title: 'Salat ala Nabi', target: 1000 },
    ]);
    expect(filterTitleSuggestions(suggestions, 'fâti')).toEqual([
      { title: 'Al Fatiha', target: 100 },
    ]);
  });
});

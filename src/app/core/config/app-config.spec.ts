import {
  DEFAULT_DONATIONS,
  DEFAULT_TEMPLATES,
  DEFAULT_TEXTS,
  localizedText,
  paragraphs,
  parseDonations,
  parseFeatures,
  parseTemplates,
  parseTexts,
} from './app-config';

describe('App config', () => {
  it('keeps the current donation behaviour when settings are missing or invalid', () => {
    expect(parseDonations(null)).toEqual(DEFAULT_DONATIONS);
    const parsed = parseDonations({
      enabled: false,
      amounts: [200, 'x', -5, 700],
      min: 900,
      max: 100,
      number: '12',
      wave: true,
      orange: false,
    });
    expect(parsed.enabled).toBeFalse();
    expect(parsed.amounts).toEqual([200, 700]);
    expect([parsed.min, parsed.max]).toEqual([DEFAULT_DONATIONS.min, DEFAULT_DONATIONS.max]);
    expect(parsed.number).toBe(DEFAULT_DONATIONS.number);
    expect(parsed.orange).toBeFalse();
  });

  it('drops invalid or duplicate templates and accepts an empty list', () => {
    expect(parseTemplates(undefined)).toEqual(DEFAULT_TEMPLATES);
    expect(parseTemplates([])).toEqual([]);
    expect(
      parseTemplates([
        { id: 'a', title: ' Dalail ', target: 41, icon: 'book' },
        { id: 'a', title: 'Copie', target: 1, icon: 'book' },
        { id: 'custom', title: 'Réservé', target: 1, icon: 'book' },
        { id: 'b', title: 'Sans icône', target: 1, icon: 'rocket' },
        { id: 'c', title: '', target: 1, icon: 'book' },
      ]),
    ).toEqual([{ id: 'a', title: 'Dalail', target: 41, icon: 'book' }]);
  });

  it('keeps every feature on unless it is explicitly turned off', () => {
    expect(parseFeatures({})).toEqual({ tasbih: true, photo: true, audio: true });
    expect(parseFeatures({ tasbih: false, photo: 'no' }).tasbih).toBeFalse();
  });

  it('falls back to French, then to the built-in texts', () => {
    expect(parseTexts(null)).toEqual(DEFAULT_TEXTS);
    const texts = parseTexts({ help: { fr: 'Un.\n\n  Deux.  ', en: '', ar: 'واحد' } });
    expect(paragraphs(localizedText(texts.help, 'en'))).toEqual(['Un.', 'Deux.']);
    expect(localizedText(texts.help, 'ar')).toBe('واحد');
    expect(paragraphs(localizedText(texts.conditions, 'fr'))).toEqual([]);
  });
});

import {
  DEFAULT_DONATIONS,
  DEFAULT_TEMPLATES,
  DEFAULT_TEXTS,
  localizedText,
  paragraphs,
  templateDescription,
  templateExplanation,
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
    ).toEqual([
      {
        id: 'a',
        title: 'Dalail',
        target: 41,
        icon: 'book',
        text: { ar: '', latin: '', fr: '', en: '' },
      },
    ]);
    const text = {
      fr: ' Prière sur le Prophète ',
      en: '',
      ar: ' اللهم صل على محمد ',
      latin: ' Allahumma salli ',
    };
    expect(
      parseTemplates([{ id: 'salat', title: 'Salat', target: 1000, icon: 'prayer', text }])[0].text,
    ).toEqual({
      ar: 'اللهم صل على محمد',
      latin: 'Allahumma salli',
      fr: 'Prière sur le Prophète',
      en: '',
    });
  });

  it('keeps the formula, its pronunciation and the explanation together', () => {
    const text = {
      ar: 'أَسْتَغْفِرُ اللهَ',
      latin: 'Astaghfirullāh',
      fr: 'Demande de pardon.',
      en: 'Asking forgiveness.',
    };
    expect(templateExplanation(text, 'en')).toBe('Asking forgiveness.');
    expect(templateExplanation(text, 'ar')).toBe('Demande de pardon.');
    expect(templateDescription(text, 'fr')).toBe(
      'أَسْتَغْفِرُ اللهَ\n\nAstaghfirullāh\n\nDemande de pardon.',
    );
    expect(templateDescription({ ar: '', latin: '', fr: '', en: '' }, 'fr')).toBe('');
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

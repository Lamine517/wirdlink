import { publicationContentType, publicationExtension } from './media-file';

describe('Publication media types', () => {
  it('accepts common phone photo and voice types', () => {
    expect(
      publicationContentType('image', new File(['photo'], 'photo.jpg', { type: 'image/jpg' })),
    ).toBe('image/jpeg');
    expect(
      publicationContentType('audio', new File(['voice'], 'voice.m4a', { type: 'audio/x-m4a' })),
    ).toBe('audio/mp4');
    expect(publicationContentType('audio', new File(['voice'], 'voice.m4a', { type: '' }))).toBe(
      'audio/mp4',
    );
    expect(publicationExtension('audio/mp4')).toBe('m4a');
  });

  it('rejects a declared type outside the publication formats', () => {
    expect(
      publicationContentType('image', new File(['svg'], 'photo.svg', { type: 'image/svg+xml' })),
    ).toBeNull();
    expect(
      publicationContentType('audio', new File(['aac'], 'voice.aac', { type: 'audio/aac' })),
    ).toBeNull();
  });
});

import { isShareableAddress } from './share-address';

describe('Public share address', () => {
  it('does not offer a phone QR for a loopback address', () => {
    for (const url of [
      'http://localhost:4200',
      'http://127.0.0.1',
      'http://[::1]',
      'https://demo.localhost',
    ])
      expect(isShareableAddress(url)).toBeFalse();
    expect(isShareableAddress('https://example.com/wird/salat')).toBeTrue();
    expect(isShareableAddress('javascript:alert(1)')).toBeFalse();
    expect(isShareableAddress('https://user:password@example.com')).toBeFalse();
  });
});

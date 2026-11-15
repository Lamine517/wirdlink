export function isShareableAddress(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ['https:', 'http:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].includes(url.hostname) &&
      !url.hostname.endsWith('.localhost') &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

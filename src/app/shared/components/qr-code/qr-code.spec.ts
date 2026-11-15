import { TestBed } from '@angular/core/testing';
import { QrCode } from './qr-code';

describe('Local QR generation', () => {
  it('renders a QR image from a public URL without a remote QR service', async () => {
    const fixture = TestBed.createComponent(QrCode);
    fixture.componentRef.setInput('value', 'https://example.com/wird/salat');
    fixture.detectChanges();
    await fixture.whenStable();
    for (let attempt = 0; attempt < 50 && !fixture.nativeElement.querySelector('img'); attempt++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();
    }
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image?.src.startsWith('data:image/png;base64,')).toBeTrue();
  });
});

import { TestBed } from '@angular/core/testing';
import { ShareActions, socialShareUrl } from './share-actions';

describe('Share actions', () => {
  it('rejects local or unsafe addresses and encodes the complete invited link', () => {
    for (const value of [
      'javascript:alert(1)',
      'http://localhost:4200/wird/test',
      'https://user:password@example.com/',
    ]) {
      expect(socialShareUrl('whatsapp', value)).toBeNull();
    }
    const url = 'https://wird.example/wird/abc?invitation=abc%2Fdef';
    const telegram = new URL(socialShareUrl('telegram', url)!);
    expect(telegram.searchParams.get('url')).toBe(url);
    expect(socialShareUrl('sms', url)).toContain('sms:?body=');
  });

  it('reports clipboard failure and keeps the URL selectable', async () => {
    const fixture = TestBed.createComponent(ShareActions);
    fixture.componentRef.setInput('url', 'https://wird.example/wird/test');
    fixture.componentRef.setInput('panelId', 'test-share');
    fixture.detectChanges();
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('Denied'));
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Copier le lien'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sélectionnez le lien');
    expect(fixture.nativeElement.querySelector('input').value).toBe(
      'https://wird.example/wird/test',
    );
  });
});

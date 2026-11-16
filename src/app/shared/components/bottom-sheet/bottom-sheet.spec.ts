import { TestBed } from '@angular/core/testing';
import { BottomSheet } from './bottom-sheet';

describe('Bottom sheet mobile viewport', () => {
  beforeEach(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    TestBed.configureTestingModule({ imports: [BottomSheet] });
  });

  for (const width of [320, 430, 600]) {
    it(`fills a ${width}px mobile viewport rather than inheriting the desktop frame`, () => {
      const fixture = TestBed.createComponent(BottomSheet);
      fixture.componentRef.setInput('title', 'Filtres');
      fixture.componentRef.setInput('panelId', 'viewport-test');
      fixture.detectChanges();
      const frame = document.createElement('iframe');
      frame.title = 'Mobile sheet test viewport';
      frame.style.cssText = `position:fixed;left:-2000px;top:0;width:${width}px;height:800px;border:0`;
      document.body.appendChild(frame);
      const viewport = frame.contentDocument!;
      const variables = viewport.createElement('style');
      variables.textContent = `
        :root { --app-frame-width:390px; --app-frame-height:844px; --app-frame-radius:28px; }
        html, body { margin:0; overflow:hidden; }
      `;
      viewport.head.appendChild(variables);
      for (const style of document.querySelectorAll('style')) {
        if (style.textContent?.includes('.bottom-sheet'))
          viewport.head.appendChild(style.cloneNode(true));
      }
      viewport.body.appendChild(fixture.nativeElement);
      try {
        fixture.componentInstance.open();
        fixture.detectChanges();
        const dialog = viewport.querySelector<HTMLDialogElement>('dialog')!;
        const bounds = dialog.getBoundingClientRect();
        const panel = viewport
          .querySelector<HTMLElement>('.bottom-sheet__panel')!
          .getBoundingClientRect();
        expect(dialog.open).toBeTrue();
        expect(bounds.width).toBeCloseTo(width, 0);
        expect(bounds.left).toBe(0);
        expect(bounds.height).toBeCloseTo(800, 0);
        expect(panel.width).toBeLessThanOrEqual(width);
        expect(panel.bottom).toBeLessThanOrEqual(800);
        fixture.componentInstance.close();
      } finally {
        fixture.destroy();
        frame.remove();
      }
    });
  }
});

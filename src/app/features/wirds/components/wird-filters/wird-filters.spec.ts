import { TestBed } from '@angular/core/testing';
import { WirdFilters } from './wird-filters';

describe('Wird filters', () => {
  it('shows active filters as removable chips with a count badge', () => {
    const fixture = TestBed.createComponent(WirdFilters);
    fixture.componentRef.setInput('resultCount', 2);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.filter-chips')).toBeNull();
    expect(element.querySelector('.filter-badge')).toBeNull();

    fixture.componentInstance.recurrence.set('Chaque vendredi');
    fixture.componentInstance.visibility.set('private');
    fixture.detectChanges();
    const chips = [...element.querySelectorAll('.filter-chips__chip')];
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual([
      'Chaque vendredi',
      'Avec un code',
    ]);
    expect(element.querySelector('.filter-badge')?.textContent).toBe('2');

    (chips[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.recurrence()).toBe('all');
    expect(element.querySelector('.filter-badge')?.textContent).toBe('1');

    fixture.componentInstance.recurrence.set('Une fois');
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.filter-chips__clear')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.visibility()).toBe('all');
    expect(element.querySelector('.filter-chips')).toBeNull();
  });
});

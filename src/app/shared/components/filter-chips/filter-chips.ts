import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Translate } from '../../pipes/translate';
import { Icon } from '../icon/icon';

export interface FilterChip {
  id: string;
  label: string;
}

@Component({
  selector: 'app-filter-chips',
  imports: [Translate, Icon],
  template: `@if (chips().length) {
    <ul class="filter-chips" [attr.aria-label]="'Filtres actifs' | t">
      @for (chip of chips(); track chip.id) {
        <li>
          <button
            type="button"
            class="filter-chips__chip"
            [attr.aria-label]="'Retirer le filtre {label}' | t: { label: (chip.label | t) }"
            (click)="removed.emit(chip.id)"
          >
            {{ chip.label | t }}<app-icon name="close" [size]="16" />
          </button>
        </li>
      }
      @if (chips().length > 1) {
        <li>
          <button type="button" class="filter-chips__clear" (click)="cleared.emit()">
            {{ 'Tout effacer' | t }}
          </button>
        </li>
      }
    </ul>
  }`,
  styles: `
    :host {
      display: block;
    }
    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-8);
      margin: var(--space-8) 0 var(--space-12);
      padding: 0;
      list-style: none;
    }
    .filter-chips__chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 40px;
      padding: 0 var(--space-12);
      border: 0;
      border-radius: 999px;
      background: var(--color-primary);
      color: var(--color-text-inverse);
      font: inherit;
      font-size: var(--font-size-small);
      font-weight: 800;
      cursor: pointer;
    }
    .filter-chips__clear {
      min-height: 40px;
      padding: 0 var(--space-8);
      border: 0;
      background: transparent;
      color: var(--color-primary);
      font: inherit;
      font-size: var(--font-size-small);
      font-weight: 800;
      text-decoration: underline;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChips {
  readonly chips = input.required<readonly FilterChip[]>();
  readonly removed = output<string>();
  readonly cleared = output<void>();
}

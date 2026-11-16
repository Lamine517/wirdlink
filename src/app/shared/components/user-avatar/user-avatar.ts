import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  template: '<span aria-hidden="true">{{ initial() }}</span>',
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-accent);
      color: var(--color-text-on-accent);
      font-size: var(--font-size-body);
      font-weight: 800;
      line-height: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatar {
  readonly name = input('');
  protected readonly initial = computed(() => {
    const first = Array.from(this.name().trim())[0];
    return first ? first.toLocaleUpperCase('fr').slice(0, 2) : 'U';
  });
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICON_FILES = {
  world: 'globe',
  more: 'dots-three',
  edit: 'pencil-simple',
  trash: 'trash',
  signOut: 'sign-out',
  home: 'house',
  hand: 'hand',
  plus: 'plus',
  users: 'users-three',
  lock: 'lock-key',
  search: 'magnifying-glass',
  next: 'caret-right',
  prayer: 'hands-praying',
  book: 'book-open',
  heart: 'heart',
  sparkle: 'sparkle',
  check: 'check',
  play: 'play',
  pause: 'pause',
  speaker: 'speaker-high',
  copy: 'copy',
  whatsapp: 'whatsapp-logo',
  facebook: 'facebook-logo',
  telegram: 'telegram-logo',
  phone: 'device-mobile',
  sms: 'chat-circle',
  share: 'share-network',
  warning: 'warning-circle',
  offline: 'wifi-slash',
  settings: 'gear-six',
  tap: 'hand-tap',
  undo: 'arrow-counter-clockwise',
  back: 'caret-left',
  calendar: 'calendar',
  microphone: 'microphone',
  image: 'image-square',
  filter: 'funnel-simple',
  minus: 'minus',
  clock: 'clock',
  close: 'x',
} as const;
export type IconName = keyof typeof ICON_FILES;

@Component({
  selector: 'app-icon',
  template:
    '<span class="icon" [style.mask-image]="mask()" [style.-webkit-mask-image]="mask()"></span>',
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .icon {
      display: block;
      width: 100%;
      height: 100%;
      background: currentColor;
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
      -webkit-mask-size: contain;
    }
  `,
  host: { 'aria-hidden': 'true', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
  protected readonly mask = computed(
    () => `url("assets/icons/phosphor/${ICON_FILES[this.name()]}.svg")`,
  );
}

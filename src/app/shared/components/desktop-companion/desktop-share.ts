import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShareActions } from '../share-actions/share-actions';

@Component({
  selector: 'app-desktop-share',
  imports: [ShareActions],
  templateUrl: './desktop-share.html',
  styles: ':host { display:block; max-width:300px; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopShare {
  readonly url = input.required<string>();
  readonly isWird = input(false);
}

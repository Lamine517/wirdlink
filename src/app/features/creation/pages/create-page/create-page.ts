import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-create-page',
  imports: [EmptyState],
  templateUrl: './create-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePage {}

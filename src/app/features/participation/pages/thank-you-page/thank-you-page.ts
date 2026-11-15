import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { CircularProgress } from '../../../../shared/components/circular-progress/circular-progress';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-thank-you-page',
  imports: [RouterLink, DecimalPipe, CircularProgress, Icon, EmptyState],
  templateUrl: './thank-you-page.html',
  styleUrl: './thank-you-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThankYouPage {
  protected readonly store = inject(WirdStore);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly selected = computed(() =>
    this.store.wirds().find((wird) => wird.id === this.params().get('id')),
  );
}

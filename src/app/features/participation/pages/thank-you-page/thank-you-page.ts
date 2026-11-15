import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { BeadProgress } from '../../../../shared/components/bead-progress/bead-progress';

@Component({
  selector: 'app-thank-you-page',
  imports: [RouterLink, DecimalPipe, BeadProgress],
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

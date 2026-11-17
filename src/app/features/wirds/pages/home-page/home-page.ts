import { Translate } from '../../../../shared/pipes/translate';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { WirdAccess } from '../../../access/data-access/wird-access';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { InstallApp } from '../../../../shared/components/install-app/install-app';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Wird, WirdStore } from '../../../../core/wird-store';
import { dakarToday, wirdPhase } from '../../../../core/wird-cycle';
import { Icon } from '../../../../shared/components/icon/icon';
import { WirdCard } from '../../components/wird-card/wird-card';
import {
  VisibilityFilter,
  RecurrenceFilter,
  WirdFilters,
} from '../../components/wird-filters/wird-filters';

@Component({
  selector: 'app-home-page',
  imports: [
    Translate,
    RequestState,
    RouterLink,
    EmptyState,
    WirdCard,
    WirdFilters,
    Icon,
    UserAvatar,
    InstallApp,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly auth = inject(AuthFlow);
  protected readonly store = inject(WirdStore);
  private readonly access = inject(WirdAccess);
  protected readonly visibility = signal<VisibilityFilter>('all');
  protected readonly recurrence = signal<RecurrenceFilter>('all');
  protected readonly showFinished = signal(false);
  protected readonly today = dakarToday();
  protected readonly filtered = computed(() => this.recurrence() !== 'all' || this.visibility() !== 'all');
  private readonly matchingWirds = computed(() =>
    this.store
      .wirds()
      .filter(
        (wird) =>
          this.access.canRead(wird.id) &&
          (this.recurrence() === 'all' || wird.recurrence === this.recurrence()) &&
          (this.visibility() === 'all' || wird.visibility === this.visibility()),
      ),
  );
  private readonly closed = (wird: Wird) =>
    wirdPhase(wird, this.store.completed(wird.id), this.today).kind === 'closed';
  protected readonly visibleWirds = computed(() =>
    this.matchingWirds().filter((wird) => !this.closed(wird)),
  );
  protected readonly finishedWirds = computed(() =>
    this.matchingWirds().filter((wird) => this.closed(wird)),
  );

  constructor() {
    void this.store.refresh();
  }

  protected resetFilters(): void {
    this.visibility.set('all');
    this.recurrence.set('all');
  }
}

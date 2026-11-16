import { WirdAccess } from '../../../access/data-access/wird-access';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { InstallApp } from '../../../../shared/components/install-app/install-app';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { WirdStore } from '../../../../core/wird-store';
import { Icon } from '../../../../shared/components/icon/icon';
import { WirdCard } from '../../components/wird-card/wird-card';
import {
  VisibilityFilter,
  RecurrenceFilter,
  WirdFilters,
  WirdStatus,
} from '../../components/wird-filters/wird-filters';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, EmptyState, WirdCard, WirdFilters, Icon, UserAvatar, InstallApp],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly auth = inject(AuthFlow);
  protected readonly store = inject(WirdStore);
  private readonly access = inject(WirdAccess);
  protected readonly visibility = signal<VisibilityFilter>('all');
  protected readonly status = signal<WirdStatus>('active');
  protected readonly recurrence = signal<RecurrenceFilter>('all');
  protected readonly visibleWirds = computed(() =>
    this.store.wirds().filter((wird) => {
      const finished = this.store.completed(wird.id) >= wird.target;
      const matchesStatus =
        this.status() === 'all' || (this.status() === 'finished' ? finished : !finished);
      return (
        this.access.canRead(wird.id) &&
        matchesStatus &&
        (this.recurrence() === 'all' || wird.recurrence === this.recurrence()) &&
        (this.visibility() === 'all' || wird.visibility === this.visibility())
      );
    }),
  );

  protected resetFilters(): void {
    this.visibility.set('all');
    this.status.set('active');
    this.recurrence.set('all');
  }
}

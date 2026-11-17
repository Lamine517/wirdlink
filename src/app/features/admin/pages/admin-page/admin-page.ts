import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { PassService } from '../../../../core/pass/pass-service';
import { AdminApi, AdminOverview } from '../../data-access/admin-api';
import { AdminCreators } from '../../components/admin-creators/admin-creators';
import { AdminSettings } from '../../components/admin-settings/admin-settings';
import { AdminTeam } from '../../components/admin-team/admin-team';

type AdminTab = 'numbers' | 'creators' | 'settings' | 'team';

@Component({
  selector: 'app-admin-page',
  imports: [DecimalPipe, BackButton, RequestState, AdminCreators, AdminSettings, AdminTeam],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  private readonly api = inject(AdminApi);
  protected readonly tabs: { id: AdminTab; label: string }[] = [
    { id: 'numbers', label: 'Chiffres' },
    { id: 'creators', label: 'Créateurs' },
    { id: 'settings', label: 'Réglages' },
    { id: 'team', label: 'Équipe' },
  ];
  protected readonly tab = signal<AdminTab>('numbers');
  protected readonly overview = signal<AdminOverview | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    void inject(PassService).loadSettings(true);
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.overview.set(await this.api.overview());
    } catch {
      this.error.set('Impossible de charger le back office. Réessayez.');
    } finally {
      this.loading.set(false);
    }
  }
}

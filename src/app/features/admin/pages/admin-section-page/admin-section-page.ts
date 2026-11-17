import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { PassService } from '../../../../core/pass/pass-service';
import { AdminApi, AdminOverview } from '../../data-access/admin-api';
import { ADMIN_PATH } from '../../data-access/admin-guard';
import { adminSection } from '../../data-access/admin-sections';
import { AdminCreators } from '../../components/admin-creators/admin-creators';
import { AdminSettings } from '../../components/admin-settings/admin-settings';
import { AdminTeam } from '../../components/admin-team/admin-team';
import { AdminWirds } from '../../components/admin-wirds/admin-wirds';
import { AdminDonations } from '../../components/admin-donations/admin-donations';
import { AdminTemplates } from '../../components/admin-templates/admin-templates';
import { AdminTexts } from '../../components/admin-texts/admin-texts';
import { AdminFeatures } from '../../components/admin-features/admin-features';

@Component({
  selector: 'app-admin-section-page',
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    BackButton,
    RequestState,
    AdminCreators,
    AdminSettings,
    AdminTeam,
    AdminWirds,
    AdminDonations,
    AdminTemplates,
    AdminTexts,
    AdminFeatures,
  ],
  templateUrl: './admin-section-page.html',
  styleUrl: './admin-section-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSectionPage {
  private readonly api = inject(AdminApi);
  protected readonly menu = `/${ADMIN_PATH}`;
  private readonly sectionId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('section'))),
  );
  protected readonly section = computed(() => adminSection(this.sectionId()));
  protected readonly overview = signal<AdminOverview | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() {
    void inject(PassService).loadSettings(true);
    effect(() => {
      const id = this.section()?.id;
      if ((id === 'chiffres' || id === 'createurs') && !this.overview()) void this.load();
    });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.overview.set(await this.api.overview());
    } catch {
      this.error.set('Impossible de charger ces informations. Réessayez.');
    } finally {
      this.loading.set(false);
    }
  }
}

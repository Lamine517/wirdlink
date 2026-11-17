import { Translate } from '../../../../shared/pipes/translate';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { CreationDraftStore } from '../../../creation/data-access/creation-draft';
import { NetworkStatus } from '../../../../core/services/network-status';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { Icon } from '../../../../shared/components/icon/icon';
import { WirdStore } from '../../../../core/wird-store';
import { PassService } from '../../../../core/pass/pass-service';
import { ADMIN_PATH } from '../../../admin/data-access/admin-guard';
import type { CreatorStats as CreatorStatsData } from '../../../../core/services/wird-repository';
import { CreatorStats } from '../../components/creator-stats/creator-stats';

@Component({
  selector: 'app-profile-page',
  imports: [
    Translate,
    RouterLink,
    BackButton,
    BottomSheet,
    RequestState,
    UserAvatar,
    Icon,
    CreatorStats,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly auth = inject(AuthFlow);
  protected readonly network = inject(NetworkStatus);
  private readonly draft = inject(CreationDraftStore);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal(
    inject(Router).currentNavigation()?.extras.state?.['profileSaved'] === true
      ? 'Profil enregistré.'
      : '',
  );
  protected readonly deleting = signal(false);
  protected readonly deletionError = signal('');
  private readonly store = inject(WirdStore);
  protected readonly passes = inject(PassService);
  protected readonly adminLink = '/' + ADMIN_PATH;
  protected readonly stats = signal<CreatorStatsData | null>(null);
  protected readonly ownedWirds = computed(() =>
    this.store.wirds().filter((wird) => wird.isOwner === true),
  );
  private readonly userId = computed(() => this.auth.session()?.id ?? null);

  constructor() {
    effect((onCleanup) => {
      const id = this.userId();
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.stats.set(null);
      if (!id) {
        this.passes.clear();
        return;
      }
      void this.passes.loadSettings();
      void this.passes.loadStatus();
      this.store
        .creatorStats()
        .then((stats) => {
          if (active) this.stats.set(stats);
        })
        .catch(() => undefined);
    });
  }

  protected async signOutConfirmed(sheet: BottomSheet): Promise<void> {
    await this.signOut();
    if (!this.auth.session()) sheet.close();
  }

  protected async signOut(): Promise<void> {
    if (this.busy() || this.deleting() || !this.network.online()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.signOut();
      this.message.set('Vous êtes déconnecté.');
    } catch {
      this.error.set('Impossible de vous déconnecter. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async deleteAccount(sheet: BottomSheet): Promise<void> {
    if (this.deleting() || this.busy() || !this.auth.session() || !this.network.online()) return;
    this.deleting.set(true);
    this.deletionError.set('');
    try {
      await this.auth.deleteAccount();
      this.draft.discard();
      sheet.close();
      this.message.set('Votre compte a été supprimé.');
    } catch {
      this.deletionError.set('La suppression n’est pas terminée. Réessayez pour la finaliser.');
    } finally {
      this.deleting.set(false);
    }
  }
}

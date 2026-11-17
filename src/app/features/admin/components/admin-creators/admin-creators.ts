import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { Icon } from '../../../../shared/components/icon/icon';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PassError, PassKind, PassService } from '../../../../core/pass/pass-service';
import { AdminApi, AdminCreator, AdminOverview, AdminPass } from '../../data-access/admin-api';

export const PASS_LABELS: Record<PassKind, string> = {
  trial: 'Essai',
  month: 'Pass mois',
  year: 'Pass année',
  founder: 'Pass fondateur',
};

@Component({
  selector: 'app-admin-creators',
  imports: [DecimalPipe, ReactiveFormsModule, BottomSheet, Icon, UserAvatar, EmptyState],
  templateUrl: './admin-creators.html',
  styleUrl: './admin-creators.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCreators {
  private readonly api = inject(AdminApi);
  private readonly host = inject(ElementRef);
  protected readonly settings = inject(PassService).settings;
  readonly overview = input.required<AdminOverview>();
  readonly changed = output<void>();
  protected readonly labels = PASS_LABELS;
  protected readonly kinds: PassKind[] = ['month', 'year', 'founder', 'trial'];
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly searching = computed(() => this.query().trim().length > 0);
  protected readonly creators = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('fr');
    return this.overview().creators.filter(
      (creator) =>
        !query ||
        [creator.name, creator.organization, creator.contact].some((value) =>
          value.toLocaleLowerCase('fr').includes(query),
        ),
    );
  });

  protected readonly selected = signal<AdminCreator | null>(null);
  protected readonly kind = signal<PassKind>('year');
  protected readonly amount = new FormControl(0, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(0), Validators.max(10_000_000)],
  });
  protected readonly note = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(200)],
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly revoking = signal<AdminPass | null>(null);

  protected clearSearch(): void {
    this.search.setValue('');
  }

  protected focusCreators(): void {
    const field = this.host.nativeElement.querySelector('#admin-search') as HTMLElement | null;
    field?.scrollIntoView({ block: 'center' });
    field?.focus();
  }

  protected priceOf(kind: PassKind): number {
    const settings = this.settings();
    if (kind === 'month') return settings.monthPrice;
    if (kind === 'year') return settings.yearPrice;
    if (kind === 'founder') return settings.founderPrice;
    return 0;
  }

  protected chooseKind(kind: PassKind): void {
    this.kind.set(kind);
    this.amount.setValue(this.priceOf(kind));
  }

  protected openGrant(creator: AdminCreator, sheet: BottomSheet): void {
    this.selected.set(creator);
    this.error.set('');
    this.note.setValue('');
    this.chooseKind('year');
    sheet.open();
  }

  protected async grant(sheet: BottomSheet): Promise<void> {
    const creator = this.selected();
    if (!creator || this.busy() || this.amount.invalid || this.note.invalid) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.grantPass(creator.id, this.kind(), this.amount.value, this.note.value);
      sheet.close();
      this.changed.emit();
    } catch (error) {
      this.error.set(
        error instanceof PassError && error.code === 'founders_full'
          ? 'Toutes les places de fondateur sont prises.'
          : 'Le pass n’a pas pu être enregistré. Réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected openRevoke(pass: AdminPass, sheet: BottomSheet): void {
    this.revoking.set(pass);
    this.error.set('');
    sheet.open();
  }

  protected async revoke(sheet: BottomSheet): Promise<void> {
    const pass = this.revoking();
    if (!pass || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.revokePass(pass.id);
      sheet.close();
      this.changed.emit();
    } catch {
      this.error.set('Le pass n’a pas pu être annulé. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  protected date(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value + 'T00:00:00Z'));
  }
}

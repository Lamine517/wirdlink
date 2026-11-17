import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { PassError } from '../../../../core/pass/pass-service';
import { AdminApi, AdminWird } from '../../data-access/admin-api';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Reads the wird id from a shared link such as https://…/wird/<id> or /acces/<id>. */
export function wirdIdFromLink(value: string): string | null {
  return value.match(UUID)?.[0].toLowerCase() ?? null;
}

@Component({
  selector: 'app-admin-wirds',
  imports: [ReactiveFormsModule, BottomSheet],
  templateUrl: './admin-wirds.html',
  styleUrls: ['../../admin-form.scss', './admin-wirds.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminWirds {
  private readonly api = inject(AdminApi);
  protected readonly wirds = signal<AdminWird[]>([]);
  protected readonly loaded = signal(false);
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly visible = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('fr');
    return this.wirds().filter(
      (wird) =>
        !query ||
        [wird.title, wird.author, wird.description].some((value) =>
          value.toLocaleLowerCase('fr').includes(query),
        ),
    );
  });
  protected readonly link = new FormControl('', { nonNullable: true });
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(200)],
  });
  protected readonly target = signal<{ id: string; label: string } | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.wirds.set(await this.api.wirds());
    } catch {
      this.error.set('Impossible de charger les wirds. Réessayez.');
    } finally {
      this.loaded.set(true);
    }
  }

  protected label(wird: AdminWird): string {
    return wird.title || 'Wird avec code';
  }

  protected openHide(wird: AdminWird, sheet: BottomSheet): void {
    this.target.set({ id: wird.id, label: this.label(wird) });
    this.reason.setValue(wird.reason);
    this.error.set('');
    sheet.open();
  }

  protected openHideByLink(sheet: BottomSheet): void {
    const id = wirdIdFromLink(this.link.value);
    this.error.set('');
    if (!id) {
      this.error.set('Collez le lien complet du wird.');
      return;
    }
    const known = this.wirds().find((wird) => wird.id === id);
    this.target.set({ id, label: known ? this.label(known) : 'Wird du lien collé' });
    this.reason.setValue(known?.reason ?? '');
    sheet.open();
  }

  protected async hide(sheet: BottomSheet): Promise<void> {
    const target = this.target();
    if (!target || this.busy() || this.reason.invalid) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.hideWird(target.id, this.reason.value.trim());
      sheet.close();
      this.link.reset();
      await this.load();
    } catch (error) {
      this.error.set(
        error instanceof PassError && error.code === 'wird_not_found'
          ? 'Aucun wird ne correspond à ce lien.'
          : 'Le wird n’a pas pu être masqué. Réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async unhide(wird: AdminWird): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.unhideWird(wird.id);
      await this.load();
    } catch {
      this.error.set('Le wird n’a pas pu être réaffiché. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  protected date(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(date);
  }
}

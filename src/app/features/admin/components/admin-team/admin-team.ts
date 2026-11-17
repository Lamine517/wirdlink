import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { Icon } from '../../../../shared/components/icon/icon';
import { PassError } from '../../../../core/pass/pass-service';
import { AdminApi, AdminMember } from '../../data-access/admin-api';

const ERRORS: Record<string, string> = {
  member_not_found:
    'Aucun compte WirdLink avec cet e-mail ou ce numéro. La personne doit d’abord se connecter une fois.',
  last_admin: 'Il faut garder au moins une personne dans l’équipe.',
};

@Component({
  selector: 'app-admin-team',
  imports: [ReactiveFormsModule, BottomSheet, Icon],
  templateUrl: './admin-team.html',
  styleUrl: './admin-team.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTeam {
  private readonly api = inject(AdminApi);
  protected readonly members = signal<AdminMember[]>([]);
  protected readonly contact = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(254)],
  });
  protected readonly removing = signal<AdminMember | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.members.set(await this.api.team());
    } catch {
      this.error.set('Impossible de charger l’équipe. Réessayez.');
    }
  }

  private fail(error: unknown, fallback: string): void {
    this.error.set((error instanceof PassError && ERRORS[error.code]) || fallback);
  }

  protected async add(): Promise<void> {
    this.error.set('');
    this.message.set('');
    if (this.contact.invalid || this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.addMember(this.contact.value.trim());
      this.contact.reset();
      this.message.set('Personne ajoutée à l’équipe.');
      await this.load();
    } catch (error) {
      this.fail(error, 'La personne n’a pas pu être ajoutée. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  protected openRemove(member: AdminMember, sheet: BottomSheet): void {
    this.removing.set(member);
    this.error.set('');
    this.message.set('');
    sheet.open();
  }

  protected async remove(sheet: BottomSheet): Promise<void> {
    const member = this.removing();
    if (!member || this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.removeMember(member.id);
      sheet.close();
      await this.load();
    } catch (error) {
      sheet.close();
      this.fail(error, 'La personne n’a pas pu être retirée. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }
}

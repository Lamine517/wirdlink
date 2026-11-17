import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Translate } from '../../../../shared/pipes/translate';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { Icon } from '../../../../shared/components/icon/icon';
import { I18nService } from '../../../../core/services/i18n';

const MIN = 100;
const MAX = 500_000;
const DONATION_NUMBER = '765578379';

type Method = 'wave' | 'orange';

const METHODS: Record<Method, { name: string; logo: string; hint: string }> = {
  wave: {
    name: 'Wave',
    logo: 'assets/brand/wave.png',
    hint: 'Ouvrez Wave, touchez Envoyer, puis collez le numéro.',
  },
  orange: {
    name: 'Orange Money',
    logo: 'assets/brand/om.png',
    hint: 'Ouvrez Max it ou composez #144#, choisissez Transfert d’argent, puis collez le numéro.',
  },
};

@Component({
  selector: 'app-support-page',
  imports: [Translate, BackButton, BottomSheet, Icon, ReactiveFormsModule, DecimalPipe],
  templateUrl: './support-page.html',
  styleUrl: './support-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage {
  protected readonly amounts = [500, 1000, 2000, 5000];
  protected readonly methods = (Object.keys(METHODS) as Method[]).map((id) => ({ id, ...METHODS[id] }));
  protected readonly selected = signal<number | null>(1000);
  protected readonly method = signal<Method>('wave');
  protected readonly custom = new FormControl('', { nonNullable: true });
  private readonly customValue = toSignal(this.custom.valueChanges, { initialValue: '' });
  protected readonly number = DONATION_NUMBER.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  protected readonly android = /android/i.test(navigator.userAgent);
  protected readonly copied = signal(false);
  protected readonly current = computed(() => METHODS[this.method()]);

  protected readonly amount = computed(() => {
    const typed = this.customValue().replace(/\s/g, '');
    return typed ? Number(typed) : this.selected();
  });
  protected readonly valid = computed(() => {
    const amount = this.amount();
    return amount !== null && Number.isSafeInteger(amount) && amount >= MIN && amount <= MAX;
  });
  protected readonly limits = { min: MIN, max: MAX };
  private readonly i18n = inject(I18nService);

  protected format(value: number | null): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value ?? 0);
  }

  protected choose(amount: number): void {
    this.selected.set(amount);
    this.custom.setValue('');
  }

  protected select(method: Method): void {
    this.method.set(method);
    this.copied.set(false);
  }

  protected async copyNumber(): Promise<void> {
    try {
      await navigator.clipboard.writeText(DONATION_NUMBER);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}

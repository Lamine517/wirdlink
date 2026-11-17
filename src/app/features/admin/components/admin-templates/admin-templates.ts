import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import {
  AppConfig,
  TEMPLATE_ICONS,
  TemplateIcon,
  WirdTemplate,
} from '../../../../core/config/app-config';
import { AdminApi } from '../../data-access/admin-api';

const MAX_TEMPLATES = 12;

export const ICON_LABELS: Record<TemplateIcon, string> = {
  prayer: 'Mains en prière',
  book: 'Livre',
  heart: 'Cœur',
  tap: 'Toucher',
  hand: 'Main',
  calendar: 'Calendrier',
  clock: 'Horloge',
  bell: 'Cloche',
  users: 'Groupe',
};

function templateGroup(template: WirdTemplate) {
  return new FormGroup({
    id: new FormControl(template.id, { nonNullable: true }),
    title: new FormControl(template.title, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    target: new FormControl(template.target, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(2147483647)],
    }),
    icon: new FormControl<TemplateIcon>(template.icon, { nonNullable: true }),
    text: new FormGroup({
      ar: new FormControl(template.text.ar, {
        nonNullable: true,
        validators: [Validators.maxLength(1000)],
      }),
      latin: new FormControl(template.text.latin, {
        nonNullable: true,
        validators: [Validators.maxLength(1000)],
      }),
      fr: new FormControl(template.text.fr, {
        nonNullable: true,
        validators: [Validators.maxLength(1000)],
      }),
      en: new FormControl(template.text.en, {
        nonNullable: true,
        validators: [Validators.maxLength(1000)],
      }),
    }),
  });
}

@Component({
  selector: 'app-admin-templates',
  imports: [ReactiveFormsModule, Icon, EmptyState],
  templateUrl: './admin-templates.html',
  styleUrls: ['../../admin-form.scss', './admin-templates.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTemplates {
  private readonly api = inject(AdminApi);
  private readonly config = inject(AppConfig);
  private readonly changes = inject(ChangeDetectorRef);
  protected readonly icons = TEMPLATE_ICONS;
  protected readonly iconLabels = ICON_LABELS;
  protected readonly max = MAX_TEMPLATES;
  protected readonly items = new FormArray<ReturnType<typeof templateGroup>>([]);
  protected readonly ready = signal(false);
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    void this.config.load(true).then(() => this.fill(this.config.templates()));
  }

  private fill(templates: WirdTemplate[]): void {
    this.items.clear();
    for (const template of templates) this.items.push(templateGroup(template));
    this.ready.set(true);
    this.changes.markForCheck();
  }

  protected add(): void {
    if (this.items.length >= MAX_TEMPLATES) return;
    const id = 'modele-' + crypto.randomUUID().slice(0, 8);
    this.items.push(
      templateGroup({
        id,
        title: '',
        target: 100,
        icon: 'book',
        text: { ar: '', latin: '', fr: '', en: '' },
      }),
    );
  }

  protected remove(index: number): void {
    this.items.removeAt(index);
  }

  protected move(index: number, offset: -1 | 1): void {
    const next = index + offset;
    if (next < 0 || next >= this.items.length) return;
    const item = this.items.at(index);
    this.items.removeAt(index);
    this.items.insert(next, item);
  }

  protected async save(): Promise<void> {
    this.message.set('');
    this.error.set('');
    if (this.items.invalid) {
      this.items.markAllAsTouched();
      this.error.set(
        'Chaque modèle doit avoir un nom, un objectif entier supérieur à 0, et des textes d’au plus 1 000 caractères.',
      );
      return;
    }
    if (this.busy()) return;
    const templates: WirdTemplate[] = this.items.getRawValue().map((item) => ({
      ...item,
      title: item.title.trim(),
      target: Math.trunc(item.target),
      text: {
        ar: item.text.ar.trim(),
        latin: item.text.latin.trim(),
        fr: item.text.fr.trim(),
        en: item.text.en.trim(),
      },
    }));
    this.busy.set(true);
    try {
      await this.api.saveSetting('templates', templates);
      await this.config.load(true);
      this.fill(this.config.templates());
      this.message.set('Modèles enregistrés.');
    } catch {
      this.error.set('Les modèles n’ont pas pu être enregistrés. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }
}

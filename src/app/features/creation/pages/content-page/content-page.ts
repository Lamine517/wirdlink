import { Translate } from '../../../../shared/pipes/translate';
import { signal } from '@angular/core';
import { WIRD_REPOSITORY } from '../../../../core/services/wird-repository';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { AppConfig } from '../../../../core/config/app-config';
import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  CreationDraftStore,
  MAX_WIRD_TARGET,
  isContentValid,
} from '../../data-access/creation-draft';
import { CreationSteps } from '../../components/creation-steps/creation-steps';
import { DraftMedia } from '../../components/draft-media/draft-media';

export interface TitleSuggestion {
  title: string;
  target: number | null;
}

export function normalizeTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr');
}

export function filterTitleSuggestions(
  suggestions: readonly TitleSuggestion[],
  query: string,
  limit = 6,
): TitleSuggestion[] {
  const needle = normalizeTitle(query.trim());
  return suggestions
    .filter((item) => {
      const title = normalizeTitle(item.title);
      return title.includes(needle) && title !== needle;
    })
    .slice(0, limit);
}

@Component({
  selector: 'app-content-page',
  imports: [Translate, ReactiveFormsModule, CreationSteps, DraftMedia, DecimalPipe],
  templateUrl: './content-page.html',
  styleUrl: './content-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPage {
  protected readonly store = inject(CreationDraftStore);
  protected readonly targetMaximum = MAX_WIRD_TARGET;
  private readonly router = inject(Router);
  protected readonly form = new FormGroup({
    title: new FormControl(this.store.draft().title, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    description: new FormControl(this.store.draft().description, {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    instructions: new FormControl(this.store.draft().instructions ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    target: new FormControl<number | null>(this.store.draft().target, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_WIRD_TARGET),
    ]),
  });
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly canContinue = computed(() => {
    const value = this.value();
    return isContentValid({
      title: value.title ?? '',
      description: value.description ?? '',
      instructions: value.instructions ?? '',
      target: value.target ?? null,
    });
  });
  protected readonly targetInvalid = computed(() => {
    const value = this.value().target;
    return (
      value !== null &&
      value !== undefined &&
      (!Number.isSafeInteger(value) || value < 1 || value > MAX_WIRD_TARGET)
    );
  });
  private readonly previousTitles = signal<string[]>([]);
  protected readonly suggestionsOpen = signal(false);
  protected readonly activeIndex = signal(-1);
  private readonly templates = inject(AppConfig).templates;
  private readonly templateTargets = computed(
    () => new Set(this.templates().map((item) => item.target)),
  );
  protected readonly catalog = computed<TitleSuggestion[]>(() => {
    const templates = this.templates().map((item) => ({
      title: item.title,
      target: item.target,
    }));
    const known = new Set(templates.map((item) => normalizeTitle(item.title)));
    const previous = this.previousTitles()
      .filter((title) => title.trim() && !known.has(normalizeTitle(title)))
      .map((title) => ({ title, target: null }));
    return [...templates, ...previous];
  });
  protected readonly visibleSuggestions = computed(() =>
    filterTitleSuggestions(this.catalog(), this.value().title ?? ''),
  );
  protected readonly activeSuggestionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? `wird-title-option-${index}` : null;
  });
  private readonly titleField = viewChild<ElementRef<HTMLElement>>('titleField');
  private readonly repository = inject(WIRD_REPOSITORY, { optional: true });
  private readonly auth = inject(AuthFlow);
  constructor() {
    void this.auth.ready.then(async () => {
      const id = this.auth.session()?.id;
      if (!id || !this.repository) return;
      try {
        const titles = await this.repository.titles();
        if (id === this.auth.session()?.id) this.previousTitles.set([...new Set(titles)]);
      } catch {
        /* Suggestions never block writing a title. */
      }
    });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.store.updateContent(this.form.getRawValue()));
  }
  protected openSuggestions(): void {
    this.suggestionsOpen.set(true);
    this.activeIndex.set(-1);
    queueMicrotask(() =>
      this.titleField()?.nativeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' }),
    );
  }

  protected closeSuggestions(): void {
    this.suggestionsOpen.set(false);
    this.activeIndex.set(-1);
  }

  protected onTitleInput(): void {
    this.suggestionsOpen.set(true);
    this.activeIndex.set(-1);
  }

  protected onTitleKeydown(event: KeyboardEvent): void {
    const items = this.visibleSuggestions();
    if (!this.suggestionsOpen() || items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((index) => (index + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === 'Escape') {
      this.closeSuggestions();
    } else if (event.key === 'Enter' && this.activeIndex() >= 0) {
      event.preventDefault();
      this.selectSuggestion(items[this.activeIndex()]);
    }
  }

  protected selectSuggestion(item: TitleSuggestion): void {
    this.form.controls.title.setValue(item.title);
    const current = this.form.controls.target.value;
    if (item.target !== null && (current === null || this.templateTargets().has(current))) {
      this.form.controls.target.setValue(item.target);
    }
    this.closeSuggestions();
  }

  protected continue(): void {
    if (this.canContinue()) void this.router.navigate(['/creer/calendrier']);
  }
  protected selectMedia(event: { kind: 'image' | 'audio'; file: File }): void {
    this.store.setMedia(event.kind, event.file);
  }
}

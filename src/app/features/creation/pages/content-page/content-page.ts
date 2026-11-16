import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CreationDraftStore, isContentValid } from '../../data-access/creation-draft';
import { CreationSteps } from '../../components/creation-steps/creation-steps';
import { DraftMedia } from '../../components/draft-media/draft-media';

@Component({
  selector: 'app-content-page',
  imports: [ReactiveFormsModule, CreationSteps, DraftMedia],
  templateUrl: './content-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPage {
  protected readonly store = inject(CreationDraftStore);
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
    return value !== null && value !== undefined && (!Number.isSafeInteger(value) || value < 1);
  });
  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.store.updateContent(this.form.getRawValue()));
  }
  protected continue(): void {
    if (this.canContinue()) void this.router.navigate(['/creer/calendrier']);
  }
  protected selectMedia(event: { kind: 'image' | 'audio'; file: File }): void {
    this.store.setMedia(event.kind, event.file);
  }
}

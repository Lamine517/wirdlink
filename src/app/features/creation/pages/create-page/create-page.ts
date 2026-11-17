import { Translate } from '../../../../shared/pipes/translate';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  CUSTOM_TEMPLATE,
  CreationDraftStore,
  DraftTemplate,
} from '../../data-access/creation-draft';
import { AppConfig, TemplateIcon } from '../../../../core/config/app-config';

type TemplateChoice = DraftTemplate & { icon: TemplateIcon | 'plus' };

@Component({
  selector: 'app-create-page',
  imports: [Translate, RouterLink, DecimalPipe, Icon, BottomSheet],
  templateUrl: './create-page.html',
  styleUrl: './create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePage {
  protected readonly store = inject(CreationDraftStore);
  private readonly config = inject(AppConfig);
  protected readonly templates = computed<TemplateChoice[]>(() => [
    { ...CUSTOM_TEMPLATE, icon: 'plus' },
    ...this.config.templates(),
  ]);
  private readonly replacementSheet = viewChild.required<BottomSheet>('replacementSheet');
  private readonly pendingTemplate = signal<DraftTemplate | null>(null);
  private readonly router = inject(Router);
  protected choose(template: DraftTemplate): void {
    if (this.store.hasDraft()) {
      this.pendingTemplate.set(template);
      this.replacementSheet().open();
      return;
    }
    this.start(template);
  }

  protected replaceDraft(): void {
    const template = this.pendingTemplate();
    if (!template) return;
    this.replacementSheet().close();
    this.pendingTemplate.set(null);
    this.start(template);
  }

  private start(template: DraftTemplate): void {
    this.store.chooseTemplate(template);
    void this.router.navigate(['/creer/contenu']);
  }
}

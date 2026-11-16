import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { Icon } from '../../../../shared/components/icon/icon';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../data-access/creation-draft';

@Component({
  selector: 'app-create-page',
  imports: [RouterLink, DecimalPipe, Icon, BottomSheet],
  templateUrl: './create-page.html',
  styleUrl: './create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePage {
  protected readonly store = inject(CreationDraftStore);
  protected readonly templateIcons = {
    salat: 'prayer',
    fatiha: 'book',
    istighfar: 'heart',
    tahlil: 'sparkle',
    custom: 'plus',
  } as const;
  protected readonly templates = WIRD_TEMPLATES;
  private readonly replacementSheet = viewChild.required<BottomSheet>('replacementSheet');
  private readonly pendingTemplate = signal<(typeof WIRD_TEMPLATES)[number] | null>(null);
  private readonly router = inject(Router);
  protected choose(template: (typeof WIRD_TEMPLATES)[number]): void {
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

  private start(template: (typeof WIRD_TEMPLATES)[number]): void {
    this.store.chooseTemplate(template);
    void this.router.navigate(['/creer/contenu']);
  }
}

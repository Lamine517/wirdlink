import { Translate } from '../../../shared/pipes/translate';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppConfig, localizedText, paragraphs } from '../../../core/config/app-config';
import { I18nService } from '../../../core/services/i18n';

interface InformationContent {
  title: string;
  paragraphs: string[];
  /** Section the team can rewrite from the back office. */
  editable?: 'help' | 'conditions';
}

@Component({
  selector: 'app-information-page',
  imports: [BackButton, Translate],
  template: `<app-back-button />
    <h1>{{ content().title | t }}</h1>
    @if (written().length) {
      @for (paragraph of written(); track $index) {
        <p>{{ paragraph }}</p>
      }
    } @else {
      @for (paragraph of content().paragraphs; track $index) {
        <p>{{ paragraph | t }}</p>
      }
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly config = inject(AppConfig);
  private readonly i18n = inject(I18nService);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly content = computed(() => this.data() as InformationContent);
  protected readonly written = computed(() => {
    const section = this.content().editable;
    return section
      ? paragraphs(localizedText(this.config.texts()[section], this.i18n.locale()))
      : [];
  });
}

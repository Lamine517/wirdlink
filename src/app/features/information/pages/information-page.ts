import { BackButton } from '../../../shared/components/back-button/back-button';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-information-page',
  imports: [BackButton],
  template: `<app-back-button />
    <h1>{{ content().title }}</h1>
    @for (paragraph of content().paragraphs; track $index) {
      <p>{{ paragraph }}</p>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly content = computed(
    () => this.data() as { title: string; paragraphs: string[] },
  );
}

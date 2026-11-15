import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-information-page',
  imports: [RouterLink],
  template: `<a routerLink="/" class="back-link"
      ><img src="assets/icons/back.svg" alt="" width="24" height="24" />Retour</a
    >
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

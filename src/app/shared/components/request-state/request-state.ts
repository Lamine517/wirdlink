import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-request-state',
  imports: [Translate, Icon],
  template: `@if (loading() && skeleton()) {
      <div class="skeleton" role="status" [attr.aria-label]="loadingLabel() | t" aria-busy="true">
        <span class="skeleton__line skeleton__line--short"></span>
        <span class="skeleton__line"></span>
        <span class="skeleton__block"></span>
        <span class="visually-hidden">{{ loadingLabel() | t }}</span>
      </div>
    } @else if (loading()) {
      <p class="request-state" role="status">
        <span class="request-state__spinner" aria-hidden="true"></span>{{ loadingLabel() | t }}
      </p>
    } @else if (error()) {
      <div class="request-state request-state--error" role="alert">
        <app-icon name="warning" [size]="24" />
        <p>{{ error() | t }}</p>
        @if (retryLabel()) {
          <button
            class="button button--outline button--compact"
            type="button"
            (click)="retry.emit()"
          >
            {{ retryLabel() | t }}
          </button>
        }
      </div>
    }`,
  styles: `
    :host {
      display: block;
    }
    .skeleton {
      display: grid;
      gap: 12px;
      padding-block: 16px;
    }
    .skeleton__line,
    .skeleton__block {
      display: block;
      border-radius: 12px;
      background: var(--color-bg-muted);
    }
    .skeleton__line {
      height: 16px;
    }
    .skeleton__line--short {
      width: 55%;
    }
    .skeleton__block {
      height: 120px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .skeleton {
        animation: skeleton-pulse 1.4s ease-in-out infinite alternate;
      }
    }
    @keyframes skeleton-pulse {
      to {
        opacity: 0.45;
      }
    }
    .request-state {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: var(--font-size-small);
      margin: 16px 0;
    }
    .request-state p {
      margin: 0;
      flex: 1;
      min-width: 160px;
    }
    .request-state--error {
      color: var(--color-feedback-error);
    }
    .request-state__spinner {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      border: 2px solid var(--color-bg-muted);
      border-top-color: var(--color-primary);
      border-radius: 50%;
    }
    @media (prefers-reduced-motion: no-preference) {
      .request-state__spinner {
        animation: request-spin 800ms linear infinite;
      }
    }
    @keyframes request-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestState {
  readonly loading = input(false);
  readonly skeleton = input(false);
  readonly loadingLabel = input('Chargement…');
  readonly error = input('');
  readonly retryLabel = input('');
  readonly retry = output<void>();
}

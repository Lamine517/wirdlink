import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-request-state',
  imports: [Icon],
  template: `@if (loading()) {
      <p class="request-state" role="status">
        <span class="request-state__spinner" aria-hidden="true"></span>{{ loadingLabel() }}
      </p>
    } @else if (error()) {
      <div class="request-state request-state--error" role="alert">
        <app-icon name="warning" [size]="24" />
        <p>{{ error() }}</p>
        @if (retryLabel()) {
          <button
            class="button button--outline button--compact"
            type="button"
            (click)="retry.emit()"
          >
            {{ retryLabel() }}
          </button>
        }
      </div>
    }`,
  styles: `
    :host {
      display: block;
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
  readonly loadingLabel = input('Chargement…');
  readonly error = input('');
  readonly retryLabel = input('');
  readonly retry = output<void>();
}

import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import {
  FRONTEND_GATEWAY,
  InvalidCodeError,
  RateLimitError,
} from '../../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';
import { WirdStore } from '../../../../core/wird-store';
import { WirdAccess } from '../../data-access/wird-access';

describe('Private access frontend', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  let gateway: ReturnType<typeof gatewayStub>;
  beforeEach(() => {
    localStorage.removeItem('wirdlink.parts.v1');
    gateway = gatewayStub();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    TestBed.inject(WirdStore).wirds.update((items) => [
      ...items,
      {
        id: 'private-example',
        title: 'Hidden title',
        visibility: 'private',
        target: 1000,
        completed: 0,
        recurrence: 'Une fois',
      },
    ]);
  });
  afterEach(() => localStorage.removeItem('wirdlink.parts.v1'));

  function setCode(harness: RouterTestingHarness, value: string): void {
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#access-code')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
  }
  async function submit(harness: RouterTestingHarness): Promise<void> {
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('masks the content on direct participant and completion links', async () => {
    const harness = await RouterTestingHarness.create('/wird/private-example/participants');
    expect(harness.routeNativeElement!.querySelector('#access-code')).not.toBeNull();
    expect(harness.routeNativeElement!.textContent).not.toContain('Hidden title');
    await harness.navigateByUrl('/merci/private-example');
    expect(harness.routeNativeElement!.querySelector('#access-code')).not.toBeNull();
    expect(harness.routeNativeElement!.textContent).not.toContain('Hidden title');
  });

  it('keeps content masked after an incorrect code and opens the original view only after approval', async () => {
    gateway.unlock.and.rejectWith(new InvalidCodeError());
    const harness = await RouterTestingHarness.create('/acces/private-example?view=participants');
    setCode(harness, '1234');
    await submit(harness);
    expect(TestBed.inject(WirdAccess).canRead('private-example')).toBeFalse();
    expect(harness.routeNativeElement!.textContent).toContain('Ce code est incorrect');
    gateway.unlock.and.resolveTo({
      id: 'private-example',
      title: 'Hidden title',
      visibility: 'private',
      target: 1000,
      completed: 0,
      recurrence: 'Une fois',
    });
    setCode(harness, '5678');
    await submit(harness);
    expect(TestBed.inject(WirdAccess).canRead('private-example')).toBeTrue();
    expect(harness.routeNativeElement!.textContent).toContain('Hidden title');
    expect(
      harness.routeNativeElement!.querySelector('app-wird-tabs [aria-current="page"]')?.textContent,
    ).toBe('Les participants');
  });

  it('shows a server retry delay and blocks repeated verification', async () => {
    gateway.unlock.and.rejectWith(new RateLimitError(60));
    const harness = await RouterTestingHarness.create('/acces/private-example');
    setCode(harness, '1234');
    await submit(harness);
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBeTrue();
    await submit(harness);
    expect(gateway.unlock.calls.count()).toBe(1);
  });
});

import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { CreationDraftStore } from '../../data-access/creation-draft';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';

describe('Creation flow', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  beforeEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gatewayStub() }],
    });
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));

  function setValue(harness: RouterTestingHarness, selector: string, value: string): void {
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(selector)!;
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

  it('takes a template through content, dates and private preview without publishing', async () => {
    const harness = await RouterTestingHarness.create('/creer');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.template-card')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Mon wird');
    setValue(harness, '#draft-title', 'Notre wird');
    setValue(harness, '#draft-target', '500');
    await submit(harness);
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Quand ?');
    setValue(harness, '#draft-start', '2099-05-01');
    const privateChoice = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLLabelElement>('.option-choice'),
    ].find((label) => label.textContent?.includes('Avec un code'))!;
    privateChoice.querySelector('input')!.click();
    harness.detectChanges();
    await submit(harness);
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Votre aperçu');
    expect(harness.routeNativeElement!.querySelector('article')?.textContent).toContain(
      'Notre wird',
    );
    expect(harness.routeNativeElement!.querySelector('article')?.textContent).toContain(
      'Avec un code',
    );
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.preview-publish')?.disabled,
    ).toBeFalse();
    expect(TestBed.inject(CreationDraftStore).draft().target).toBe(500);
    await harness.navigateByUrl('/creer');
    expect(harness.routeNativeElement!.querySelector('.draft-resume')?.textContent).toContain(
      'Notre wird',
    );
  });

  it('disables invalid objectives and prevents direct access to incomplete preview', async () => {
    const harness = await RouterTestingHarness.create('/creer/apercu');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Mon wird');
    setValue(harness, '#draft-title', 'Wird');
    for (const target of ['0', '-1', '1.5']) {
      setValue(harness, '#draft-target', target);
      expect(
        harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
          .disabled,
      ).toBeTrue();
    }
    await harness.navigateByUrl('/creer/calendrier');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Mon wird');
  });

  it('blocks an end date before the start and allows correction', async () => {
    const harness = await RouterTestingHarness.create('/creer');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.template-card')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    await submit(harness);
    setValue(harness, '#draft-start', '2099-05-02');
    setValue(harness, '#draft-end', '2099-05-01');
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled,
    ).toBeTrue();
    setValue(harness, '#draft-end', '2099-05-03');
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!
        .disabled,
    ).toBeFalse();
  });
});

describe('Optional creation content in preview', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  beforeEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gatewayStub() }],
    });
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('shows description and opening instructions separately without changing the goal', async () => {
    const draft = TestBed.inject(CreationDraftStore);
    draft.updateContent({
      title: 'Wird de famille',
      description: 'Ensemble ce vendredi',
      instructions: 'Fatiha ×1\nSalatoul Fatihi ×7\nAstaghfiroullah ×100',
      target: 12000,
    });
    const harness = await RouterTestingHarness.create('/creer/apercu');
    const text = harness.routeNativeElement!.querySelector('article')!.textContent!;
    expect(text).toContain('Description');
    expect(text).toContain('Consignes');
    expect(text).toContain('Astaghfiroullah ×100');
    expect(text.replace(/\s/g, '')).toContain('12000lecturesàpartager');
    draft.updateContent({
      title: 'Wird de famille',
      description: '',
      instructions: '',
      target: 12000,
    });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('.preview-card__text').length).toBe(0);
  });
});

describe('Draft replacement confirmation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  beforeEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gatewayStub() }],
    });
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('keeps optional instructions until replacing a draft is explicitly confirmed', async () => {
    const draft = TestBed.inject(CreationDraftStore);
    draft.updateContent({
      title: 'Mon brouillon',
      target: 500,
      description: 'Ma description',
      instructions: 'Fatiha ×1',
    });
    const harness = await RouterTestingHarness.create('/creer');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.template-card')!.click();
    harness.detectChanges();
    expect(
      harness.routeNativeElement!.querySelector<HTMLDialogElement>('#replace-draft')!.open,
    ).toBeTrue();
    expect(draft.draft().instructions).toBe('Fatiha ×1');
    const confirm = harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      '#replace-draft .button--primary',
    )!;
    confirm.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Mon wird');
    expect(draft.draft().instructions).toBe('');
    expect(draft.draft().target).toBe(1000);
  });
});

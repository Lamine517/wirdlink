import { TestBed } from '@angular/core/testing';
import {
  DEFAULT_PASS_SETTINGS,
  PassService,
  PassStatus,
  parsePassSettings,
  parsePassStatus,
  passErrorCode,
} from './pass-service';
import { WIRD_TEST_PROVIDER } from '../../testing/wird-fixtures.spec';

const ACTIVE: PassStatus = {
  active: true,
  kind: 'year',
  endsOn: '2026-11-20',
  hadPass: true,
  privateInProgress: 0,
  privateAllowed: true,
  isAdmin: false,
  founder: false,
  foundersLeft: 20,
};

describe('Pass service', () => {
  it('keeps safe defaults for missing or invalid settings', () => {
    expect(parsePassSettings(null)).toEqual(DEFAULT_PASS_SETTINGS);
    const parsed = parsePassSettings({
      enabled: true,
      monthPrice: -5,
      yearPrice: 12000,
      limitStartsOn: 'demain',
    });
    expect(parsed.enabled).toBeTrue();
    expect(parsed.monthPrice).toBe(DEFAULT_PASS_SETTINGS.monthPrice);
    expect(parsed.yearPrice).toBe(12000);
    expect(parsed.limitStartsOn).toBeNull();
  });

  it('reads the creator status and never trusts unknown values', () => {
    expect(parsePassStatus(null)).toBeNull();
    const status = parsePassStatus({ active: 'yes', kind: 'gold', isAdmin: 1, foundersLeft: 3 });
    expect(status).toEqual(
      jasmine.objectContaining({ active: false, kind: null, isAdmin: false, foundersLeft: 3 }),
    );
    expect(status?.privateAllowed).toBeTrue();
  });

  it('only exposes the error codes raised on purpose', () => {
    expect(passErrorCode({ message: 'founders_full' })).toBe('founders_full');
    expect(passErrorCode({ message: 'permission denied for table' })).toBe('unavailable');
    expect(passErrorCode(null)).toBe('unavailable');
  });

  describe('reminder', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-11-17T12:00:00Z'));
      TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] });
    });
    afterEach(() => jasmine.clock().uninstall());

    it('counts the days left only inside the reminder window', () => {
      const service = TestBed.inject(PassService);
      expect(service.endingIn()).toBeNull();
      service.status.set(ACTIVE);
      expect(service.endingIn()).toBe(3);
      service.status.set({ ...ACTIVE, endsOn: '2026-11-17' });
      expect(service.endingIn()).toBe(0);
      service.status.set({ ...ACTIVE, endsOn: '2026-12-30' });
      expect(service.endingIn()).toBeNull();
      service.status.set({ ...ACTIVE, active: false });
      expect(service.endingIn()).toBeNull();
    });
  });
});

import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NavigationHistory } from './navigation-history';

describe('Safe in-app back navigation', () => {
  let events: Subject<NavigationStart | NavigationEnd>;
  let location: jasmine.SpyObj<Location>;
  let state: unknown;
  let router: {
    events: Subject<NavigationStart | NavigationEnd>;
    getCurrentNavigation: jasmine.Spy;
    navigateByUrl: jasmine.Spy;
  };

  beforeEach(() => {
    state = { navigationId: 99 };
    events = new Subject();
    location = jasmine.createSpyObj<Location>('Location', [
      'getState',
      'path',
      'replaceState',
      'back',
    ]);
    location.getState.and.callFake(() => state);
    location.path.and.returnValue('/preferences');
    location.replaceState.and.callFake((_path, _query, next) => {
      state = next;
    });
    router = {
      events,
      getCurrentNavigation: jasmine.createSpy().and.returnValue({ extras: {} }),
      navigateByUrl: jasmine.createSpy().and.resolveTo(true),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Location, useValue: location },
        { provide: Router, useValue: router },
      ],
    });
  });

  function navigate(id: number, url: string): void {
    events.next(new NavigationStart(id, url));
    events.next(new NavigationEnd(id, url, url));
  }

  it('falls back to home on direct entry, even if Angular already has a high navigation ID', async () => {
    const service = TestBed.inject(NavigationHistory);
    navigate(100, '/preferences');
    service.back();
    expect(location.back).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/', { replaceUrl: true });
    await Promise.resolve();
  });

  it('goes back once from settings and tracks a browser back event without creating a new entry', async () => {
    const service = TestBed.inject(NavigationHistory);
    navigate(1, '/');
    navigate(2, '/preferences');
    service.back();
    service.back();
    expect(location.back).toHaveBeenCalledTimes(1);
    events.next(new NavigationStart(3, '/', 'popstate', { navigationId: 1, __wirdlinkDepth: 0 }));
    events.next(new NavigationEnd(3, '/', '/'));
    service.back();
    expect(location.back).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/', { replaceUrl: true });
    await Promise.resolve();
  });

  it('preserves an internal back entry after reload without storing a previous URL', () => {
    state = { navigationId: 4, __wirdlinkDepth: 2 };
    const service = TestBed.inject(NavigationHistory);
    navigate(1, '/aide');
    service.back();
    expect(location.back).toHaveBeenCalledTimes(1);
    expect(state).toEqual({ navigationId: 4, __wirdlinkDepth: 2 });
  });

  it('does not count replacement navigation as a new browser entry', () => {
    const service = TestBed.inject(NavigationHistory);
    navigate(1, '/preferences');
    router.getCurrentNavigation.and.returnValue({ extras: { replaceUrl: true } });
    navigate(2, '/');
    service.back('/');
    expect(location.back).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalled();
  });
});

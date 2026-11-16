import { WirdStore, Wird, Part } from './wird-store';
import { WirdRepository } from './services/wird-repository';

describe('WirdStore connected', () => {
  let repository: jasmine.SpyObj<WirdRepository>;
  const wird: Wird = {
    id: 'one',
    title: 'Un wird',
    recurrence: 'Une fois',
    visibility: 'public',
    target: 1000,
    completed: 200,
    reserved: 300,
  };
  const part: Part = { id: 'part', wirdId: 'one', quantity: 100, name: '', finished: false };
  beforeEach(() => {
    repository = jasmine.createSpyObj<WirdRepository>('repository', [
      'identity',
      'listWirds',
      'getWird',
      'listParts',
      'reserve',
      'finish',
      'listParticipants',
      'unlock',
      'publish',
      'getPublicationReceipt',
    ]);
    repository.identity.and.resolveTo('user');
    repository.listWirds.and.resolveTo([wird]);
    repository.listParts.and.resolveTo([part]);
  });
  it('uses collective totals without adding own parts twice', async () => {
    const store = new WirdStore([], repository);
    await store.ready;
    expect(store.available('one')).toBe(500);
    expect(store.completed('one')).toBe(200);
    expect(store.parts()).toEqual([part]);
    expect(store.reserve('one', 1, '')).toBeNull();
    expect(store.finish('part')).toBeFalse();
  });
  it('does not create a local commitment when the server rejects it', async () => {
    repository.listParts.and.resolveTo([]);
    repository.reserve.and.rejectWith(new Error('Unavailable'));
    const store = new WirdStore([], repository);
    await store.ready;
    await expectAsync(store.reservePart('one', 100, '', 'request')).toBeRejected();
    expect(store.parts()).toEqual([]);
    expect(store.available('one')).toBe(500);
  });
  it('applies server confirmation once and preserves total available', async () => {
    repository.finish.and.resolveTo({
      part: { ...part, finished: true },
      wird: { ...wird, completed: 300, reserved: 200 },
    });
    const store = new WirdStore([], repository);
    await store.ready;
    await store.finishPart('part');
    expect(store.parts()[0].finished).toBeTrue();
    expect(store.completed('one')).toBe(300);
    expect(store.available('one')).toBe(500);
  });
  it('discards data fetched under a different identity', async () => {
    repository.identity.and.returnValues(Promise.resolve('first'), Promise.resolve('second'));
    const store = new WirdStore([], repository);
    await store.ready;
    expect(store.wirds()).toEqual([]);
    expect(store.parts()).toEqual([]);
  });
  it('does not restore a private response after switching accounts', async () => {
    const store = new WirdStore([], repository);
    await store.ready;
    let resolve!: (value: Wird | null) => void;
    repository.getWird.and.returnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const pending = store.ensure('private');
    await Promise.resolve();
    repository.identity.and.resolveTo('other-user');
    resolve({ ...wird, id: 'private', visibility: 'private' });
    expect(await pending).toBeNull();
    expect(store.wirds().some((item) => item.id === 'private')).toBeFalse();
  });
  it('does not overwrite a confirmed mutation with an older read', async () => {
    const store = new WirdStore([], repository);
    await store.ready;
    let resolve!: (value: Wird | null) => void;
    repository.getWird.and.returnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const pending = store.ensure('one');
    await Promise.resolve();
    repository.finish.and.resolveTo({
      part: { ...part, finished: true },
      wird: { ...wird, completed: 300, reserved: 200 },
    });
    await store.finishPart('part');
    resolve(wird);
    await pending;
    expect(store.completed('one')).toBe(300);
  });

  it('clears private cached data as soon as the technical identity changes', async () => {
    let changed!: (id: string | null) => void;
    repository.watchIdentity = (listener) => {
      changed = listener;
      return () => {};
    };
    const store = new WirdStore([], repository);
    await store.ready;
    expect(store.parts().length).toBe(1);
    repository.identity.and.resolveTo(null);
    repository.listWirds.and.resolveTo([]);
    repository.listParts.and.resolveTo([]);
    changed(null);
    expect(store.parts()).toEqual([]);
    expect(store.wirds()).toEqual([]);
    await Promise.resolve();
    await store.refresh();
    expect(store.parts()).toEqual([]);
  });
});

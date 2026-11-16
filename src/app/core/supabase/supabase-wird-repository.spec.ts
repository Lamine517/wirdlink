import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  GuestAccessError,
  ServiceUnavailableError,
  InvalidCodeError,
  RateLimitError,
} from '../services/frontend-gateway';
import type { PublicationRequest } from '../services/frontend-gateway';
import { SUPABASE_CLIENT } from './supabase-client';
import { SupabaseWirdRepository } from './supabase-wird-repository';

const dto = () => ({
  id: 'wird-id',
  title: 'Salat',
  description: '',
  instructions: '',
  target: 1000,
  completed: 100,
  reserved: 200,
  recurrence: 'Une fois',
  visibility: 'public',
  image_path: null,
  audio_path: null,
  start_date: '2026-11-16',
  end_date: null,
});
const request = (): PublicationRequest => ({
  requestId: 'request-id',
  draft: {
    title: ' Salat ',
    description: '',
    target: 1000,
    recurrence: 'Une fois',
    visibility: 'public',
    startDate: '2026-11-16',
    endDate: '',
  },
  image: null,
  audio: null,
});

describe('SupabaseWirdRepository', () => {
  let repository: SupabaseWirdRepository;
  let rpc: jasmine.Spy;
  let getSession: jasmine.Spy;
  let getUser: jasmine.Spy;
  let signInAnonymously: jasmine.Spy;
  let upload: jasmine.Spy;
  let createSignedUrls: jasmine.Spy;
  let select: jasmine.Spy;
  let remove: jasmine.Spy;

  beforeEach(() => {
    rpc = jasmine.createSpy('rpc').and.resolveTo({ data: null, error: null });
    getSession = jasmine
      .createSpy('getSession')
      .and.resolveTo({ data: { session: null }, error: null });
    getUser = jasmine
      .createSpy('getUser')
      .and.resolveTo({ data: { user: { id: 'owner', is_anonymous: false } }, error: null });
    signInAnonymously = jasmine.createSpy('signInAnonymously');
    upload = jasmine.createSpy('upload').and.resolveTo({ error: null });
    createSignedUrls = jasmine.createSpy('createSignedUrls');
    remove = jasmine.createSpy('remove').and.resolveTo({ error: null });
    select = jasmine.createSpy('select').and.resolveTo({ data: [], error: null });
    const client = {
      rpc,
      auth: { getSession, getUser, signInAnonymously },
      storage: { from: () => ({ upload, createSignedUrls, remove }) },
      from: () => ({ select }),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: () => Promise.resolve(client as unknown as SupabaseClient),
        },
      ],
    });
    repository = TestBed.inject(SupabaseWirdRepository);
  });

  it('publishes using Google session without anonymous sign-in and returns owner receipt', async () => {
    rpc.and.callFake((name: string) =>
      Promise.resolve({
        data:
          name === 'publish_wird'
            ? 'wird-id'
            : { id: 'wird-id', title: 'Salat', visibility: 'private', accessCode: '123456' },
        error: null,
      }),
    );
    const receipt = await repository.publish(request());
    expect(rpc).toHaveBeenCalledWith('publish_wird', {
      p_request_id: 'request-id',
      p_draft: {
        title: 'Salat',
        description: '',
        instructions: '',
        target: 1000,
        recurrence: 'Une fois',
        visibility: 'public',
        startDate: '2026-11-16',
        endDate: null,
        imagePath: null,
        audioPath: null,
      },
    });
    expect(receipt.shareUrl).toBe(window.location.origin + '/wird/wird-id');
    expect(receipt.accessCode).toBe('123456');
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('reuses the exact content path on upload conflict without overwriting', async () => {
    upload.and.resolveTo({ error: { statusCode: '409' } });
    rpc.and.callFake((name: string) =>
      Promise.resolve({
        data:
          name === 'publish_wird'
            ? 'wird-id'
            : { id: 'wird-id', title: 'Salat', visibility: 'public' },
        error: null,
      }),
    );
    const publication = request();
    publication.image = {
      file: new File(['image'], 'private-name.png', { type: 'image/png' }),
      url: 'blob:test',
    };
    await repository.publish(publication);
    await repository.publish(publication);
    const firstPath: unknown = upload.calls.argsFor(0)[0];
    expect(firstPath).toMatch(/^owner\/request-id\/image-[a-f0-9]{64}\.png$/);
    expect(upload.calls.argsFor(1)[0]).toBe(firstPath);
    expect(upload.calls.argsFor(0)[2]).toEqual({ upsert: false, contentType: 'image/png' });
  });

  it('publishes a stored permanent session when Auth validation is temporarily unavailable', async () => {
    getUser.and.resolveTo({ data: { user: null }, error: { message: 'temporarily unavailable' } });
    getSession.and.resolveTo({
      data: { session: { user: { id: 'owner', is_anonymous: false } } },
      error: null,
    });
    rpc.and.callFake((name: string) =>
      Promise.resolve({
        data:
          name === 'publish_wird'
            ? 'wird-id'
            : { id: 'wird-id', title: 'Salat', visibility: 'public' },
        error: null,
      }),
    );
    expect((await repository.publish(request())).id).toBe('wird-id');
  });

  it('does not publish an anonymous session when Auth validation fails', async () => {
    getUser.and.resolveTo({ data: { user: null }, error: { message: 'temporarily unavailable' } });
    getSession.and.resolveTo({
      data: { session: { user: { id: 'guest', is_anonymous: true } } },
      error: null,
    });
    await expectAsync(repository.publish(request())).toBeRejectedWithError(ServiceUnavailableError);
    expect(upload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('uploads a phone voice note as MP4 audio', async () => {
    rpc.and.callFake((name: string) =>
      Promise.resolve({
        data:
          name === 'publish_wird'
            ? 'wird-id'
            : { id: 'wird-id', title: 'Salat', visibility: 'public' },
        error: null,
      }),
    );
    const publication = request();
    publication.audio = {
      file: new File(['voice'], 'voice.m4a', { type: 'audio/x-m4a' }),
      url: 'blob:test',
    };
    await repository.publish(publication);
    expect(upload.calls.argsFor(0)[0]).toMatch(/audio-[a-f0-9]{64}\.m4a$/);
    expect(upload.calls.argsFor(0)[2]).toEqual({ upsert: false, contentType: 'audio/mp4' });
  });

  it('preserves the request when publication fails', async () => {
    rpc.and.resolveTo({ data: null, error: { code: '500' } });
    const publication = request();
    const original = JSON.stringify(publication);
    await expectAsync(repository.publish(publication)).toBeRejectedWithError(
      ServiceUnavailableError,
    );
    expect(JSON.stringify(publication)).toBe(original);
  });

  it('rejects anonymous publication before uploading', async () => {
    getUser.and.resolveTo({ data: { user: { id: 'guest', is_anonymous: true } }, error: null });
    await expectAsync(repository.publish(request())).toBeRejectedWithError(ServiceUnavailableError);
    expect(upload).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not create any session while reading', async () => {
    rpc.and.resolveTo({ data: [dto()], error: null });
    expect((await repository.listWirds())[0].reserved).toBe(200);
    expect(await repository.listParts()).toEqual([]);
    expect(await repository.identity()).toBeNull();
    expect(select).not.toHaveBeenCalled();
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('rejects invalid server counts instead of displaying them', async () => {
    rpc.and.resolveTo({ data: [{ ...dto(), completed: 900 }], error: null });
    await expectAsync(repository.listWirds()).toBeRejectedWithError(ServiceUnavailableError);
  });

  it('signs all media in one request', async () => {
    rpc.and.resolveTo({
      data: [{ ...dto(), image_path: 'image', audio_path: 'audio' }],
      error: null,
    });
    createSignedUrls.and.resolveTo({
      data: [
        { path: 'image', signedUrl: 'https://media/image', error: null },
        { path: 'audio', signedUrl: 'https://media/audio', error: null },
      ],
      error: null,
    });
    const result = await repository.listWirds();
    expect(createSignedUrls).toHaveBeenCalledOnceWith(['image', 'audio'], 3600);
    expect(result[0].audioUrl).toBe('https://media/audio');
  });

  it('keeps permanent sessions when reserving and normalizes disabled guest access', async () => {
    getSession.and.resolveTo({ data: { session: { user: { id: 'owner' } } }, error: null });
    rpc.and.resolveTo({
      data: {
        part: { id: 'part', wirdId: 'wird-id', quantity: 10, name: '', finished: false },
        wird: dto(),
      },
      error: null,
    });
    expect((await repository.reserve('wird-id', 10, '', 'request')).part.quantity).toBe(10);
    expect(signInAnonymously).not.toHaveBeenCalled();
    getSession.and.resolveTo({ data: { session: null }, error: null });
    signInAnonymously.and.resolveTo({ data: { session: null }, error: { message: 'disabled' } });
    await expectAsync(repository.reserve('wird-id', 10, '', 'request')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
    signInAnonymously.and.resolveTo({
      data: { session: null },
      error: { code: 'anonymous_provider_disabled', message: 'Anonymous sign-ins are disabled' },
    });
    await expectAsync(repository.reserve('wird-id', 1, '', 'request')).toBeRejectedWithError(
      GuestAccessError,
    );
  });

  it('rejects reservation and unlock responses after the active identity changes', async () => {
    getSession.and.returnValues(
      Promise.resolve({ data: { session: { user: { id: 'first' } } }, error: null }),
      Promise.resolve({ data: { session: { user: { id: 'second' } } }, error: null }),
    );
    rpc.and.resolveTo({
      data: {
        part: { id: 'part', wirdId: 'wird-id', quantity: 10, name: '', finished: false },
        wird: dto(),
      },
      error: null,
    });
    await expectAsync(repository.reserve('wird-id', 10, '', 'request')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
    getSession.and.returnValues(
      Promise.resolve({ data: { session: null }, error: null }),
      Promise.resolve({ data: { session: { user: { id: 'second' } } }, error: null }),
    );
    signInAnonymously.and.resolveTo({ data: { session: { user: { id: 'guest' } } }, error: null });
    rpc.and.resolveTo({ data: { wird: dto() }, error: null });
    await expectAsync(repository.unlock('wird-id', '1234')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
  });

  it('maps code errors and treats denied receipts as unavailable to other users', async () => {
    getSession.and.resolveTo({ data: { session: { user: { id: 'owner' } } }, error: null });
    rpc.and.resolveTo({ data: { error: 'invalid_code' }, error: null });
    await expectAsync(repository.unlock('wird-id', '000000')).toBeRejectedWithError(
      InvalidCodeError,
    );
    rpc.and.resolveTo({ data: { error: 'rate_limited' }, error: null });
    await expectAsync(repository.unlock('wird-id', '000000')).toBeRejectedWithError(RateLimitError);
    rpc.and.resolveTo({ data: null, error: { code: '42501' } });
    expect(await repository.getPublicationReceipt('other')).toBeNull();
    expect(await repository.getWird('other')).toBeNull();
  });
  it('cleans only exact owned media after the server authorizes deletion', async () => {
    getSession.and.resolveTo({ data: { session: { user: { id: 'owner' } } }, error: null });
    select.and.returnValue({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: { image_path: 'owner/image.png', audio_path: 'other/audio.mp3' },
            error: null,
          }),
      }),
    });
    await repository.delete('wird-id');
    expect(rpc).toHaveBeenCalledWith('delete_wird', { p_wird_id: 'wird-id' });
    expect(remove).toHaveBeenCalledOnceWith(['owner/image.png']);
  });
  it('does not remove files when the ownership-checked deletion is refused', async () => {
    getSession.and.resolveTo({ data: { session: { user: { id: 'owner' } } }, error: null });
    select.and.returnValue({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: { image_path: 'owner/image.png' }, error: null }),
      }),
    });
    rpc.and.resolveTo({ data: null, error: { code: '42501' } });
    await expectAsync(repository.delete('wird-id')).toBeRejectedWithError(ServiceUnavailableError);
    expect(remove).not.toHaveBeenCalled();
  });
});

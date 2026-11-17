import { InjectionToken } from '@angular/core';
import type { Wird, Part } from '../wird-store';
import type { PublicationReceipt, PublicationRequest } from './frontend-gateway';

export interface PartMutation {
  part: Part;
  wird: Wird;
}
export interface WirdChanges {
  title: string;
  target: number;
  description: string;
  instructions: string;
}
export interface WirdStats {
  participants: number;
  days: { day: string; finished: number; reserved: number }[];
}
export interface CreatorStats {
  participants: number;
  wirds: { id: string; days: { day: string; finished: number }[] }[];
}
export interface WirdRepository {
  stats?(id: string): Promise<WirdStats | null>;
  creatorStats?(): Promise<CreatorStats | null>;
  watchIdentity?(listener: (id: string | null) => void): () => void;
  update(id: string, changes: WirdChanges): Promise<Wird>;
  delete(id: string): Promise<void>;
  titles(): Promise<string[]>;
  identity(): Promise<string | null>;
  listWirds(): Promise<Wird[]>;
  getWird(id: string): Promise<Wird | null>;
  listParts(): Promise<Part[]>;
  reserve(id: string, quantity: number, name: string, requestId: string): Promise<PartMutation>;
  finish(partId: string): Promise<PartMutation>;
  listParticipants(id: string): Promise<Part[]>;
  unlock(id: string, code: string): Promise<Wird>;
  publish(request: PublicationRequest): Promise<PublicationReceipt>;
  getPublicationReceipt(id: string): Promise<PublicationReceipt | null>;
}

export const WIRD_REPOSITORY = new InjectionToken<WirdRepository>('WIRD_REPOSITORY');

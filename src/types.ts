import type { IoContext, IoProcessMapMethods } from '@amnis/state';
import type {
  RestHandler,
  StartOptions,
} from 'msw';

export interface MockOptions {
  processes?: Record<string, IoProcessMapMethods>;
  baseUrl?: string;
  context?: IoContext;
}

export type MockHandlers = (
  baseUrl: string,
  context: IoContext,
  process: IoProcessMapMethods,
) => RestHandler[];

export interface MockServiceOptions {
  baseUrl?: string;
  context?: IoContext;
}

export type MockService = {
  setup: (options?: MockOptions) => Promise<void>;
  start: (options?: StartOptions) => void;
  stop: () => void;
}

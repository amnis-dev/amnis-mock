import type { IoContext, IoProcessDefinition, IoProcessMapMethods } from '@amnis/state';
import type {
  RestHandler,
  StartOptions,
} from 'msw';

export interface MockOptions {
  hostname?: string;
  baseUrl?: string;
  processes?: Record<string, IoProcessDefinition>;
  context?: IoContext;
  debug?: boolean;
  clearStorage?: boolean;
}

export type MockHandlers = (
  baseUrl: string,
  context: IoContext,
  endpoints: IoProcessMapMethods,
) => RestHandler[];

export type MockService = {
  setup: (options?: MockOptions) => Promise<void>;
  start: (options?: StartOptions) => void;
  stop: () => void;
}

import {
  contextSetup,
} from '@amnis/state';
import {
  schemaAuth, schemaState, schemaEntity,
} from '@amnis/state/schema';
import {
  validateSetup,
} from '@amnis/state/validate';
import type { RequestHandler, SetupWorker } from 'msw';
import type { SetupServer } from 'msw/node';
import { setupWorker } from 'msw';
import type { MockService } from './types.js';
import { handlersCreate } from './handler.js';

let service: SetupServer | SetupWorker | undefined;

export const mockService: MockService = {
  setup: async (options) => {
    if (service) {
      console.warn('MSW Service has already been setup.');
      return;
    }

    const opt = { ...options };

    const {
      processes = {},
      baseUrl = '',
      context = await contextSetup({
        validators: validateSetup([schemaAuth, schemaState, schemaEntity]),
      }),
    } = opt;

    const handlers: RequestHandler[] = [];
    Object.keys(processes).forEach((path) => {
      const processMapMethod = processes[path];
      handlers.push(...handlersCreate(`${baseUrl}/${path}`, context, processMapMethod));
    });

    // On NodeJS
    if (typeof window === 'undefined') {
      const msw = await import('msw/node');
      service = msw.setupServer(...handlers);
    // On Browser
    } else {
      service = setupWorker(...handlers);
    }
  },
  start: (options) => {
    if (!service) {
      console.error('Must call mockService.setup() before starting!');
      return;
    }
    // NodeJS uses listen();
    if ('listen' in service) {
      service.listen();
    }
    // Browser uses start();
    if ('start' in service) {
      service.start(options);
    }
  },
  stop() {
    if (!service) {
      console.error('Must call mockService.setup() before stopping!');
      return;
    }
    // NodeJS uses close.
    if ('close' in service) {
      service.close();
    }
    // Browser uses stop().
    if ('stop' in service) {
      service.stop();
    }
  },
};

export default mockService;

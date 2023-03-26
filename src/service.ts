import {
  schemaState,
} from '@amnis/state/schema';
import {
  contextSetup,
} from '@amnis/state/context';
import type { RequestHandler, SetupWorker } from 'msw';
import type { SetupServer } from 'msw/node';
import { setupWorker } from 'msw';
import type { Api } from '@amnis/state';
import {
  localStorage,
  systemSlice,
  apiKey,
  dataActions,
  apiCreate,
} from '@amnis/state';
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
      hostname = 'http://localhost',
      baseUrl = '/api',
      processes = {},
      context = await contextSetup({
        schemas: [schemaState],
      }),
      debug = false,
      clearStorage = true,
    } = opt;

    if (clearStorage) {
      localStorage().removeItem('state-entities');
      localStorage().removeItem('state-meta');
    }

    const system = systemSlice.select.active(context.store.getState());
    if (!system) {
      throw new Error('No active system.');
    }

    let systemDomain = hostname;
    if (!options?.hostname && typeof window !== 'undefined') {
      systemDomain = window.location.origin;
    }
    context.store.dispatch(systemSlice.action.update({
      $id: system.$id,
      domain: systemDomain,
    }));

    const apis: Api[] = [];
    const handlers: RequestHandler[] = [];
    Object.keys(processes).forEach((key) => {
      const definition = processes[key];
      const { meta, endpoints } = definition;

      const slash = baseUrl.startsWith('/') ? '' : '/';
      const combinedUrl = `${systemDomain}${slash}${baseUrl}/${key}`;

      if (debug) {
        // eslint-disable-next-line no-console
        console.debug(`Setting up mock process '${key}' on path '${combinedUrl}'`);
      }

      const apiNext = apiCreate({
        ...meta,
        baseUrl: `${baseUrl}/${key}`,
        $system: system.$id,
      });
      apis.push(apiNext);

      handlers.push(...handlersCreate(combinedUrl, context, endpoints));
    });

    context.store.dispatch(dataActions.create({
      [apiKey]: apis,
    }));

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

import type { IoContext, IoProcess, IoProcessDefinition } from '@amnis/state';
import {
  apiSlice,
  systemSlice,
  ioOutput,
} from '@amnis/state';
import { contextSetup } from '@amnis/state/context';
import fetch from 'cross-fetch';
import { mockService } from './service.js';

/**
 * Create a test process.
 */
const testProcess: IoProcess = () => async (input, output) => output;

/**
 * Create a test process map methods
 */
const testProcessMap: IoProcessDefinition = {
  meta: {
    reducerPath: 'test',
  },
  endpoints: {
    get: {
      proc1: testProcess,
    },
    post: {
      proc2: testProcess,
    },
  },
};

let context: IoContext;

/**
 * Start the MSW service.
 */
beforeAll(async () => {
  context = await contextSetup();
  await mockService.setup({
    context,
    processes: {
      test: testProcessMap,
    },
  });
  mockService.start();
});

afterAll(() => {
  mockService.stop();
});

/** Ensure that the test API exists on the context store */
test('Test system domain', () => {
  const system = systemSlice.select.active(context.store.getState());

  if (!system) {
    expect(system).toBeDefined();
    return;
  }

  expect(system.domain).toBe('http://localhost');
});

/** Ensure that the test API exists on the context store */
test('Test API exists', () => {
  const apis = apiSlice.select.all(context.store.getState());
  expect(apis).toHaveLength(1);
  expect(apis[0].reducerPath).toBe('test');
  expect(apis[0].baseUrl).toBe('/api/test');
  expect(apis[0].$system).toBeDefined();
});

/** Test the GET process. */
test('GET /test/proc1', async () => {
  const response = await fetch('http://localhost/api/test/proc1');
  expect(response.status).toBe(200);

  const json = await response.json();
  expect(json).toEqual(ioOutput().json);
});

/** Test the POST process. */
test('POST /test/proc2', async () => {
  const response = await fetch('http://localhost/api/test/proc2', {
    method: 'POST',
  });
  expect(response.status).toBe(200);

  const json = await response.json();
  expect(json).toEqual(ioOutput().json);
});

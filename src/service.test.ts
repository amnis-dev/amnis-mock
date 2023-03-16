import type { IoProcess, IoProcessDefinition } from '@amnis/state';
import { ioOutput } from '@amnis/state';
import fetch from 'cross-fetch';
import { mockService } from './service.js';

const baseUrl = 'https://amnis.dev';

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
    baseUrl,
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

/**
 * Start the MSW service.
 */
beforeAll(async () => {
  await mockService.setup({
    processes: {
      test: testProcessMap,
    },
  });
  mockService.start();
});

afterAll(() => {
  mockService.stop();
});

/** Test the GET process. */
test('GET /test/proc1', async () => {
  const response = await fetch(`${baseUrl}/test/proc1`);
  expect(response.status).toBe(200);

  const json = await response.json();
  expect(json).toEqual(ioOutput().json);
});

/** Test the POST process. */
test('POST /test/proc2', async () => {
  const response = await fetch(`${baseUrl}/test/proc2`, {
    method: 'POST',
  });
  expect(response.status).toBe(200);

  const json = await response.json();
  expect(json).toEqual(ioOutput().json);
});

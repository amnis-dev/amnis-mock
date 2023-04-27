/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IoContext, IoProcess } from '@amnis/state';
import { systemSlice, ioOutput } from '@amnis/state';
import type {
  ResponseResolver,
  ResponseTransformer,
  RestContext,
  RestHandler,
  RestRequest,
} from 'msw';
import { rest } from 'msw';
import { mwCookies, mwInput } from './mw.js';
import type { MockHandlers } from './types.js';

const resolver: (
  context: IoContext,
  process: IoProcess
) => ResponseResolver<RestRequest, RestContext> = (
  context,
  process,
) => async (req, res, ctx) => {
  const system = systemSlice.select.active(context.store.getState());

  if (!system) {
    return res(
      ctx.status(400, 'No active system.'),
    );
  }

  const input = await mwInput(req, system);
  const output = await process(context)(input, ioOutput());

  const ctxCookies: ResponseTransformer<any, any>[] = mwCookies(output, ctx);

  return res(
    ctx.status(output.status),
    ...ctxCookies,
    ctx.json(output.json ?? {}),
  );
};

/**
 * Builds a set of handlers from a process map.
 */
export const handlersCreate: MockHandlers = (
  baseUrl,
  context,
  endpoints,
) => {
  const handlers: RestHandler[] = [];

  Object.keys(endpoints).forEach((method) => {
    const m = method as 'get' | 'post';
    const processMap = endpoints[m];
    if (processMap) {
      handlers.push(...Object.keys(processMap).map(
        (key) => rest[m](`${baseUrl}/${key}`, resolver(context, processMap[key])),
      ));
    }
  });

  return handlers;
};

export default handlersCreate;

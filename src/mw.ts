import type {
  IoContext,
  IoInput,
  IoOutput,
  JWTAccess,
  System,
} from '@amnis/state';
import {
  auditSlice,
  entityCreate,
} from '@amnis/state';
import type { ResponseTransformer, RestContext, RestRequest } from 'msw';

function httpAuthorizationParse(authorization?: string | null): string | undefined {
  if (!authorization) {
    return undefined;
  }

  const [type, accessEncoded] = authorization.split(' ');

  if (type !== 'Bearer' || !accessEncoded) {
    return undefined;
  }

  return accessEncoded as string;
}

/**
 * Sets up the input object for processors.
 */
export const mwInput = async (req: RestRequest, system: System): Promise<IoInput> => {
  /**
   * Mock a local ip.
   */
  const ip = '127.0.0.1';

  /**
   * Extract body and session data from the request.
   */
  const body = await req.body ? await req.json() : {};
  const sessionEncrypted = req.cookies[system.sessionKey];

  /**
   * Build the input object.
   */
  const input: IoInput = {
    body,
    query: {},
    sessionEncrypted,
    ip,
  };

  /**
   * Extract query and param data.
   */
  const queryEntries = req.url.searchParams.entries() ?? [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of queryEntries) {
    input.query[key] = value;
  }

  if (typeof req.params?.param === 'string') {
    input.param = req.params.param;
  }

  /**
   * Extract authorization header.
   */
  const authorization = req.headers.get('Authorization');
  input.accessEncoded = httpAuthorizationParse(authorization);

  /**
   * Extract signature header.
   */
  input.signatureEncoded = req.headers.get('Signature') || undefined;

  /**
   * Extract challenge header.
   */
  input.challengeEncoded = req.headers.get('Challenge') || undefined;

  /**
   * Extract one-time password (OTP) header.
   */
  input.otpEncoded = req.headers.get('Otp') || undefined;

  return input;
};

/**
 * Applies output cookies to the MSW context.
 */
export const mwCookies = (
  output: IoOutput,
  ctx: RestContext,
): ResponseTransformer[] => {
  const ctxCookies: ResponseTransformer[] = [];
  Object.keys(output.cookies).forEach((cookieName) => {
    const cookieValue = output.cookies[cookieName];
    const cookieOptions: { expires?: Date } = {};
    if (cookieValue === undefined) {
      cookieOptions.expires = new Date();
    }
    ctxCookies.push(ctx.cookie(cookieName, cookieValue ?? '', cookieOptions));
  });
  return ctxCookies;
};

/**
 * Generates audits from api access.
 */
export const mwAudit = async (
  req: Request,
  context: IoContext,
  input: IoInput,
  output: IoOutput,
): Promise<void> => {
  /**
   * Mock a local ip.
   */
  const ip = '127.0.0.1';

  const body = { ...input.body };

  /**
   * Hide passwords.
   */
  if (body.password) {
    body.password = '****';
  }

  /**
   * Create the audit.
   */
  const audit = auditSlice.create({
    action: `${req.method}:${req.url}`,
    completed: output.status === 200,
    inputBody: body,
    ip,
  });

  /**
   * Get the subject if there is one.
   */
  if (input.accessEncoded) {
    const [access] = await context.crypto.tokenDecode<JWTAccess>(input.accessEncoded);
    if (access) {
      audit.$subject = access.sub;
    }
  }

  /**
   * Create the record in the database.
   */
  context.database.create({
    [auditSlice.key]: [entityCreate(audit)],
  });
};

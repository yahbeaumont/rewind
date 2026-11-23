import { getSession } from '../session.js';
import { RewindError } from '../errors.js';

// Node ships undici's globals (Headers, Request, RequestInit) but not the DOM
// aliases this file is written against.
type HeadersInit = Headers | Record<string, string> | [string, string][];
type RequestInfo = string | URL | Request;

const realFetch = globalThis.fetch;

function headersOf(init: RequestInit | undefined, source: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const target = source ?? init?.headers;
  if (!target) return out;
  if (target instanceof Headers) {
    target.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  if (Array.isArray(target)) {
    for (const [key, value] of target as [string, string][]) out[key.toLowerCase()] = value;
    return out;
  }
  for (const [key, value] of Object.entries(target as Record<string, string>)) out[key.toLowerCase()] = value;
  return out;
}

export function installNet(): void {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const session = getSession();
    if (!session) return realFetch(input, init);

    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const request = {
      method: (init?.method ?? 'GET').toUpperCase(),
      url,
      headers: headersOf(init, undefined),
      body: typeof init?.body === 'string' ? init.body : null
    };

    if (session.mode === 'record') {
      const response = await realFetch(input, init);
      const body = await response.text();
      session.writer?.append('net.request', request);
      session.writer?.append('net.response', {
        status: response.status,
        headers: headersOf(undefined, response.headers),
        body
      });
      return new Response(body, { status: response.status, headers: response.headers });
    }

    session.reader?.next('net.request', request);
    const recorded = session.reader?.next('net.response') as { status: number; headers: Record<string, string>; body: string };
    if (!recorded) throw new RewindError('LIVE_ACCESS_IN_REPLAY', `no recorded response for ${url}`);
    return new Response(recorded.body, { status: recorded.status, headers: recorded.headers });
  };
}

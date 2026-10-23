const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLogger, forwardRequest: sdkForwardRequest } = require('../dist/index.cjs');
const admin = { password: 'test-admin-password', sessionSecret: 'test-session-secret-'.repeat(3) };
const forwardRequest = options => sdkForwardRequest({ admin, ...options });
async function authenticated(request, basePath = '/api/oneminutelogs') {
  const response = await forwardRequest({ basePath })(new Request(`https://app.test${basePath}/admin/login`, {
    method: 'POST', headers: { origin: 'https://app.test', 'content-type': 'application/json' }, body: JSON.stringify({ password: admin.password }),
  }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict; Max-Age=28800; Secure/);
  assert.ok(!response.headers.get('set-cookie').includes(admin.password));
  request.headers.set('cookie', response.headers.get('set-cookie').split(';')[0]);
  return request;
}

test('dispatches authorized log requests with the original request and filters', async () => {
  const request = new Request('https://app.test/api/oneminutelogs/logs?environment=production', { headers: { cookie: 'session=test' } });
  let authorizations = 0;
  const handler = forwardRequest({
    authorize: incoming => { authorizations++; assert.equal(incoming, request); return true; },
    logger: { get: async filters => { assert.equal(filters.environment, 'production'); return { logs: [], count: 0 }; } },
  });
  await authenticated(request);
  const response = await handler(request);
  assert.equal(response.status, 200);
  assert.equal(authorizations, 1);
  assert.deepEqual(await response.json(), { logs: [], count: 0 });
});

test('rejects missing or denied authorization before accessing logs', async () => {
  for (const authorize of [undefined, () => false]) {
    const handler = forwardRequest({ authorize, logger: { get: () => assert.fail('must not query logs') } });
    assert.equal((await handler(new Request('https://app.test/api/oneminutelogs/logs'))).status, 401);
  }
});

test('only dispatches exact supported paths and methods', async () => {
  const handler = forwardRequest({ authorize: () => true, logger: { get: () => assert.fail('must not query logs') } });
  for (const path of ['unknown', 'nested/logs', 'logs/nested', '../other/logs']) {
    assert.equal((await handler(await authenticated(new Request(`https://app.test/api/oneminutelogs/${path}`)))).status, 404);
  }
  const response = await handler(await authenticated(new Request('https://app.test/api/oneminutelogs/logs', { method: 'POST', body: '{}' })));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('streams without buffering and supports a custom mount path', async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: test\n\n')); controller.close(); } });
  const handler = forwardRequest({ authorize: () => true, basePath: '/internal/oml/', logger: { stream: () => ({ body }) } });
  const response = await handler(await authenticated(new Request('https://app.test/internal/oml/stream'), '/internal/oml'));
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  assert.equal(await response.text(), 'data: test\n\n');
});

test('does not forward incoming cookies or arbitrary headers upstream', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://oml.test/logs?limit=5');
    assert.equal(options.headers['x-api-key'], 'server-key');
    assert.equal(options.headers.cookie, undefined);
    assert.equal(options.headers['x-private'], undefined);
    return Response.json({ logs: [] });
  };
  const handler = forwardRequest({ authorize: () => true, apiKey: 'server-key', baseUrl: 'https://oml.test' });
  assert.equal((await handler(await authenticated(new Request('https://app.test/api/oneminutelogs/logs?limit=5', { headers: { cookie: 'private', 'x-private': 'secret' } })))).status, 200);
});

test('browser ingestion uses the existing server handler without log-reading authorization', async t => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  let calls = 0;
  const payload = { schemaVersion: 1, batchId: 'test-batch', events: [{ type: 'javascript_error' }] };
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.oneminutelogs.com/api/v2/rum/batches');
    assert.equal(options.headers['x-api-key'], 'server-only-key');
    assert.deepEqual(JSON.parse(new TextDecoder().decode(options.body)), payload);
    return Response.json({ batchId: payload.batchId, accepted: true });
  };
  const logger = createLogger({ apiKey: 'server-only-key', projectName: 'shop', environment: 'development' });
  const handler = forwardRequest({ logger });
  const makeRequest = origin => new Request('https://app.test/api/oneminutelogs/browser', {
    method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(payload),
  });
  const accepted = await handler(makeRequest('https://app.test'));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).accepted, true);
  assert.equal(calls, 1);
  assert.equal((await handler(makeRequest('https://attacker.test'))).status, 403);
  assert.equal(calls, 1);
  assert.equal((await handler(new Request('https://app.test/api/oneminutelogs/logs'))).status, 401);
});

test('browser dispatch rejects unsupported methods and missing configuration', async () => {
  const handler = forwardRequest({});
  const unsupported = await handler(new Request('https://app.test/api/oneminutelogs/browser'));
  assert.equal(unsupported.status, 405);
  assert.equal(unsupported.headers.get('allow'), 'POST');
  assert.equal((await handler(new Request('https://app.test/api/oneminutelogs/browser', { method: 'POST' }))).status, 503);
});

test('admin session cookie is protected, rotates with the password, expires, and logs out', async t => {
  const handler = forwardRequest({ logger: { get: async () => ({ logs: [] }) } });
  const request = await authenticated(new Request('https://app.test/api/oneminutelogs/logs'));
  const cookie = request.headers.get('cookie');
  assert.equal((await handler(request)).status, 200);
  const session = () => new Request('https://app.test/api/oneminutelogs/admin/session', { headers: { cookie } });
  assert.equal((await handler(session())).status, 200);
  const changed = forwardRequest({ admin: { ...admin, password: 'a-new-password' } });
  assert.equal((await changed(session())).status, 401);
  const tampered = new Request(request, { headers: { cookie: cookie + 'x' } });
  assert.equal((await handler(tampered)).status, 401);
  const realNow = Date.now;
  try { Date.now = () => realNow() + 9 * 3600000; assert.equal((await handler(session())).status, 401); }
  finally { Date.now = realNow; }
  const logout = await handler(new Request('https://app.test/api/oneminutelogs/admin/logout', { method: 'POST', headers: { origin: 'https://app.test', cookie } }));
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /HttpOnly; SameSite=Strict; Max-Age=0; Secure/);
  assert.equal((await handler(session())).status, 401);
});

test('login rejects short configuration, wrong passwords, cross-origin requests, and limits attempts', async () => {
  const post = (password, origin = 'https://app.test') => new Request('https://app.test/api/oneminutelogs/admin/login', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
  const bad = forwardRequest({ admin: { ...admin, password: 'short' } });
  assert.equal((await bad(post('short'))).status, 503);
  const handler = forwardRequest({ admin: { ...admin, sessionSecret: 'rate-limiting-test-secret'.repeat(3) } });
  assert.equal((await handler(post(admin.password, 'https://attacker.test'))).status, 403);
  for (let i = 0; i < 10; i++) assert.equal((await handler(post('wrong-password'))).status, 401);
  assert.equal((await handler(post(admin.password))).status, 429);
});

test('server-provided Clerk token bypasses password and uses upstream identity without an API key', async t => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  let upstreamStatus = 200;
  global.fetch = async (url, options) => {
    assert.ok(url.startsWith('https://oml.test/'));
    assert.deepEqual(options.headers, { Authorization: 'Bearer server-clerk-token' });
    return upstreamStatus === 200 ? Response.json({ logs: [] }) : Response.json({ error: 'Unauthorized' }, { status: upstreamStatus });
  };
  const handler = sdkForwardRequest({ authToken: 'server-clerk-token', baseUrl: 'https://oml.test', logger: { get: () => assert.fail('token reads must not use logger credentials') } });
  for (const route of ['logs', 'stream']) {
    assert.equal((await handler(new Request(`https://app.test/api/oneminutelogs/${route}`))).status, 200);
    upstreamStatus = 401;
    assert.equal((await handler(new Request(`https://app.test/api/oneminutelogs/${route}`))).status, 401);
    upstreamStatus = 200;
  }
  const session = await handler(new Request('https://app.test/api/oneminutelogs/admin/session'));
  assert.deepEqual(await session.json(), { authenticated: true, authMode: 'token' });
  const untrusted = sdkForwardRequest({});
  assert.equal((await untrusted(new Request('https://app.test/api/oneminutelogs/logs', { headers: { authorization: 'Bearer attacker-token', authToken: 'attacker-token' } }))).status, 401);
  const denied = sdkForwardRequest({ authToken: 'server-clerk-token', authorize: () => false });
  assert.equal((await denied(new Request('https://app.test/api/oneminutelogs/logs'))).status, 401);
});

test('admin login honors incoming Host when Next normalizes Request.url', async () => {
  const handler = forwardRequest({ admin: { ...admin, sessionSecret: 'normalized-host-test-secret'.repeat(3) } });
  const response = await handler(new Request('http://localhost:3219/api/oneminutelogs/admin/login', {
    method: 'POST', headers: { host: '127.0.0.1:3219', origin: 'http://127.0.0.1:3219', 'content-type': 'application/json' }, body: JSON.stringify({ password: admin.password }),
  }));
  assert.equal(response.status, 200);
});

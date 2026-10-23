const { test } = require('node:test');
const assert = require('node:assert/strict');
const { forwardRequest, createLogger } = require('../dist/index.cjs');
const admin = { password: 'dashboard-test-password', sessionSecret: 'dashboard-test-signing-secret'.repeat(2) };
const condition = 'a'.repeat(64);
const operations = [
  'dashboard/overview', 'dashboard/api-performance',
  'dashboard/browser-health', 'dashboard/recent-logs',
  'dashboard/realtime-logs', 'dashboard/realtime-logs/stream',
  'dashboard/api-performance/logs?method=GET&endpoint=%2Fapi%2Ftest',
  'dashboard/api-performance/logs/stream?method=GET&endpoint=%2Fapi%2Ftest',
  'dashboard/incidents', `dashboard/incidents/${condition}/logs`,
  `dashboard/incidents/${condition}/logs/stream`, 'billing/usage', 'alerts/custom-rules',
];
async function cookieFor(handler) {
  const response = await handler(new Request('https://app.test/api/oneminutelogs/admin/login', { method: 'POST', headers: { origin: 'https://app.test', 'content-type': 'application/json' }, body: JSON.stringify({ password: admin.password }) }));
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}

test('API performance forwards the 500-endpoint snapshot and rejects oversized limits', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  let calls = 0;
  global.fetch = async url => {
    calls++;
    assert.equal(new URL(url).searchParams.get('limit'), '500');
    return Response.json({ endpoints: [] });
  };
  const handler = forwardRequest({ admin, apiKey: 'limit-test-key', projectName: 'shop', baseUrl: 'https://oml.test/api/v2' });
  const cookie = await cookieFor(handler);
  const request = limit => handler(new Request(`https://app.test/api/oneminutelogs/dashboard/api-performance?range=7d&limit=${limit}&offset=0&sort=requests`, { headers: { cookie } }));
  assert.equal((await request(500)).status, 200);
  const invalid = await request(501);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'Invalid limit' });
  assert.equal(calls, 1);
});

test('every embedded dashboard route requires authorization before upstream access', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  global.fetch = () => assert.fail('unauthenticated requests must not reach upstream');
  const handler = forwardRequest({ admin, apiKey: 'test-key', projectName: 'shop' });
  for (const path of operations) assert.equal((await handler(new Request(`https://app.test/api/oneminutelogs/${path}`))).status, 401, path);
});

test('all dashboard bridges preserve methods, project scope, streams and credential isolation', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  const logger = createLogger({ apiKey: 'server-dashboard-key', projectName: 'shop' });
  const handler = forwardRequest({ logger, admin, baseUrl: 'https://oml.test/api/v2' });
  const cookie = await cookieFor(handler);
  const received = [];
  global.fetch = async (url, options) => {
    url = new URL(url);
    received.push(url.pathname);
    if (url.pathname.includes('/dashboard/realtime-logs') || url.pathname.includes('/dashboard/api-performance') || url.pathname.endsWith('/dashboard/browser-health')) assert.equal(url.searchParams.get('range'), '7d');
    assert.equal(url.origin, 'https://oml.test');
    assert.equal(options.headers['x-api-key'], 'server-dashboard-key');
    assert.equal(options.headers['x-oml-project-name'], 'shop');
    assert.equal(options.headers.cookie, undefined);
    assert.equal(options.headers.authorization, undefined);
    if (url.pathname.endsWith('/stream')) return new Response('event: logs\ndata: {"logs":[]}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
    if (url.pathname.includes('/custom-rules')) return Response.json([]);
    if (url.pathname.endsWith('/logs') || url.pathname.endsWith('/recent-logs') || url.pathname.endsWith('/realtime-logs')) return Response.json({ logs: [] });
    return Response.json({ placeholder: true });
  };
  for (const path of operations) {
    const response = await handler(new Request(`https://app.test/api/oneminutelogs/${path}`, { headers: { cookie } }));
    assert.equal(response.status, 200, path);
    if (path.split('?')[0].endsWith('/stream')) { assert.match(response.headers.get('content-type'), /text\/event-stream/); assert.match(await response.text(), /event: logs/); }
    else await response.json();
  }
  assert.equal(received.length, operations.length);
  const malformed = await handler(new Request('https://app.test/api/oneminutelogs/dashboard/api-performance/logs', { headers: { cookie } }));
  assert.equal(malformed.status, 400);
  const deniedWrite = await handler(new Request('https://app.test/api/oneminutelogs/alerts/custom-rules', { method: 'POST', headers: { cookie, origin: 'https://attacker.test' } }));
  assert.equal(deniedWrite.status, 403);
  const created = await handler(new Request('https://app.test/api/oneminutelogs/alerts/custom-rules', {
    method: 'POST', headers: { cookie, origin: 'https://app.test', 'content-type': 'application/json' },
    body: JSON.stringify({ version: 2, conditions: [{ field: 'level', operator: 'eq', value: 'error' }] }),
  }));
  assert.equal(created.status, 201);
  const deleted = await handler(new Request('https://app.test/api/oneminutelogs/alerts/custom-rules?ruleId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
    method: 'DELETE', headers: { cookie, origin: 'https://app.test' },
  }));
  assert.equal(deleted.status, 200);

});

test('Clerk dashboard access uses bearer auth and never serves cached data after backend rejection', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  let status = 200;
  let count = 0;
  global.fetch = async (url, options) => {
    count++;
    assert.equal(options.headers.Authorization, 'Bearer clerk-test-token');
    assert.equal(options.headers['x-api-key'], undefined);
    return Response.json({ result: 'dashboard' }, { status });
  };
  const handler = forwardRequest({ authToken: 'clerk-test-token', projectName: 'shop', baseUrl: 'https://oml.test' });
  const request = () => new Request('https://app.test/api/oneminutelogs/dashboard/overview');
  assert.equal((await handler(request())).status, 200);
  status = 401;
  assert.equal((await handler(request())).status, 401);
  assert.equal(count, 2);
});

test('legitimate immediate stream reconnects succeed while burst abuse remains limited', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  let connections = 0;
  global.fetch = async () => {
    connections++;
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('event: ready\ndata: {}\n\n')); } }), { headers: { 'Content-Type': 'text/event-stream' } });
  };
  const handler = forwardRequest({ authToken: 'stream-reconnect-test', projectName: 'reconnect-tests', baseUrl: 'https://oml.test' });
  const request = () => new Request('https://app.test/api/oneminutelogs/dashboard/realtime-logs/stream?range=7d');
  for (let i=0;i<6;i++) {
    const response = await handler(request());
    assert.equal(response.status, 200, `reconnect ${i}`);
    await response.body.cancel();
  }
  const limited = await handler(request());
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.equal(connections, 6);
});

test('stream concurrency is bounded and a cancelled stream releases its slot', async t => {
  const previous = global.fetch;
  t.after(() => { global.fetch = previous; });
  global.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(': open\n\n')); } }), { headers: { 'Content-Type': 'text/event-stream' } });
  const handler = forwardRequest({ authToken: 'concurrency-test', projectName: 'concurrency-test', baseUrl: 'https://oml.test' });
  const request = () => new Request('https://app.test/api/oneminutelogs/dashboard/realtime-logs/stream?range=7d');
  const responses = [];
  try {
    for (let i=0;i<3;i++) { const response = await handler(request()); assert.equal(response.status,200); responses.push(response); }
    assert.equal((await handler(request())).status,429);
    await responses.shift().body.cancel();
    const reopened = await handler(request());
    assert.equal(reopened.status,200);
    responses.push(reopened);
  } finally { for (const response of responses) await response.body.cancel(); }
});

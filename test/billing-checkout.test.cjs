const { test } = require('node:test');
const assert = require('node:assert/strict');
const { forwardRequest } = require('../dist/index.cjs');
const make = (path='checkout', origin='https://app.test', plan='business') => new Request(`https://app.test/api/oneminutelogs/billing/${path}`, { method:'POST',headers:{origin,'content-type':'application/json'},body:path==='checkout'?JSON.stringify({plan,userId:'spoofed'}):undefined });
test('billing proxy requires admin/token access and matching origin', async t => {
  const previous=global.fetch;t.after(()=>{global.fetch=previous;});
  global.fetch=()=>assert.fail('blocked request reached backend');
  assert.equal((await forwardRequest({apiKey:'server-key'})(make())).status,401);
  const handler=forwardRequest({authToken:'owner-token',baseUrl:'https://oml.test'});
  assert.equal((await handler(make('checkout','https://attacker.test'))).status,403);
  assert.equal((await handler(make('checkout','https://app.test','free'))).status,400);
});
test('billing forwards only selected plan with server credentials and accepts only Stripe redirects', async t => {
  const previous=global.fetch;t.after(()=>{global.fetch=previous;});
  let redirect='https://checkout.stripe.com/c/pay/test';
  global.fetch=async(url,options)=>{
    assert.equal(new URL(url).href,'https://oml.test/api/v2/billing');
    assert.equal(options.headers.Authorization,'Bearer owner-token');
    assert.equal(options.headers['x-api-key'],undefined);
    assert.deepEqual(JSON.parse(options.body),{plan:'business'});
    return Response.json({url:redirect});
  };
  const handler=forwardRequest({authToken:'owner-token',baseUrl:'https://oml.test/api/v2'});
  assert.deepEqual(await (await handler(make())).json(),{url:redirect});
  redirect='https://attacker.test/steal';
  assert.equal((await handler(make())).status,502);
  redirect='javascript:alert(1)';
  assert.equal((await handler(make())).status,502);
});
test('billing portal forwards account-wide authentication and preserves backend rejection',async t=>{
 const previous=global.fetch;t.after(()=>{global.fetch=previous;});
 let status=200;
 global.fetch=async(url,options)=>{assert.equal(new URL(url).pathname,'/api/v2/billing/portal');assert.equal(options.headers.Authorization,'Bearer owner-token');return Response.json({url:'https://billing.stripe.com/p/session/test'},{status});};
 const handler=forwardRequest({authToken:'owner-token',baseUrl:'https://oml.test/api/v2'});
 assert.equal((await handler(make('portal'))).status,200);
 status=401;assert.equal((await handler(make('portal'))).status,401);
});

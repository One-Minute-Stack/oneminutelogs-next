const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const source = readFileSync(require.resolve('../src/dashboard/request-cache.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const fixture = new Module(__filename + '.fixture'); fixture._compile(compiled, fixture.filename || __filename);
const { DashboardRequestCache } = fixture.exports;

test('deduplicates concurrent reads, reuses fresh data, and refetches after expiry', async () => {
  const realNow = Date.now;
  let now = 1000, calls = 0;
  Date.now = () => now;
  try {
    const cache = new DashboardRequestCache(30000);
    const load = async () => ++calls;
    assert.deepEqual(await Promise.all([cache.remember('/read',load),cache.remember('/read',load)]),[1,1]);
    now += 29999;
    assert.equal(await cache.remember('/read',load),1);
    now += 2;
    assert.equal(await cache.remember('/read',load),2);
  } finally { Date.now=realNow; }
});

test('does not cache failures or share private values across dashboard instances', async () => {
  const first = new DashboardRequestCache(), second = new DashboardRequestCache();
  await assert.rejects(first.remember('/read',async()=>{throw Error('failed');}));
  assert.equal(await first.remember('/read',async()=>'first-user'),'first-user');
  assert.equal(await second.remember('/read',async()=>'second-user'),'second-user');
});

test('mutation invalidation prevents an old in-flight read from restoring stale cache', async () => {
  const cache = new DashboardRequestCache();
  let finish;
  const old = cache.remember('/rules',()=>new Promise(resolve=>{finish=resolve;}));
  await Promise.resolve();
  cache.invalidate('/rules');
  assert.equal(await cache.remember('/rules',async()=>'new'),'new');
  finish('old'); await old;
  assert.equal(await cache.remember('/rules',async()=>'incorrect'),'new');
  cache.clear();
  assert.equal(await cache.remember('/rules',async()=>'cleared'),'cleared');
});

test('keeps memory bounded', async () => {
  const cache = new DashboardRequestCache(30000,2);
  await cache.remember('/one',async()=>1);
  await cache.remember('/two',async()=>2);
  await cache.remember('/three',async()=>3);
  assert.equal(await cache.remember('/one',async()=>4),4);
});

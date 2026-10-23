import { createRequire } from 'node:module';
const require=createRequire(new URL('../../../apps/demo/package.json', import.meta.url));
const WebSocket=require('next/dist/compiled/ws');
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
// Uses the repository's demo Next.js installation and a temporary independent app.
const demo = fileURLToPath(new URL('../../../apps/demo/', import.meta.url));
const fixture = await mkdtemp(join(resolve(demo, '../..'), '.oml-dashboard-fixture-'));
await mkdir(join(fixture, 'app/api/oneminutelogs/[...path]'), { recursive: true });
await symlink(join(demo, 'node_modules'), join(fixture, 'node_modules'), 'dir');
await writeFile(join(fixture, 'package.json'), JSON.stringify({ name: 'oml-dashboard-smoke', private: true, dependencies: { next: '16.4.0', react: '19.3.0', 'react-dom': '19.3.0', '@oneminutelogs/next': '1.2.0' } }));
await writeFile(join(fixture, 'app/layout.tsx'), 'export default function Layout({children}: {children: React.ReactNode}) { return <html><body style={{margin:0}}>{children}</body></html>; }');
await writeFile(join(fixture, 'app/page.tsx'), "import { OMLDashboard } from '@oneminutelogs/next/dashboard'; export default function Page() { return <OMLDashboard theme='light' />; }");
await writeFile(join(fixture, 'app/api/oneminutelogs/[...path]/route.ts'), "import { forwardRequest } from '@oneminutelogs/next'; const handler = forwardRequest({apiKey:'smoke-only-key',projectName:'smoke-test',baseUrl:'http://127.0.0.1:3220/api/v2'}); export {handler as GET,handler as POST,handler as DELETE};");
await writeFile(join(fixture, 'next.config.mjs'), `export default { experimental: { externalDir: true, agentRules: false }, cacheComponents: true, turbopack: { root: ${JSON.stringify(resolve(demo, '../..'))} } };`);
const next = spawn(process.execPath, [join(demo, 'node_modules/next/dist/bin/next'), 'dev', ...(process.env.OML_TEST_BUNDLER === 'webpack' ? ['--webpack'] : []), '--hostname', '127.0.0.1', '--port', '3219'], { cwd: fixture, env: { ...process.env, ONE_MINUTE_LOGS_ADMIN_PASSWORD: 'sdk-dashboard-smoke', ONE_MINUTE_LOGS_ADMIN_SESSION_SECRET: 'sdk-dashboard-smoke-session-secret-123456789' }, stdio: 'ignore' });
const calls=[];
let realtimeConnections = 0, realtimeCloses = 0;
const upstream=createServer((req,res)=>{
 calls.push(req.url);
 assert.equal(req.headers['x-api-key'],'smoke-only-key');
 res.setHeader('Content-Type','application/json');
 if(req.url.startsWith('/api/v2/dashboard/realtime-logs/stream')) {
   realtimeConnections++;
   res.setHeader('Content-Type','text/event-stream');
   res.setHeader('Cache-Control','no-store');
   res.write('event: history\ndata: '+JSON.stringify({logs:[],nextCursor:null,window:{from:new Date(Date.now()-7*86400000).toISOString(),to:new Date().toISOString()}})+'\n\n');
   res.write('event: ready\ndata: {}\n\n');
   const timer=setInterval(()=>res.write(': keepalive\n\n'),2000);
   res.on('close',()=>{clearInterval(timer);realtimeCloses++;});
   return;
 }

 if(req.url==='/api/v2/billing' && req.method==='POST') {
  let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{assert.deepEqual(JSON.parse(body),{plan:'business'});res.end(JSON.stringify({url:'https://checkout.stripe.com/c/pay/smoke-only'}));});return;
 }
 if(req.url.startsWith('/api/v2/billing/usage'))return res.end(JSON.stringify({plan:{name:'free',label:'Free',monthlyPrice:0,retentionDays:7},usage:{ingestedBytes:'0',limitBytes:'1000',usedGb:0,limitGb:1,percentage:0},period:{start:new Date().toISOString(),end:new Date(Date.now()+86400000).toISOString()},generatedAt:new Date().toISOString()}));
 if(req.url.startsWith('/api/v2/dashboard/overview'))return res.end(JSON.stringify({generatedAt:new Date().toISOString(),range:{from:new Date().toISOString(),to:new Date().toISOString(),timezone:'UTC',interval:'1h'},summary:{observedRequests:{value:12,previousValue:10,changePercent:20},errorRate:{valuePercent:0,changePercentagePoints:0,failures:0,expectedRange:null},averageResponseTime:{valueMs:25,changePercent:0},activeIncidents:{value:0,highPriority:0}},activity:Array.from({length:24},(_,i)=>({from:new Date(Date.now()-(24-i)*3600000).toISOString(),to:new Date(Date.now()-(23-i)*3600000).toISOString(),requests:1,failures:0,logs:1})),topServices:{totalServices:1,items:[{serviceName:'smoke-service',logs:24}]}}));
 if(req.url.startsWith('/api/v2/dashboard/api-performance?'))return res.end(JSON.stringify({summary:{observedEndpoints:0,requests:0,failures:0,averageMs:null,errorRatePercent:null},endpoints:[],methods:[],pagination:{limit:25,offset:0,total:0,hasMore:false}}));
 if(req.url.startsWith('/api/v2/dashboard/browser-health'))return res.end(JSON.stringify({range:'7d',window:{from:new Date(Date.now()-7*86400000).toISOString(),to:new Date().toISOString()},summary:{activeSessions:0,observedSessions:0,javascriptErrors:0,affectedSessions:0,networkFailures:0},issues:[],recentErrors:[],hasMoreIssues:false,hasMoreErrors:false}));
 if(req.url.startsWith('/api/v2/dashboard/recent-logs'))return res.end(JSON.stringify({logs:[]}));
 if(req.url.startsWith('/api/v2/alerts/custom-rules'))return res.end('[]');
 res.statusCode=503;res.end('{"error":"smoke fixture has no data for this section"}');
});
await new Promise(r=>upstream.listen(3220,'127.0.0.1',r));
const profile=await mkdtemp(join(tmpdir(),'oml-dashboard-chrome-'));
const chrome=spawn(process.env.OML_TEST_CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome'),['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=3221','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try {
 for (let i=0; i<100; i++) { try { const response = await fetch('http://127.0.0.1:3219/api/oneminutelogs/admin/session'); if (response.status === 401) break; } catch {} await new Promise(r=>setTimeout(r,100)); }
 let page;
 for(let i=0;i<100;i++) {try {const res=await fetch('http://127.0.0.1:3221/json');page=(await res.json()).find(x=>x.type==='page');if(page)break;}catch{} await new Promise(r=>setTimeout(r,100));}
 assert.ok(page,'Chrome started');
 socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();const errors=[];const networkURLs=new Map();let browserCancellations=0;let streamRateLimits=0;
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Fetch.requestPaused')void cdp('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from('<html><body>Mock Stripe checkout</body></html>').toString('base64')});if(message.method==='Network.requestWillBeSent')networkURLs.set(message.params.requestId,message.params.request.url);if(message.method==='Network.loadingFailed'&&message.params.canceled&&networkURLs.get(message.params.requestId)?.includes('/browser-health'))browserCancellations++;if(message.method==='Network.responseReceived'&&message.params.response.url.includes('/stream?range=7d')&&message.params.response.status===429)streamRateLimits++;if(message.id){pending.get(message.id)?.(message);pending.delete(message.id);}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text+':'+(message.params.exceptionDetails.exception?.description??''));});
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const current=++id;pending.set(current,msg=>msg.error?reject(Error(JSON.stringify(msg.error))):resolve(msg.result));socket.send(JSON.stringify({id:current,method,params}));});
 const evaluate=async(expression)=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description);return result.result.value;};
 const until=async(expression)=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,150));}throw Error('Timeout: '+expression+'\n'+JSON.stringify(await evaluate('document.body.innerText.slice(0,1600)')));};
 await cdp('Network.enable');await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Page.navigate',{url:'http://127.0.0.1:3219'});
 await until('Boolean(document.querySelector("dialog[open]"))');
 // Simulate a host reset such as Tailwind's preflight: the SDK must still center.
 await evaluate(`(()=>{const style=document.createElement('style');style.textContent='dialog { margin:0; padding:0; }';document.head.append(style);})()`);
 const centered = await evaluate(`(()=>{const box=document.querySelector('dialog').getBoundingClientRect();return {x:Math.abs(box.x+box.width/2-innerWidth/2),y:Math.abs(box.y+box.height/2-innerHeight/2)};})()`);
 assert.ok(centered.x < 2 && centered.y < 2, 'modal centered despite host dialog reset');
 await evaluate(`document.querySelector('[aria-label="Show password"]').click()`);
 assert.equal(await evaluate('document.querySelector(".oml-admin-input").type'), 'text');
 await evaluate(`document.querySelector('[aria-label="Hide password"]').click()`);
 const desktopModal=await cdp('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/oml-admin-modal-desktop.png',Buffer.from(desktopModal.data,'base64'));
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const mobileBox = await evaluate(`(()=>{const box=document.querySelector('dialog').getBoundingClientRect();return {x:box.x,width:box.width,viewport:innerWidth};})()`);
 assert.ok(mobileBox.x >= 15 && mobileBox.x + mobileBox.width <= mobileBox.viewport - 15, 'mobile modal fits viewport');
 const mobileModal=await cdp('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/oml-admin-modal-mobile.png',Buffer.from(mobileModal.data,'base64'));
 await cdp('Emulation.clearDeviceMetricsOverride');

 assert.equal(await evaluate('document.querySelectorAll("aside nav a").length'),0,'dashboard does not mount before login');
 await evaluate(`(()=>{const input=document.querySelector('input[type=password]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'sdk-dashboard-smoke');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await evaluate(`document.querySelector('form').requestSubmit()`);
 await until('document.querySelectorAll("aside nav a").length===7');
 await until('document.body.innerText.includes("smoke-service")');
 assert.equal(await evaluate('document.querySelector(".oml-dashboard")?.dataset.omlTheme'), 'light');
 const shellBackground = await evaluate('getComputedStyle(document.querySelector(".oml-dashboard__shell")).backgroundColor');
 assert.match(shellBackground, /rgb\(2[4-5][0-9], 2[4-5][0-9], 2[4-5][0-9]\)/, 'light theme renders a light shell');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("aside")).position'),'sticky','SDK stylesheet is loaded');
 for (let i=0;i<2;i++) {
   await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='API Performance').click()`);
   await until(`document.body.innerText.includes('No API request observations in the last 7 days.')`);
   await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='Overview').click()`);
   await until(`document.body.innerText.includes('smoke-service')`);
 }
 assert.equal([...networkURLs.values()].filter(url=>url.includes('/api/oneminutelogs/dashboard/overview')).length,1,'Overview uses fresh client cache across section visits');
 assert.equal([...networkURLs.values()].filter(url=>url.includes('/api/oneminutelogs/dashboard/api-performance?')).length,1,'APM uses fresh client cache across section visits');

 await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='Browser Health').click()`);
 await until(`document.querySelector('main h1')?.innerText==='Browser Health' && document.body.innerText.includes('Updated')`);
 assert.equal(await evaluate('location.hash'), '#rum');
 assert.equal(await evaluate('document.querySelectorAll("main select").length'), 0, 'no time filter for zero observed sessions');
 assert.ok(calls.some(url=>url.includes('/browser-health?range=7d')), 'browser health requests seven days');
 await cdp('Page.reload');
 await until(`document.querySelector('main h1')?.innerText==='Browser Health'`);
 assert.equal(await evaluate('location.hash'), '#rum', 'reload preserves Browser Health');
 await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='API Performance').click()`);
 await evaluate('history.back()');
 await until(`document.querySelector('main h1')?.innerText==='Browser Health'`);
 await evaluate('history.forward()');
 await until(`document.querySelector('main h1')?.innerText==='API Performance'`);

 for(const label of ['API Performance','Browser Health','Realtime Logs','Incidents','Alerts','Billing']){
  await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText===${JSON.stringify(label)}).click()`);
  await new Promise(r=>setTimeout(r,200));
  assert.ok(await evaluate(`document.body.innerText.includes(${JSON.stringify(label)})`));
 }

 // Returning to Live Logs must preserve the same subscription and local filters.
 await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='Realtime Logs').click()`);
 await until(`document.querySelector('[aria-label="Log tail"] [role="status"]')?.innerText.includes('Live')`);
 assert.equal(realtimeConnections, 1, 'one upstream stream after initial visit');
 await evaluate(`(()=>{const input=document.querySelector('input[placeholder="Search message, service or trace…"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'preserved-filter');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 for (let i=0;i<3;i++) {
   await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='Browser Health').click()`);
   await until(`document.querySelector('main h1')?.innerText==='Browser Health'`);
   await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='Realtime Logs').click()`);
   await until(`document.querySelector('main h1')?.innerText==='Realtime Logs'`);
 }
 assert.equal(realtimeConnections, 1, 'section switches reuse the original stream');
 assert.equal(realtimeCloses, 0, 'section switches never close a healthy stream');
 assert.equal(await evaluate(`document.querySelector('input[placeholder="Search message, service or trace…"]').value`), 'preserved-filter', 'filters survive section switches');
 assert.equal(calls.filter(url=>url.startsWith('/api/v2/dashboard/realtime-logs/stream')).length,1);
 assert.equal([...networkURLs.values()].filter(url=>url.includes('/api/oneminutelogs/billing/usage')).length,2,'usage loads once per dashboard mount, never per section click');
 assert.equal([...networkURLs.values()].filter(url=>url.includes('/api/oneminutelogs/dashboard/browser-health')).length,2,'Browser Health loads once per dashboard mount');
 assert.equal(browserCancellations,0,'Strict Mode does not start and cancel duplicate Browser Health requests');
 await cdp('Page.reload');
 await until(`document.querySelector('[aria-label="Log tail"] [role="status"]')?.innerText.includes('Live')`);
 assert.equal(realtimeConnections,2,'hard reload can reconnect immediately');
 assert.equal(streamRateLimits,0,'no false 429 on navigation or hard reload');
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/oml-dashboard-mobile.png',Buffer.from(shot.data,'base64'));
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).some(b=>b.innerText==='Sign out')`), false, 'dashboard has no sign-out header');
 await cdp('Emulation.clearDeviceMetricsOverride');
 await evaluate(`Array.from(document.querySelectorAll('aside nav a')).find(a=>a.innerText==='Billing').click()`);
 await until(`Array.from(document.querySelectorAll('button')).some(b=>b.innerText.includes('Change plan'))`);
 await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.includes('Change plan')).click()`);
 await until(`document.body.innerText.includes('Find your next plan')`);
 await cdp('Fetch.enable',{patterns:[{urlPattern:'https://checkout.stripe.com/*',requestStage:'Request'}]});
 await evaluate(`Array.from(document.querySelectorAll('button')).filter(b=>b.innerText==='Upgrade').at(-1).click()`);
 await until(`document.body.innerText==='Mock Stripe checkout'`);
 assert.equal(await evaluate('location.href'),'https://checkout.stripe.com/c/pay/smoke-only','upgrade redirects to backend checkout URL');
 assert.equal(calls.filter(url=>url==='/api/v2/billing').length,1,'upgrade creates one checkout through backend');
 assert.deepEqual(errors,[],'no uncaught browser errors');
 console.log(JSON.stringify({result:'PASS',checks:['upgrade calls backend and redirects to Stripe','client cache avoids repeat Overview/APM requests','no duplicate cancelled browser request','usage once per mount','immediate reload reconnect','reused live connection','no stream closes on section switches','preserved log filters','seven-day browser health','hide empty time filter','hash reload','back/forward navigation','centered modal','host CSS reset','password visibility','mobile modal','password modal','protected mount','login','real backend bridge','7 sections','CSS modules','mobile render','no sign-out header'],upstreamRequests:calls.length}));
} finally {socket?.close();chrome.kill();next.kill();upstream.closeAllConnections();upstream.close();await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});await rm(fixture,{recursive:true,force:true,maxRetries:5,retryDelay:100});}

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const root = path.resolve('dist/wirdlink/browser');
assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Run npm run build first.');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wirdlink-check-'));
const artifacts = path.join(os.tmpdir(), 'wirdlink-frontend-check');
fs.mkdirSync(artifacts, { recursive: true });
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};
const server = http.createServer((request, response) => {
  let file = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
    file = path.join(root, 'index.html');
  response.setHeader('Content-Type', mimeTypes[path.extname(file)] ?? 'application/octet-stream');
  response.end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const chromeBinary =
  process.env.CHROME_BIN ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'google-chrome');
const chrome = spawn(
  chromeBinary,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    '--user-data-dir=' + profile,
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
chrome.on('error', (error) => console.error(error.message));
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let socket;
try {
  let targets;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
      break;
    } catch {
      await sleep(100);
    }
  }
  assert.ok(targets, 'Chrome did not start. Check CHROME_BIN.');
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => (socket.onopen = resolve));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    }
    if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails.text);
  };
  const cdp = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(Error('CDP timeout: ' + method));
      }, 15000);
      pending.set(id, (message) => {
        clearTimeout(timeout);
        message.error ? reject(message.error) : resolve(message.result);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const run = async (expression) => {
    const result = await cdp('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails)
      throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (await run(expression)) return;
      await sleep(100);
    }
    throw Error('Timed out: ' + expression);
  };
  const viewport = (width, height = 844) =>
    cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
  const navigate = async (route, selector) => {
    await cdp('Page.navigate', { url: origin + route });
    await wait('!!document.querySelector(' + JSON.stringify(selector) + ')');
    await run('document.fonts.ready.then(()=>true)');
  };
  const enter = (selector, value) =>
    run(
      `(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
  const submit = () =>
    run(
      "document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));true",
    );
  const screenshot = async (name) => {
    await sleep(200);
    return fs.writeFileSync(
      path.join(artifacts, name + '.png'),
      Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    );
  };
  const checkLayout = async (label) => {
    for (const width of [320, 390, 1440]) {
      await viewport(width, 1000);
      assert.equal(
        await run(
          'document.querySelector("main").scrollWidth>document.querySelector("main").clientWidth',
        ),
        false,
        label + ' overflow at ' + width,
      );
    }
    await viewport(390);
    await run("document.documentElement.style.fontSize='200%'");
    const overflow = await run(
      'document.querySelector("main").scrollWidth>document.querySelector("main").clientWidth',
    );
    if (overflow)
      console.error(
        await run(
          '(()=>{const main=document.querySelector("main");const bounds=main.getBoundingClientRect();return [...main.querySelectorAll("*")].filter(element=>element.getBoundingClientRect().right>bounds.right+1).slice(0,12).map(element=>({tag:element.tagName,class:element.className,width:element.getBoundingClientRect().width,text:element.textContent.slice(0,35)}))})()',
        ),
      );
    assert.equal(overflow, false, label + ' text zoom overflow');
    await run("document.documentElement.style.fontSize='100%'");
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await viewport(390);
  await navigate('/', 'app-home-page');
  await wait('[...document.images].every(image=>image.complete&&image.naturalWidth>0)');
  await checkLayout('Home');
  assert.ok(await run('document.fonts.check(\'600 20px "Nunito Sans"\')'));
  assert.ok(await run('!!document.querySelector(\'a.settings-link[href="/preferences"]\')'));
  assert.equal(
    await run(
      "getComputedStyle(document.querySelector('.bottom-nav__link--active .bottom-nav__icon')).backgroundColor",
    ),
    'rgb(220, 232, 235)',
  );
  await screenshot('home');
  await viewport(1440, 1000);
  await navigate('/', 'app-home-page');
  await wait("document.querySelector('.desktop-layout--entered')!==null");
  assert.notEqual(
    await run("getComputedStyle(document.querySelector('.app-shell')).animationName"),
    'none',
  );
  await sleep(650);
  const frame = await run(
    "(()=>{const rect=document.querySelector('.app-shell').getBoundingClientRect();return {width:rect.width,height:rect.height,left:rect.left,top:rect.top,bottom:rect.bottom}})()",
  );
  assert.equal(frame.width, 390);
  assert.ok(frame.top >= 0 && frame.bottom <= 1000);
  await screenshot('desktop');
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  assert.equal(
    await run("getComputedStyle(document.querySelector('.app-shell')).animationName"),
    'none',
  );
  await viewport(390);
  await run(
    "document.querySelector('[aria-controls=filters]').focus();document.querySelector('[aria-controls=filters]').click();true",
  );
  await wait("document.querySelector('dialog').open");
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await wait("!document.querySelector('dialog').open");
  assert.equal(await run("document.activeElement?.getAttribute('aria-controls')"), 'filters');
  // Exercise the real browser history; direct entry is intentionally a separate case.
  await navigate('/', 'app-home-page');
  await run("document.querySelector('.settings-link').click();true");
  await wait("!!document.querySelector('app-preferences-page')");
  await run('document.querySelector(\'a.preferences-link[href="/aide"]\').click();true');
  await wait("!!document.querySelector('app-information-page')");
  await run("document.querySelector('app-back-button button').click();true");
  await wait("!!document.querySelector('app-preferences-page')");
  await cdp('Page.reload');
  await wait("!!document.querySelector('app-preferences-page')");
  await run("document.querySelector('app-back-button button').click();true");
  await wait("!!document.querySelector('app-home-page')");
  await navigate('/mes-parts', 'app-my-parts-page');
  await run("document.querySelector('a.device-options-link').click();true");
  await wait("!!document.querySelector('app-preferences-page')");
  await run("document.querySelector('app-back-button button').click();true");
  await wait("!!document.querySelector('app-my-parts-page')");
  await navigate('/preferences', 'app-preferences-page');
  await run("document.querySelector('app-back-button button').click();true");
  await wait("!!document.querySelector('app-home-page')");
  await navigate('/wird/salat-nabi', '#quantity');
  await checkLayout('Participation');
  assert.ok(await run("document.querySelector('button[type=submit]').disabled"));
  await enter('#quantity', '401');
  await wait("document.querySelector('#quantity-error')!==null");
  assert.equal(
    await run("getComputedStyle(document.querySelector('#quantity')).borderColor"),
    'rgb(179, 38, 30)',
  );
  await enter('#quantity', '10');
  await submit();
  await wait("document.querySelector('h1')?.textContent==='Mes parts'");
  await run("document.querySelector('article button').click();true");
  await wait("document.querySelector('h1')?.textContent==='Merci !'");
  assert.equal(
    await run("document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')"),
    '610',
  );
  await checkLayout('Thanks');
  await navigate('/wird/salat-nabi/participants', 'app-participants-page');
  await checkLayout('Participants');
  assert.ok(await run("document.querySelector('main').textContent.includes('10 lus')"));
  await screenshot('participants');
  await navigate('/creer/contenu', '#draft-title');
  await enter('#draft-title', 'Notre wird de famille');
  await enter('#draft-target', '12000');
  await enter('#draft-description', 'Ensemble ce vendredi.');
  await enter('#draft-instructions', 'Fatiha ×1\nSalatoul Fatihi ×7\nAstaghfiroullah ×100');
  await checkLayout('Creation content');
  // A generated portrait is used; no personal photo or source poster is copied.
  await run(
    `(()=>{const canvas=document.createElement('canvas');canvas.width=200;canvas.height=600;const context=canvas.getContext('2d');context.fillStyle='green';context.fillRect(0,0,200,600);return new Promise(resolve=>canvas.toBlob(blob=>{const data=new DataTransfer();data.items.add(new File([blob],'portrait.png',{type:'image/png'}));const input=document.querySelector('#draft-image');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));resolve(true)}))})()`,
  );
  await wait("document.querySelector('.draft-media__preview')?.naturalHeight===600");
  assert.ok(
    await run(
      "(()=>{const image=document.querySelector('.draft-media__preview');return Math.abs(image.clientHeight/image.clientWidth-3)<0.02})()",
    ),
  );
  // Exercise actual audio playback with a harmless six-second silent WAV.
  await run(
    `(()=>{const buffer=new ArrayBuffer(44+96000);const view=new DataView(buffer);const write=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))};write(0,'RIFF');view.setUint32(4,96036,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,8000,true);view.setUint32(28,16000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,96000,true);const data=new DataTransfer();data.items.add(new File([buffer],'test.wav',{type:'audio/wav'}));const input=document.querySelector('#draft-audio');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true})()`,
  );
  await wait("document.querySelector('audio')?.readyState>=1");
  await run("document.querySelector('app-audio-player button').click();true");
  await wait("document.querySelector('audio')?.paused===false");
  await run("document.querySelector('app-audio-player button').click();true");
  await wait("document.querySelector('audio')?.paused===true");
  await submit();
  await wait("document.querySelector('#draft-start')!==null");
  await enter('#draft-start', '2099-05-01');
  await checkLayout('Schedule');
  await submit();
  await wait("document.querySelector('h1')?.textContent==='Votre aperçu'");
  await wait("document.querySelector('.preview-card__image')?.naturalHeight===600");
  assert.ok(
    await run(
      "(()=>{const image=document.querySelector('.preview-card__image');return Math.abs(image.clientHeight/image.clientWidth-3)<0.02})()",
    ),
  );
  assert.equal(await run("document.querySelectorAll('.preview-card__text').length"), 2);
  await checkLayout('Preview');
  await cdp('Page.reload');
  await wait("document.querySelector('h1')?.textContent==='Votre aperçu'");
  assert.equal(await run("document.querySelectorAll('.preview-card__text').length"), 2);
  assert.equal(await run("!!document.querySelector('.preview-card__image')"), false);
  assert.equal(await run("!!document.querySelector('audio')"), false);
  await screenshot('preview-text');
  await run("document.querySelector('.preview-publish').click();true");
  await wait("document.querySelector('#auth-phone')!==null");
  await checkLayout('Sign in');
  await wait('[...document.images].every(image=>image.complete&&image.naturalWidth>0)');
  await screenshot('sign-in');
  await enter('#auth-phone', '77 123 45 67');
  await submit();
  await wait(
    "document.querySelector('app-request-state')?.textContent.includes('brouillon est conservé')",
  );
  assert.equal(await run("!!document.querySelector('#auth-code')"), false);
  await navigate('/acces/example', '#access-code');
  await checkLayout('Private access');
  await screenshot('private-access');
  await enter('#access-code', '1234');
  await submit();
  await wait(
    "document.querySelector('app-request-state')?.textContent.includes('pas encore disponible')",
  );
  await navigate('/partage/salat-nabi', 'app-share-actions');
  await checkLayout('Mobile sharing');
  const ids = await run('[...document.querySelectorAll("[id]")].map(node=>node.id)');
  assert.equal(new Set(ids).size, ids.length, 'Sharing IDs must be unique.');
  await screenshot('sharing');
  await navigate('/preferences', 'app-preferences-page');
  await checkLayout('Settings');
  assert.ok(await run('!!document.querySelector(\'a[href="/aide"]\')'));
  await screenshot('settings');
  await navigate('/wird/salat-nabi', '#quantity');
  await cdp('Network.enable');
  await cdp('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });
  await wait("document.querySelector('.offline-status')?.textContent.includes('Hors ligne')");
  assert.equal(await run("document.querySelector('button[type=submit]').disabled"), true);
  await cdp('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      widths: [320, 390, 1440],
      textZoom: '200%',
      frame,
      realAudio: true,
      portraitUncropped: true,
      creationTextRestored: true,
      noSimulatedAuthentication: true,
      offline: true,
      reducedMotion: true,
      consoleErrors: errors,
      screenshots: artifacts,
    }),
  );
} finally {
  socket?.close();
  server.close();
  if (chrome.exitCode === null) {
    const stopped = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill();
    await stopped;
  }
  fs.rmSync(profile, { recursive: true, force: true });
}

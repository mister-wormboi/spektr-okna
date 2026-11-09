const {spawn, spawnSync} = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets', 'window-inside-video');
const url = process.env.RECORD_URL || 'http://127.0.0.1:8001/tools/window-inside-record.html';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'inside-record-'));
  const browser = spawn('/opt/homebrew/bin/firefox', ['--headless', '--marionette', '--profile', profile, 'about:blank'], {
    env: {...process.env, MOZ_HEADLESS_WIDTH: '390', MOZ_HEADLESS_HEIGHT: '844'}, stdio: 'ignore'
  });
  let socket;
  for (let i = 0; i < 60; i++) {
    try {
      socket = net.connect(2828, '127.0.0.1');
      await new Promise((resolve, reject) => {socket.once('connect', resolve);socket.once('error', reject);});
      break;
    } catch {socket?.destroy();socket = null;await sleep(250);}
  }
  if (!socket) throw new Error('Firefox did not start');
  let buffer = '';
  const readers = [];
  socket.on('data', chunk => {
    buffer += chunk.toString();
    while (true) {
      const colon = buffer.indexOf(':');
      if (colon < 0) return;
      const length = Number(buffer.slice(0, colon));
      if (buffer.length < colon + 1 + length) return;
      const message = JSON.parse(buffer.slice(colon + 1, colon + 1 + length));
      buffer = buffer.slice(colon + 1 + length);
      readers.shift()?.(message);
    }
  });
  const read = () => new Promise(resolve => readers.push(resolve));
  await read();
  let id = 0;
  async function call(command, params = {}) {
    const data = JSON.stringify([0, ++id, command, params]);
    socket.write(`${Buffer.byteLength(data)}:${data}`);
    const message = await read();
    if (message[2]) throw new Error(JSON.stringify(message[2]));
    return message[3];
  }
  async function run(script) {
    return (await call('WebDriver:ExecuteAsyncScript', {script, args: [], newSandbox: false, sandbox: null}))?.value;
  }
  try {
    await call('WebDriver:NewSession', {capabilities: {}});
    await call('WebDriver:SetWindowRect', {x: 0, y: 0, width: 390, height: 844});
    await call('WebDriver:Navigate', {url});
    for (let i = 0; i < 100; i++) {
      if (await run('const done=arguments[arguments.length-1];done(Boolean(window.recorderReady));')) break;
      await sleep(150);
    }
    await fs.mkdir(output, {recursive: true});
    for (const scene of ['hardware', 'glass', 'profile', 'frame']) {
      console.log(`Recording ${scene}...`);
      const data = await run(`const done=arguments[arguments.length-1];window.recordScene('${scene}').then(done).catch(error=>done({error:error.message}));`);
      if (!data || data.error) throw new Error(data?.error || `No video: ${scene}`);
      await fs.writeFile(path.join(output, `${scene}.webm`), Buffer.from(data.split(',')[1], 'base64'));
    }
    console.log(`Videos saved to ${path.relative(root, output)}`);
  } finally {
    socket.destroy();browser.kill();spawnSync('pkill', ['-f', profile]);
    await sleep(300);
    await fs.rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
  }
}
main().catch(error => {console.error(error);process.exitCode = 1;});

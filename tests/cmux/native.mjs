import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export class Blocked extends Error {}
export class Failure extends Error {}
export class RpcError extends Blocked {
  constructor(method, code) {
    super(`${method}: ${/^[a-z_]{1,64}$/.test(code) ? code : 'rpc_error'}`);
    this.code = code;
  }
}

/** One explicitly addressed v2 request per connection; never falls back to focused UI. */
export function rpc(socketPath, method, params = {}, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const socket = createConnection({ path: socketPath });
    let buffer = '';
    let done = false;
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => finish(new Blocked(`${method}: RPC deadline exceeded`)), timeoutMs);
    socket.setEncoding('utf8');
    socket.on('connect', () => socket.write(`${JSON.stringify({ id, method, params })}\n`));
    socket.on('error', () => finish(new Blocked(`${method}: socket unavailable or access denied`)));
    socket.on('end', () => finish(new Blocked(`${method}: incomplete RPC response`)));
    socket.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.length > 1_048_576) return finish(new Blocked(`${method}: oversized RPC response`));
      const end = buffer.indexOf('\n');
      if (end < 0) return;
      try {
        const response = JSON.parse(buffer.slice(0, end));
        if (response.id !== id || typeof response.ok !== 'boolean') throw new Error('Unknown envelope');
        if (!response.ok) return finish(new RpcError(method, response.error?.code ?? 'rpc_error'));
        if (!response.result || typeof response.result !== 'object') throw new Error('Unknown result');
        finish(null, response.result);
      } catch {
        finish(new Blocked(`${method}: unsupported RPC response schema`));
      }
    });
  });
}

export const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

export function sshArguments(host, command) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(host)) throw new Blocked('Use a reviewed SSH config alias, not SSH options or a URL');
  return ['-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', '-o', 'ClearAllForwardings=yes',
    '-o', 'RemoteCommand=none', '-o', 'PermitLocalCommand=no', '-o', 'ForwardAgent=no',
    '-o', 'ForwardX11=no', '-o', 'ControlMaster=no',
    '-o', 'ControlPath=none', host, command];
}

/** A bounded child; raw stderr is deliberately not put in receipts. */
export function command(file, args, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let failed;
    let force;
    const stop = (reason) => {
      failed ??= new Blocked(reason);
      child.kill('SIGTERM');
      force ??= setTimeout(() => {
        child.kill('SIGKILL');
        child.stdout.destroy();
        child.stderr.destroy();
        child.unref();
        clearTimeout(timer);
        reject(new Blocked(`${failed.message}; forced termination of owned child PID ${child.pid}`));
      }, 500);
    };
    const timer = setTimeout(() => stop('Command deadline exceeded'), timeoutMs);
    child.stdout.on('data', (chunk) => {
      if (failed) return;
      output += chunk.toString();
      if (output.length > 65536) stop('Command output limit exceeded');
    });
    child.stderr.resume();
    child.once('error', () => { failed = new Blocked('Command could not be started'); });
    child.once('close', (code) => {
      clearTimeout(timer);
      clearTimeout(force);
      if (failed || code !== 0) reject(failed ?? new Blocked('Command failed; inspect it separately without publishing private output'));
      else resolve(output.trim());
    });
  });
}

export async function waitFor(test, timeoutMs, description, cancelled = () => false) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (cancelled()) throw new Blocked('Run interrupted');
    const result = await test();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Failure(`${description}: deadline exceeded`);
}

/** The child may only serve the synthetic fixture; loss of stdin also stops it. */
export function fixtureConnection(child) {
  const events = [];
  let exited = false;
  let exitCode;
  let failed = false;
  let closePromise;
  const exit = new Promise((resolve) => child.once('close', (code) => {
    exited = true;
    exitCode = code;
    resolve(code);
  }));
  child.once('error', () => { failed = true; });
  child.stdin.on('error', () => { failed = true; });
  child.stderr.resume();
  let buffer = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    if (failed) return;
    try {
      buffer += chunk;
      if (buffer.length > 8192) throw new Error('Fixture output limit');
      while (buffer.includes('\n')) {
        const end = buffer.indexOf('\n');
        const item = JSON.parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
        if (!item || typeof item.event !== 'string' || events.length >= 512) throw new Error('Fixture event schema or limit');
        events.push(item);
      }
    } catch { failed = true; buffer = ''; child.stdin.end(); }
  });
  async function event(name, predicate = () => true, timeoutMs = 15000) {
    try {
      return await waitFor(() => {
        if (failed) throw new Blocked('Fixture process or protocol failed');
        const found = events.find((item) => item.event === name && predicate(item));
        if (found) return found;
        if (exited) throw new Blocked(`Fixture exited before ${name}; check SSH and the remote Node path`);
        return null;
      }, timeoutMs, `Fixture ${name}`);
    } catch (error) {
      if (error instanceof Failure) throw new Blocked(`Fixture ${name}: readiness deadline exceeded`);
      throw error;
    }
  }
  function close() {
    closePromise ??= (async () => {
      child.stdin.end();
      const term = setTimeout(() => child.kill('SIGTERM'), 2000);
      let kill;
      const forced = new Promise((_, reject) => {
        kill = setTimeout(() => {
          child.kill('SIGKILL');
          child.stdin.destroy();
          child.stdout.destroy();
          child.stderr.destroy();
          child.unref();
          reject(new Failure('Remote fixture transport did not close; independent remote TTL remains the backstop'));
        }, 3000);
      });
      try {
        await Promise.race([exit, forced]);
        if (failed || exitCode !== 0 || !events.some((item) => item.event === 'closed')) {
          throw new Failure('Remote fixture cleanup not acknowledged; its independent TTL is the backstop');
        }
      } finally { clearTimeout(term); clearTimeout(kill); }
    })();
    return closePromise;
  }
  return {
    pid: child.pid,
    event, close,
    requested: (probe) => events.some((item) => item.event === 'request' && item.probe === probe),
    async probe(probe) {
      child.stdin.write(`${JSON.stringify({ command: 'probe', probe })}\n`);
      return event('probe', (item) => item.probe === probe);
    },
  };
}

export async function launchRemoteFixture(options, config) {
  if (!/^\/[a-zA-Z0-9_./ -]+$/.test(options.remoteNode) || options.remoteNode.includes('/../')) {
    throw new Blocked('remote-node must be an explicit absolute POSIX executable path');
  }
  const source = await readFile(new URL('./fixture.mjs', import.meta.url), 'utf8');
  const program = `${source}\nawait fixtureMain(JSON.parse(process.argv[1]));`;
  const remoteCommand = `exec ${quote(options.remoteNode)} --input-type=module --eval ${quote(program)} -- ${quote(JSON.stringify(config))}`;
  return fixtureConnection(spawn('/usr/bin/ssh', sshArguments(options.sshHost, remoteCommand), {
    stdio: ['pipe', 'pipe', 'pipe'],
  }));
}

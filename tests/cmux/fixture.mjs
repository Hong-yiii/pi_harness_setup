import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

export const MAX_TTL_MS = 600_000;
const identifier = /^[a-zA-Z0-9-]{8,64}$/;

export function marker(role, runId, probe) {
  return `CMUX-ACCEPTANCE:${role}:${runId}:${probe}`;
}

export function validateFixture(config) {
  if (!config || !['mac', 'remote'].includes(config.role)
      || !identifier.test(config.runId ?? '')
      || !Number.isInteger(config.port) || config.port < 0 || config.port > 65535
      || !Number.isInteger(config.ttlMs) || config.ttlMs < 250 || config.ttlMs > MAX_TTL_MS) {
    throw new Error('Invalid fixture configuration');
  }
}

/** A synthetic loopback origin: no filesystem, cookies, request-body or secret logging. */
export async function startFixture(config, emit = () => {}) {
  validateFixture(config);
  let timer;
  let closePromise;
  let resolveClosed;
  const closed = new Promise((resolve) => { resolveClosed = resolve; });
  const server = createServer((request, response) => {
    let url;
    try { url = new URL(request.url, 'http://127.0.0.1'); }
    catch {
      response.writeHead(400, { 'Connection': 'close' });
      response.end('Invalid request');
      return;
    }
    const parts = url.pathname.split('/');
    if (request.method !== 'GET' || parts.length !== 4 || parts[1] !== 'probe'
        || parts[2] !== config.runId || !identifier.test(parts[3])) {
      response.writeHead(404, { 'Connection': 'close', 'Cache-Control': 'no-store' });
      response.end('Not found');
      return;
    }
    const probe = parts[3];
    emit({ event: 'request', probe });
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Security-Policy': "default-src 'none'",
      'Connection': 'close',
    });
    response.end(`<!doctype html><title>cmux acceptance</title><pre>${marker(config.role, config.runId, probe)}</pre>`);
  });
  server.requestTimeout = 2000;
  server.headersTimeout = 2000;
  server.on('clientError', (_error, socket) => { socket.destroy(); });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  const port = server.address().port;
  function close(reason = 'requested') {
    if (closePromise) return closePromise;
    clearTimeout(timer);
    closePromise = new Promise((resolve) => {
      server.close(() => {
        emit({ event: 'closed', reason });
        resolveClosed();
        resolve();
      });
      server.closeAllConnections();
    });
    return closePromise;
  }
  const deadlineAt = new Date(Date.now() + config.ttlMs).toISOString();
  timer = setTimeout(() => { void close('deadline'); }, config.ttlMs);
  return {
    port,
    deadlineAt,
    close,
    closed,
    async probe(probe) {
      if (!identifier.test(probe)) throw new Error('Invalid probe identifier');
      const response = await fetch(`http://127.0.0.1:${port}/probe/${config.runId}/${probe}`, {
        signal: AbortSignal.timeout(2000),
        redirect: 'error',
      });
      return { status: response.status, body: await response.text() };
    },
  };
}

/** Stdio is the ownership channel; EOF and the independent deadline both stop the fixture. */
export async function fixtureMain(config) {
  const emit = (event) => process.stdout.write(`${JSON.stringify(event)}\n`);
  const fixture = await startFixture(config, emit);
  emit({
    event: 'ready', port: fixture.port, pid: process.pid,
    platform: process.platform, node: process.versions.node, runId: config.runId,
    deadlineAt: fixture.deadlineAt,
  });
  const input = createInterface({ input: process.stdin });
  const stop = () => { void fixture.close(); };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  input.on('close', stop);
  input.on('line', async (line) => {
    try {
      if (line.length > 1024) throw new Error('Oversized fixture command');
      const command = JSON.parse(line);
      if (command.command === 'probe') {
        const result = await fixture.probe(command.probe);
        emit({ event: 'probe', probe: command.probe, ...result });
      } else {
        throw new Error('Unsupported fixture command');
      }
    } catch {
      emit({ event: 'error', code: 'fixture_command_failed' });
      await fixture.close();
    }
  });
  await fixture.closed;
  input.close();
  process.stdin.pause();
  process.removeListener('SIGTERM', stop);
  process.removeListener('SIGINT', stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await fixtureMain(JSON.parse(process.argv[2] ?? '{}'));
  } catch (error) {
    process.stderr.write(`Fixture failed: ${error.code ?? 'invalid_configuration'}\n`);
    process.exitCode = 1;
  }
}

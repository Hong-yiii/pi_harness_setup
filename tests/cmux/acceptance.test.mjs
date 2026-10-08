import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createConnection } from 'node:net';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { startFixture, validateFixture, marker } from './fixture.mjs';
import { Blocked, Failure, RpcError, rpc, quote, sshArguments, fixtureConnection, command } from './native.mjs';
import { REQUIRED, outcome, parseOptions, assertDocument, checkPage, checkOriginLoss, cleanup, createOwnedBrowser } from './acceptance.mjs';

const ws = '10000000-0000-0000-0000-000000000001';
const otherWs = '10000000-0000-0000-0000-000000000002';
const original = '20000000-0000-0000-0000-000000000001';
const owned = '20000000-0000-0000-0000-000000000002';
const fixturePath = new URL('./fixture.mjs', import.meta.url);

async function rpcServer(t, respond) {
  const directory = await mkdtemp(join(tmpdir(), 'cmux-rpc-test-'));
  const path = join(directory, 's');
  const sockets = new Set();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
    socket.once('data', (data) => respond(JSON.parse(data.toString()), socket));
  });
  await new Promise((resolve) => server.listen(path, resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true });
  });
  return path;
}

test('v2 RPC correlates IDs and returns only a valid result', async (t) => {
  const path = await rpcServer(t, (request, socket) => {
    assert.equal(request.method, 'system.ping');
    socket.end(`${JSON.stringify({ id: request.id, ok: true, result: { pong: true } })}\n`);
  });
  assert.deepEqual(await rpc(path, 'system.ping'), { pong: true });
});

test('unknown IDs, unknown schema, access errors and deadlines never pass', async (t) => {
  for (const response of [
    { id: 'wrong', ok: true, result: {} },
    { ok: 'yes', result: {} },
    { ok: true, result: null },
    { ok: false, error: { code: 'access_denied', message: 'private details must not escape' } },
  ]) {
    const path = await rpcServer(t, (request, socket) => {
      socket.end(`${JSON.stringify({ id: request.id, ...response })}\n`);
    });
    await assert.rejects(rpc(path, 'system.ping'), (error) => error instanceof Blocked && !error.message.includes('private details'));
  }
  const quiet = await rpcServer(t, () => {});
  await assert.rejects(rpc(quiet, 'system.ping', {}, 30), /deadline/);
});

test('fixture serves only synthetic, uncached run-specific pages', async (t) => {
  const runId = randomUUID();
  const events = [];
  const fixture = await startFixture({ runId, role: 'mac', port: 0, ttlMs: 10000 }, (event) => events.push(event));
  t.after(() => fixture.close());
  const probe = randomUUID();
  const response = await fetch(`http://127.0.0.1:${fixture.port}/probe/${runId}/${probe}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.ok((await response.text()).includes(marker('mac', runId, probe)));
  assert.deepEqual(events[0], { event: 'request', probe });
  assert.equal((await fetch(`http://127.0.0.1:${fixture.port}/etc/passwd`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${fixture.port}/probe/incorrect/${probe}`)).status, 404);
  const malformed = await new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: fixture.port });
    let response = '';
    socket.on('connect', () => socket.write('GET http://[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'));
    socket.on('data', (chunk) => { response += chunk; });
    socket.on('end', () => resolve(response));
  });
  assert.match(malformed, /^HTTP\/1\.1 400/);
  await assert.rejects(startFixture({ runId, role: 'remote', port: fixture.port, ttlMs: 10000 }), { code: 'EADDRINUSE' });
});

test('fixture validation and independent expiry do not depend on the parent cleaning up', async () => {
  for (const ttlMs of [0, 249, 600001, NaN]) {
    assert.throws(() => validateFixture({ runId: randomUUID(), role: 'mac', port: 0, ttlMs }));
  }
  const fixture = await startFixture({ runId: randomUUID(), role: 'remote', port: 0, ttlMs: 250 });
  await fixture.closed;
  await assert.rejects(fetch(`http://127.0.0.1:${fixture.port}/`));
  await fixture.close();
});

test('stdio fixture supports HTTP baseline and closes on ownership-channel EOF', async (t) => {
  const runId = randomUUID();
  const config = { runId, role: 'remote', port: 0, ttlMs: 10000 };
  const child = spawn(process.execPath, [fixturePath.pathname, JSON.stringify(config)], { stdio: ['pipe', 'pipe', 'pipe'] });
  const fixture = fixtureConnection(child);
  t.after(() => fixture.close());
  const ready = await fixture.event('ready');
  assert.equal(ready.runId, runId);
  const probe = randomUUID();
  assert.ok((await fixture.probe(probe)).body.includes(marker('remote', runId, probe)));
  assert.ok(fixture.requested(probe));
  await fixture.close();
  await assert.rejects(fetch(`http://127.0.0.1:${ready.port}/`));
});

test('the SSH eval payload starts exactly one fixture and acknowledges cleanup', async (t) => {
  const runId = randomUUID();
  const source = await readFile(fixturePath, 'utf8');
  const program = `${source}\nawait fixtureMain(JSON.parse(process.argv[1]));`;
  const child = spawn(process.execPath, ['--input-type=module', '--eval', program, '--', JSON.stringify({ runId, role: 'remote', port: 0, ttlMs: 10000 })], { stdio: ['pipe', 'pipe', 'pipe'] });
  const fixture = fixtureConnection(child);
  t.after(() => fixture.close());
  assert.equal((await fixture.event('ready')).runId, runId);
  await fixture.close();
});

test('fixture protocol rejects oversized unterminated output and bounds cleanup', async () => {
  const child = spawn(process.execPath, ['-e', 'process.stdout.write("x".repeat(9000)); setInterval(() => {}, 1000)'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const fixture = fixtureConnection(child);
  try { await assert.rejects(fixture.event('ready', () => true, 1000), Blocked); }
  finally { await assert.rejects(fixture.close(), Failure); }
});

test('cleanup has a hard bound even when a transport never emits close', async () => {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  const signals = [];
  child.kill = (signal) => signals.push(signal);
  child.unref = () => {};
  const fixture = fixtureConnection(child);
  await assert.rejects(fixture.close(), Failure);
  assert.deepEqual(signals, ['SIGTERM', 'SIGKILL']);
  assert.equal(child.stdout.destroyed, true);
  assert.equal(child.stderr.destroyed, true);
});

test('fixture readiness timeout is BLOCKED, never a successful or product-failure assertion', async () => {
  const child = spawn(process.execPath, ['-e', 'process.stdin.resume(); process.stdin.on("end", () => process.exit(0))'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const fixture = fixtureConnection(child);
  try { await assert.rejects(fixture.event('ready', () => true, 100), Blocked); }
  finally { await assert.rejects(fixture.close(), Failure); }
});

test('SSH arguments preserve verification, disable inherited forwarding and reject option injection', () => {
  const args = sshArguments('reviewed-alias', 'exec node');
  assert.ok(args.includes('BatchMode=yes'));
  assert.ok(args.includes('ClearAllForwardings=yes'));
  assert.ok(args.includes('ControlPath=none'));
  assert.ok(args.includes('PermitLocalCommand=no'));
  assert.ok(args.includes('ForwardAgent=no'));
  assert.ok(args.includes('ForwardX11=no'));
  assert.ok(!args.some((arg) => arg.includes('StrictHostKeyChecking=no')));
  for (const value of ['-oProxyCommand=bad', 'user@host', 'host;touch x', 'ssh://host']) assert.throws(() => sshArguments(value, 'true'), Blocked);
  assert.equal(quote("a'b"), "'a'\\''b'");
});

test('bounded commands reject nonzero exit and terminate a hung child', async () => {
  assert.equal(await command(process.execPath, ['-e', 'console.log("ok")']), 'ok');
  const payload = "literal ' $(printf unsafe)\nsecond line";
  assert.equal(await command('/bin/sh', ['-c', `printf '%s' ${quote(payload)}`]), payload);
  await assert.rejects(command(process.execPath, ['-e', 'process.exit(4)']), Blocked);
  await assert.rejects(command(process.execPath, ['-e', 'process.stdout.write("x".repeat(131072)); setInterval(() => {}, 1000)']), /output limit/);
  await assert.rejects(command(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], 50), /deadline/);
});

test('input requires explicit native IDs, pinned CLI version and distinct workspaces', () => {
  const args = ['--socket', '/tmp/cmux.sock', '--cmux', '/Applications/cmux.app/Contents/Resources/bin/cmux',
    '--local-workspace', ws, '--remote-workspace', otherWs, '--ssh-host', 'reviewed-alias',
    '--remote-node', '/usr/local/bin/node', '--expected-version', 'cmux 0.65.0'];
  assert.equal(parseOptions(args).timeoutMs, 15000);
  assert.throws(() => parseOptions([...args, '--timeout-ms', '0']), Blocked);
  assert.throws(() => parseOptions([...args, '--install', 'latest']), Blocked);
  assert.throws(() => parseOptions(args.map((value) => value === otherWs ? ws : value)), Blocked);
  assert.throws(() => parseOptions(args.map((value) => value === ws ? 'workspace:1' : value)), Blocked);
});

test('routing oracle rejects the Mac marker and a stale nonce', () => {
  const runId = randomUUID();
  const probe = randomUUID();
  assert.equal(assertDocument(marker('remote', runId, probe), 'remote', runId, probe), true);
  assert.throws(() => assertDocument(marker('mac', runId, probe), 'remote', runId, probe), Failure);
  assert.equal(assertDocument(marker('remote', runId, randomUUID()), 'remote', runId, probe), false);
});

function simulatedPage(wrongHost = false) {
  let probe;
  const runId = randomUUID();
  return {
    runId, port: 12345, timeoutMs: 1000, cancelled: () => false,
    macRequested: (value) => wrongHost && value === probe,
    remote: { requested: (value) => !wrongHost && value === probe },
    call: async (method, params) => {
      if (method === 'browser.navigate') { probe = new URL(params.url).pathname.split('/').at(-1); return {}; }
      if (method === 'browser.eval') return { value: marker(wrongHost ? 'mac' : 'remote', runId, probe) };
      throw new Error('Unexpected RPC');
    },
  };
}

test('the actual check fails a simulated 0.65 wrong-host route and accepts an observed remote route', async () => {
  await assert.rejects(checkPage(simulatedPage(true), 'remote', '127.0.0.1', {}), Failure);
  await checkPage(simulatedPage(false), 'remote', 'localhost', {});
});

test('origin-loss requires typed failure; cached/blank pages are not success', async () => {
  const context = simulatedPage(false);
  context.remote.close = async () => {};
  context.mac = { probe: async () => ({ status: 200 }) };
  await assert.rejects(checkOriginLoss(context, {}), Blocked);
  context.call = async (method) => {
    if (method === 'browser.navigate') throw new RpcError(method, 'navigation_failed');
    return { value: '' };
  };
  await checkOriginLoss(context, {});
  context.macRequested = () => true;
  await assert.rejects(checkOriginLoss(context, {}), Failure);
});

test('origin-loss accepts fresh browser HTTP 503 evidence but not a stale navigation entry', async () => {
  const context = simulatedPage(false);
  context.remote.close = async () => {};
  context.mac = { probe: async () => ({ status: 200 }) };
  let path;
  let stale = false;
  context.call = async (method, params) => {
    if (method === 'browser.navigate') { path = new URL(params.url).pathname; return {}; }
    if (params.script.includes('responseStatus')) return { value: { status: 503, path, navigationPath: stale ? '/old' : path } };
    return { value: 'Service Unavailable' };
  };
  await checkOriginLoss(context, {});
  stale = true;
  await assert.rejects(checkOriginLoss(context, {}), Blocked);
});

test('cleanup closes only owned surfaces and preserves the initial inventory', async () => {
  const current = new Set([original, owned]);
  const closed = [];
  const context = {
    resources: [{ workspaceId: ws, surfaceId: owned, state: 'owned' }], baselines: { [ws]: [original] },
    call: async (method, params) => {
      assert.equal(params.workspace_id, ws);
      if (method === 'surface.list') return { surfaces: [...current].map((id) => ({ id })) };
      assert.equal(method, 'surface.close');
      closed.push(params.surface_id);
      current.delete(params.surface_id);
      return {};
    },
  };
  await cleanup(context);
  assert.deepEqual(closed, [owned]);
  assert.deepEqual([...current], [original]);
  assert.equal(context.resources[0].state, 'removed');
  context.resources.push({ workspaceId: ws, state: 'uncertain' });
  await assert.rejects(cleanup(context), Failure);
  assert.deepEqual(closed, [owned]);
});

test('a create response cannot claim ownership of an existing surface in either supplied workspace', async () => {
  for (const owner of [ws, otherWs]) {
    const context = { resources: [], baselines: { [owner]: [original] }, persist: async () => {},
      call: async () => ({ surface_id: original }) };
    await assert.rejects(createOwnedBrowser(context, ws), Failure);
    assert.equal(context.resources[0].state, 'uncertain');
  }
});

test('cancellation prevents creating a new browser', async () => {
  const context = { resources: [], cancelled: () => true, call: () => assert.fail('No RPC after cancellation') };
  await assert.rejects(createOwnedBrowser(context, ws), Blocked);
  assert.deepEqual(context.resources, []);
});

test('native CLI on Linux writes BLOCKED without touching a socket or starting fixtures', { skip: process.platform !== 'linux' }, async (t) => {
  const entry = new URL('../../automation/cmux-upgrade.mjs', import.meta.url);
  const result = spawnSync(process.execPath, [entry.pathname, 'baseline',
    '--socket', '/cmux-test-no-socket', '--cmux', process.execPath,
    '--local-workspace', ws, '--remote-workspace', otherWs, '--ssh-host', 'test-no-ssh',
    '--remote-node', '/cmux-test-no-node', '--expected-version', 'not-a-cmux-build'], { encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 2);
  const reportPath = result.stdout.trim().split('\n').at(-1);
  const reportRoot = new URL('../../tmp/cmux-acceptance/', import.meta.url).pathname;
  assert.ok(reportPath.startsWith(reportRoot));
  assert.match(reportPath.slice(reportRoot.length), /^[a-f0-9-]{36}\/report\.json$/);
  t.after(() => rm(dirname(reportPath), { recursive: true }));
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  assert.equal(report.status, 'BLOCKED');
  assert.equal(report.upgradeApproved, false);
  assert.match(report.checks.find((check) => check.id === 'preflight').detail, /logged-in Mac/);
  assert.deepEqual(report.resources, []);
  assert.equal(report.fixturePort, undefined);
});

test('unknown, skipped, or missing required checks cannot produce PASS', () => {
  const passed = REQUIRED.map((id) => ({ id, status: 'PASS' }));
  assert.equal(outcome(passed), 'PASS');
  assert.equal(outcome(passed.slice(1)), 'BLOCKED');
  assert.equal(outcome([{ id: 'preflight', status: 'SKIP' }, ...passed.slice(1)]), 'BLOCKED');
  assert.equal(outcome([...passed, { id: 'cleanup', status: 'FAIL' }]), 'FAIL');
});

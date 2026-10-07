import { randomUUID, createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { release, arch } from 'node:os';
import { startFixture, marker } from './fixture.mjs';
import { Blocked, Failure, RpcError, command, launchRemoteFixture, rpc, waitFor } from './native.mjs';

export const SCOPE = 'cmux-browser-routing-v1';
export const REQUIRED = ['preflight', 'fixtures', 'local-browser', 'remote-ipv4', 'remote-localhost', 'origin-loss', 'cleanup'];
export const UPGRADE_GATES = [
  'Running app identity and candidate/helper isolation',
  'Native remote terminal input/output and Pi startup',
  'Remote notification delivery and scoped cleanup',
  'Same-process reconnect on an isolated transport',
  'Public website navigation (external dependency)',
  'Approved installation/restart and migration-compatible recovery',
];
const root = fileURLToPath(new URL('../../', import.meta.url));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(value) {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new Blocked('Expected a native cmux UUID, not an index or cmux-tui ID');
  return value.toLowerCase();
}

export function parseOptions(args) {
  const names = {
    '--socket': 'socket', '--cmux': 'cmux', '--local-workspace': 'localWorkspace',
    '--remote-workspace': 'remoteWorkspace', '--ssh-host': 'sshHost',
    '--remote-node': 'remoteNode', '--expected-version': 'expectedVersion', '--timeout-ms': 'timeoutMs',
  };
  const result = { timeoutMs: 15000 };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const name = names[args[i]];
    if (!name || seen.has(name) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Blocked('Unknown, duplicate, or missing option; use --help');
    result[name] = args[i + 1];
    seen.add(name);
  }
  for (const name of Object.values(names).filter((key) => key !== 'timeoutMs')) {
    if (!result[name]) throw new Blocked(`Missing required option: ${name}`);
  }
  result.localWorkspace = uuid(result.localWorkspace);
  result.remoteWorkspace = uuid(result.remoteWorkspace);
  if (result.localWorkspace === result.remoteWorkspace) throw new Blocked('Local and remote workspaces must be different');
  if (!isAbsolute(result.socket) || !isAbsolute(result.cmux)) throw new Blocked('Socket and cmux executable paths must be absolute');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(result.sshHost)) throw new Blocked('ssh-host must be a reviewed SSH config alias');
  if (!/^\/[a-zA-Z0-9_./ -]+$/.test(result.remoteNode) || result.remoteNode.includes('/../')) throw new Blocked('remote-node must be an absolute POSIX executable path');
  if (!/^[\x20-\x7e]{1,200}$/.test(result.expectedVersion)) throw new Blocked('expected-version must be the exact printable cmux --version line');
  result.timeoutMs = Number(result.timeoutMs);
  if (!Number.isInteger(result.timeoutMs) || result.timeoutMs < 1000 || result.timeoutMs > 30000) throw new Blocked('timeout-ms must be 1000..30000');
  return result;
}

export function outcome(checks) {
  if (checks.some((check) => check.status === 'FAIL')) return 'FAIL';
  return REQUIRED.every((id) => checks.some((check) => check.id === id && check.status === 'PASS')) ? 'PASS' : 'BLOCKED';
}

function ids(result) {
  if (!Array.isArray(result.surfaces)) throw new Blocked('Unsupported surface.list schema');
  return result.surfaces.map((surface) => uuid(surface.id));
}

async function browserText(call, target) {
  const result = await call('browser.eval', { ...target, script: 'document.body ? document.body.textContent.trim() : ""' });
  if (typeof result.value !== 'string') throw new Blocked('Unsupported browser.eval schema');
  return result.value;
}

/** Strict page identity oracle shared with the regression tests; no screenshot or LLM scoring. */
export function assertDocument(text, role, runId, probe) {
  if (role === 'remote' && text === marker('mac', runId, probe)) throw new Failure('Remote browser rendered the Mac decoy');
  return text === marker(role, runId, probe);
}

export async function checkPage(context, role, host, target) {
  const { runId, port, call, timeoutMs, cancelled, macRequested, remote } = context;
  const probe = randomUUID();
  const url = `http://${host}:${port}/probe/${runId}/${probe}`;
  try {
    await call('browser.navigate', { ...target, url });
  } catch (error) {
    if (error instanceof RpcError && error.code === 'navigation_failed') throw new Failure(`${role} browser navigation failed while the fixture was healthy`);
    throw error;
  }
  await waitFor(async () => {
    if (role === 'remote' && macRequested(probe)) throw new Failure('A remote probe reached the Mac fixture');
    let text;
    try { text = await browserText(call, target); }
    catch (error) {
      if (error instanceof RpcError && ['js_error', 'javascript_error', 'evaluation_failed', 'not_ready'].includes(error.code)) return false;
      throw error;
    }
    if (!assertDocument(text, role, runId, probe)) return false;
    return role === 'mac' ? macRequested(probe) : remote.requested(probe) && !macRequested(probe);
  }, timeoutMs, `${role} browser did not render the current fixture`, cancelled);
}

/** Require an observable navigation failure, not merely silence or an unchanged cached page. */
export async function checkOriginLoss(context, target) {
  await context.remote.close();
  const probe = randomUUID();
  const baseline = await context.mac.probe(probe);
  if (baseline.status !== 200) throw new Blocked('Mac decoy was not healthy for the origin-loss test');
  // A separate probe keeps our baseline GET distinct from any wrong-host browser request.
  const browserProbe = randomUUID();
  const url = `http://127.0.0.1:${context.port}/probe/${context.runId}/${browserProbe}`;
  let navigationFailed = false;
  try { await context.call('browser.navigate', { ...target, url }); }
  catch (error) {
    if (error instanceof RpcError && error.code === 'navigation_failed') navigationFailed = true;
    else throw error;
  }
  if (context.macRequested(browserProbe)) throw new Failure('Origin loss routed a request to the Mac');
  if (!navigationFailed) {
    const result = await context.call('browser.eval', { ...target, script: `(() => {
      const entry = performance.getEntriesByType('navigation')[0];
      return { text: document.body?.textContent.trim(), path: location.pathname,
        status: entry?.responseStatus, navigationPath: entry ? new URL(entry.name).pathname : null };
    })()` });
    const value = result.value;
    if (value?.text === marker('mac', context.runId, browserProbe)) throw new Failure('Origin loss rendered the Mac decoy');
    const expectedPath = `/probe/${context.runId}/${browserProbe}`;
    if (value?.status !== 503 || value.path !== expectedPath || value.navigationPath !== expectedPath) {
      throw new Blocked('Neither typed navigation_failed nor a fresh browser-observed HTTP 503; do not count an unchanged page or silence as success');
    }
  }
  // Verify no late decoy request after the navigation callback, without treating a hang as success.
  await browserText(context.call, target).catch((error) => {
    if (!(error instanceof RpcError)) throw error;
  });
  if (context.macRequested(browserProbe)) throw new Failure('Origin loss reached the Mac after navigation failure');
}

export async function createOwnedBrowser(context, workspaceId) {
  if (context.cancelled?.()) throw new Blocked('Run interrupted before creating a browser');
  const resource = { workspaceId, state: 'creation-pending' };
  context.resources.push(resource);
  await context.persist();
  let result;
  try {
    result = await context.call('surface.create', { workspace_id: workspaceId, type: 'browser', url: 'about:blank', focus: false });
  } catch (error) {
    resource.state = error instanceof RpcError && error.code === 'method_not_found' ? 'not-created' : 'uncertain';
    throw error;
  }
  const surfaceId = uuid(result.surface_id);
  resource.surfaceId = surfaceId;
  if (Object.values(context.baselines).some((original) => original.includes(surfaceId))) {
    resource.state = 'uncertain';
    throw new Failure('Creation returned a pre-existing surface; refusing to operate on it');
  }
  const current = ids(await context.call('surface.list', { workspace_id: workspaceId }));
  if (!current.includes(surfaceId)) {
    resource.state = 'uncertain';
    throw new Blocked('Created surface ownership could not be verified');
  }
  resource.state = 'owned';
  await context.persist();
  return { workspace_id: workspaceId, surface_id: surfaceId };
}

export async function cleanup(context) {
  const errors = [];
  for (const resource of [...context.resources].reverse()) {
    if (['creation-pending', 'uncertain'].includes(resource.state)) {
      errors.push('Uncertain surface creation: inspect the private receipt; no guessed cleanup');
      continue;
    }
    if (resource.state !== 'owned') continue;
    try {
      const current = ids(await context.call('surface.list', { workspace_id: resource.workspaceId }));
      if (current.includes(resource.surfaceId)) {
        await context.call('surface.close', { workspace_id: resource.workspaceId, surface_id: resource.surfaceId });
      }
      const remaining = ids(await context.call('surface.list', { workspace_id: resource.workspaceId }));
      if (remaining.includes(resource.surfaceId)) throw new Failure('Owned browser is still present');
      resource.state = 'removed';
    } catch { errors.push('Owned browser cleanup could not be verified'); }
  }
  for (const [workspaceId, original] of Object.entries(context.baselines)) {
    try {
      const remaining = ids(await context.call('surface.list', { workspace_id: workspaceId }));
      if (original.some((id) => !remaining.includes(id))) errors.push('A pre-existing surface is missing; no automatic restoration attempted');
    } catch { errors.push('Could not verify pre-existing surfaces'); }
  }
  try { await context.remote?.close(); } catch { errors.push('Remote fixture cleanup was not acknowledged; wait for its TTL and inspect'); }
  try { await context.mac?.close(); } catch { errors.push('Mac fixture cleanup failed'); }
  if (errors.length) throw new Failure(errors.join('; '));
}

export async function nativeMain(args, phase = 'baseline') {
  process.umask(0o077);
  const runId = randomUUID();
  const directory = join(root, 'tmp', 'cmux-acceptance', runId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const report = {
    schema: 1, kind: 'native', scope: SCOPE, runId, phase,
    startedAt: new Date().toISOString(), status: 'BLOCKED', upgradeApproved: false,
    host: { platform: process.platform, release: release(), arch: arch() },
    checks: [], resources: [], pendingUpgradeGates: UPGRADE_GATES,
  };
  const persist = async () => {
    report.status = outcome(report.checks);
    await writeFile(join(directory, 'report.json.tmp'), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    await rename(join(directory, 'report.json.tmp'), join(directory, 'report.json'));
  };
  let interrupted = false;
  const interrupt = () => { interrupted = true; };
  const deadline = setTimeout(interrupt, 240000);
  deadline.unref();
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  const context = { runId, resources: report.resources, baselines: {}, persist, cancelled: () => interrupted };
  const check = async (id, test) => {
    const started = performance.now();
    try {
      if (interrupted && id !== 'cleanup') throw new Blocked('Run interrupted');
      await test();
      report.checks.push({ id, status: 'PASS', durationMs: Math.round(performance.now() - started) });
      return true;
    } catch (error) {
      report.checks.push({ id, status: error instanceof Failure ? 'FAIL' : 'BLOCKED',
        detail: error instanceof Blocked || error instanceof Failure ? error.message : 'Unexpected harness error; native validation is incomplete',
        durationMs: Math.round(performance.now() - started) });
      return false;
    } finally { await persist(); }
  };
  try {
    const preflight = await check('preflight', async () => {
      if (!['baseline', 'candidate', 'post-install'].includes(phase)) throw new Blocked('Unsupported verification phase');
      const options = parseOptions(args);
      report.target = options;
      if (process.platform !== 'darwin') throw new Blocked('Native acceptance requires a logged-in Mac; Linux unit tests are not native acceptance');
      await access(options.cmux, constants.X_OK);
      const version = await command(options.cmux, ['--version']);
      if (version !== options.expectedVersion) throw new Blocked('cmux CLI version does not match the explicitly requested version');
      report.cliVersion = version; // Artifact evidence only; not a claim about the app owning the socket.
      report.cliSha256 = createHash('sha256').update(await readFile(options.cmux)).digest('hex');
      report.testHashes = {};
      for (const name of ['acceptance.mjs', 'native.mjs', 'fixture.mjs']) {
        report.testHashes[name] = createHash('sha256').update(await readFile(new URL(name, import.meta.url))).digest('hex');
      }
      context.call = (method, params) => {
        if (interrupted && !context.cleaning) throw new Blocked('Run interrupted');
        return rpc(options.socket, method, params, options.timeoutMs);
      };
      context.timeoutMs = options.timeoutMs;
      context.options = options;
      await context.call('system.ping', {});
      const local = await context.call('workspace.remote.status', { workspace_id: options.localWorkspace });
      const remote = await context.call('workspace.remote.status', { workspace_id: options.remoteWorkspace });
      if (local.remote?.enabled !== false) throw new Blocked('The supplied local workspace is not demonstrably local');
      if (remote.remote?.backend !== 'cmux-tui' || remote.remote?.state !== 'connected'
          || remote.remote?.daemon?.state !== 'ready' || remote.remote?.destination !== options.sshHost) {
        throw new Blocked('Expected an already-connected cmux-tui SSH workspace for the exact supplied SSH alias');
      }
      // proxy.state=on_demand is a constant in 0.65.0, not a health assertion.
      report.remoteBackend = remote.remote.backend;
      for (const workspaceId of [options.localWorkspace, options.remoteWorkspace]) {
        const surfaces = ids(await context.call('surface.list', { workspace_id: workspaceId }));
        if (!surfaces.length) throw new Blocked('Use existing nonempty workspaces so cleanup cannot close a last surface');
        context.baselines[workspaceId] = surfaces;
      }
    });
    if (preflight) {
      const fixtures = await check('fixtures', async () => {
        const requested = new Set();
        context.macRequested = (probe) => requested.has(probe);
        context.mac = await startFixture({ runId, role: 'mac', port: 0, ttlMs: 300000 }, (event) => {
          if (event.event === 'request') requested.add(event.probe);
        });
        context.port = context.mac.port;
        report.macFixture = { port: context.port, deadlineAt: context.mac.deadlineAt };
        context.remote = await launchRemoteFixture(context.options, { runId, role: 'remote', port: context.port, ttlMs: 300000 });
        report.remoteTransportPid = context.remote.pid;
        report.fixturePort = context.port;
        await persist();
        const ready = await context.remote.event('ready');
        if (ready.runId !== runId || ready.port !== context.port || ready.platform !== 'linux' || Number(ready.node.split('.')[0]) < 22) {
          throw new Blocked('Remote fixture identity, port, platform, or Node version mismatch');
        }
        report.remoteFixture = { pid: ready.pid, platform: ready.platform, node: ready.node, ttlMs: 300000, deadlineAt: ready.deadlineAt };
        for (const [role, fixture] of [['mac', context.mac], ['remote', context.remote]]) {
          const probe = randomUUID();
          const result = await fixture.probe(probe);
          if (result.status !== 200 || !result.body.includes(marker(role, runId, probe))) throw new Blocked('Fixture HTTP baseline failed');
        }
        context.localBrowser = await createOwnedBrowser(context, context.options.localWorkspace);
        context.remoteBrowser = await createOwnedBrowser(context, context.options.remoteWorkspace);
      });
      if (fixtures) {
        await check('local-browser', () => checkPage(context, 'mac', '127.0.0.1', context.localBrowser));
        await check('remote-ipv4', () => checkPage(context, 'remote', '127.0.0.1', context.remoteBrowser));
        await check('remote-localhost', () => checkPage(context, 'remote', 'localhost', context.remoteBrowser));
        await check('origin-loss', () => checkOriginLoss(context, context.remoteBrowser));
      }
    }
  } finally {
    context.cleaning = true;
    await check('cleanup', () => cleanup(context));
    for (const id of REQUIRED) {
      if (!report.checks.some((item) => item.id === id)) report.checks.push({ id, status: 'BLOCKED', detail: 'Prerequisite did not pass' });
    }
    report.finishedAt = new Date().toISOString();
    await persist();
    clearTimeout(deadline);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  process.stdout.write(`${report.status} (${SCOPE}; not full upgrade approval)\n${join(directory, 'report.json')}\n`);
  return report.status === 'PASS' ? 0 : report.status === 'FAIL' ? 1 : 2;
}

export const HELP = `Test-only native cmux browser-routing acceptance (Node >=22, Mac -> Linux).
No installation, SSH workspace creation, shared reconnect, or firewall changes.

node tests/cmux/acceptance.mjs \\
  --socket /absolute/native/cmux.sock --cmux /absolute/path/to/cmux \\
  --local-workspace UUID --remote-workspace UUID --ssh-host reviewed-alias \\
  --remote-node /absolute/path/to/node --expected-version 'exact cmux --version line'

Optional: --timeout-ms 15000 (1000..30000). Use quiet, nonempty test workspaces.
Fixtures expire independently after five minutes. Never use a manual SSH tunnel
for this test. Native API/schema or cleanup uncertainty prevents PASS.
Receipts: tmp/cmux-acceptance/<run-id>/report.json (private, ignored).
Exit 0: routing checks passed; 1: failed; 2: blocked. Full upgrade gates remain.
`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.slice(2).includes('--help')) process.stdout.write(HELP);
  else process.exitCode = await nativeMain(process.argv.slice(2));
}

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { nativeMain, HELP, SCOPE, REQUIRED, UPGRADE_GATES, outcome } from '../tests/cmux/acceptance.mjs';

/** ponytail: verify first; add install/recovery automation only after the native gates are proven. */
export function compareReports(baseline, candidate) {
  const blocked = (reason) => ({ status: 'BLOCKED', reason, upgradeApproved: false, pendingUpgradeGates: UPGRADE_GATES });
  for (const report of [baseline, candidate]) {
    if (report?.schema !== 1 || report.kind !== 'native' || report.scope !== SCOPE || report.host?.platform !== 'darwin'
        || !Array.isArray(report.checks) || !Array.isArray(report.resources)) return blocked('Unsupported or non-native receipt');
    if (report.checks.length !== REQUIRED.length || REQUIRED.some((id) => report.checks.filter((check) => check.id === id).length !== 1)
        || report.checks.some((check) => !['PASS', 'FAIL', 'BLOCKED'].includes(check.status))) return blocked('Incomplete or ambiguous check matrix');
    if (report.status !== outcome(report.checks)) return blocked('Receipt status disagrees with its checks');
    if (report.status === 'BLOCKED' || report.checks.some((check) => check.status === 'BLOCKED')) return blocked('A required check was not completed');
    if (['preflight', 'fixtures', 'local-browser', 'cleanup'].some((id) => report.checks.find((check) => check.id === id).status !== 'PASS')) {
      return blocked('A required control or cleanup/preservation gate did not pass');
    }
    if (report.resources.some((resource) => !['removed', 'not-created'].includes(resource.state))) return blocked('Residual or uncertain resources remain');
    if (report.cliVersion !== report.target?.expectedVersion || !/^[a-f0-9]{64}$/.test(report.cliSha256 ?? '')) return blocked('Missing pinned CLI artifact evidence');
  }
  if (baseline.phase !== 'baseline' || !['candidate', 'post-install'].includes(candidate.phase)) return blocked('Expected baseline then candidate/post-install phases');
  for (const file of ['acceptance.mjs', 'native.mjs', 'fixture.mjs']) {
    const hash = baseline.testHashes?.[file];
    if (!/^[a-f0-9]{64}$/.test(hash ?? '') || candidate.testHashes?.[file] !== hash) return blocked('Test source changed between runs');
  }
  if (baseline.target.sshHost !== candidate.target.sshHost) return blocked('SSH targets differ; these runs are not a like-for-like comparison');
  return {
    status: candidate.status,
    reason: candidate.status === 'PASS' ? 'Routing gate passed; the remaining upgrade gates still require evidence' : 'Candidate failed the routing gate',
    baselineStatus: baseline.status, candidateStatus: candidate.status,
    upgradeApproved: false, pendingUpgradeGates: UPGRADE_GATES,
  };
}

async function main(args) {
  const [phase, ...rest] = args;
  if (!phase || phase === '--help') {
    process.stdout.write(`cmux upgrade verification workflow (not an installer)\n\nCommands:\n  baseline <acceptance options>\n  candidate <acceptance options>\n  post-install <acceptance options>\n  compare <baseline-report.json> <candidate-report.json>\n\n${HELP}`);
    return 0;
  }
  if (['baseline', 'candidate', 'post-install'].includes(phase)) return nativeMain(rest, phase);
  if (phase === 'compare' && rest.length === 2) {
    const reports = await Promise.all(rest.map(async (path) => JSON.parse(await readFile(path, 'utf8'))));
    const result = compareReports(...reports);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.status === 'PASS' ? 0 : result.status === 'FAIL' ? 1 : 2;
  }
  process.stderr.write('Unsupported command. No installation or restart was attempted. Use --help.\n');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await main(process.argv.slice(2)); }
  catch {
    process.stderr.write('BLOCKED: verification could not finish or receipt could not be read. Inspect private run receipts; do not promote.\n');
    process.exitCode = 2;
  }
}

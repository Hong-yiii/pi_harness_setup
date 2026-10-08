import test from 'node:test';
import assert from 'node:assert/strict';
import { compareReports } from '../../automation/cmux-upgrade.mjs';
import { SCOPE, REQUIRED } from './acceptance.mjs';

function receipt(phase) {
  return {
    schema: 1, kind: 'native', scope: SCOPE, phase, host: { platform: 'darwin' },
    checks: REQUIRED.map((id) => ({ id, status: 'PASS' })), resources: [], status: 'PASS',
    cliVersion: 'cmux example pinned version', cliSha256: 'b'.repeat(64),
    target: { expectedVersion: 'cmux example pinned version', sshHost: 'test-alias' },
    testHashes: Object.fromEntries(['acceptance.mjs', 'native.mjs', 'fixture.mjs'].map((file) => [file, 'a'.repeat(64)])),
  };
}

test('a clean candidate can fix a recorded baseline failure, without granting upgrade authority', () => {
  const baseline = receipt('baseline');
  baseline.checks.find((check) => check.id === 'remote-ipv4').status = 'FAIL';
  baseline.status = 'FAIL';
  const result = compareReports(baseline, receipt('candidate'));
  assert.equal(result.status, 'PASS');
  assert.equal(result.baselineStatus, 'FAIL');
  assert.equal(result.upgradeApproved, false);
  assert.ok(result.pendingUpgradeGates.length > 0);
});

test('unit/simulated, incomplete, contradictory and changed-source receipts cannot authorize a candidate', () => {
  const changes = [
    (report) => { report.kind = 'simulated'; },
    (report) => { report.host.platform = 'linux'; },
    (report) => { report.checks.pop(); },
    (report) => { report.checks.push(report.checks[0]); },
    (report) => { report.checks[0].status = 'SKIP'; },
    (report) => { report.checks[0].status = 'BLOCKED'; },
    (report) => { report.status = 'FAIL'; },
    (report) => { report.resources.push({ state: 'uncertain' }); },
    (report) => { report.cliSha256 = ''; },
    (report) => { report.cliVersion = 'different'; },
    (report) => { report.testHashes['native.mjs'] = 'c'.repeat(64); },
    (report) => { report.target.sshHost = 'another-host'; },
    (report) => { report.phase = 'baseline'; },
  ];
  for (const change of changes) {
    const candidate = receipt('candidate');
    change(candidate);
    const result = compareReports(receipt('baseline'), candidate);
    assert.equal(result.status, 'BLOCKED');
    assert.equal(result.upgradeApproved, false);
  }
});

test('failed baseline controls or cleanup cannot be bypassed by a green candidate', () => {
  for (const id of ['preflight', 'fixtures', 'local-browser', 'cleanup']) {
    const baseline = receipt('baseline');
    baseline.checks.find((check) => check.id === id).status = 'FAIL';
    baseline.status = 'FAIL';
    assert.equal(compareReports(baseline, receipt('candidate')).status, 'BLOCKED');
  }
  const candidate = receipt('candidate');
  candidate.checks.find((check) => check.id === 'cleanup').status = 'FAIL';
  candidate.status = 'FAIL';
  assert.equal(compareReports(receipt('baseline'), candidate).status, 'BLOCKED');
});

test('candidate failures remain failures, not retries or an automatic rollback', () => {
  const candidate = receipt('post-install');
  candidate.checks.find((check) => check.id === 'origin-loss').status = 'FAIL';
  candidate.status = 'FAIL';
  const result = compareReports(receipt('baseline'), candidate);
  assert.equal(result.status, 'FAIL');
  assert.equal(result.upgradeApproved, false);
});

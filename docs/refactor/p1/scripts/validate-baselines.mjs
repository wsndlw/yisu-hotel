import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = path.resolve(process.cwd());
const failures = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const manifest = JSON.parse(read('docs/refactor/p1/baseline/manifest.json'));
const artifactLocations = {
  'schema.graphql': 'docs/refactor/p1/baseline/schema.graphql',
  'database-schema.sql': 'docs/refactor/p1/baseline/database-schema.sql',
  'test-fixture.sql': 'docs/refactor/p1/baseline/test-fixture.sql',
  'graphql-operations.json': 'docs/refactor/p1/reports/graphql-operations.json',
  'graphql-document-validation.json': 'docs/refactor/p1/reports/graphql-document-validation.json',
  'p1-contract.e2e-spec.ts.snap': 'server/test/__snapshots__/p1-contract.e2e-spec.ts.snap',
};
for (const [name, relative] of Object.entries(artifactLocations)) {
  const actual = sha256(fs.readFileSync(path.join(root, relative)));
  const expected = manifest.artifacts[name].sha256;
  if (actual !== expected) failures.push(`${name} checksum differs from manifest`);
}

const liveSchemaPath = path.join(root, 'server/schema.gql');
const snapshotSchemaPath = path.join(root, 'docs/refactor/p1/baseline/schema.graphql');
const liveSchema = fs.readFileSync(liveSchemaPath);
const snapshotSchema = fs.readFileSync(snapshotSchemaPath);
if (!liveSchema.equals(snapshotSchema)) failures.push('GraphQL schema snapshot differs from server/schema.gql');
if (sha256(snapshotSchema) !== '4b74702f126fa217aa1ef4bf68d5ce4fe789d460a80bfa32c72519912c2b8d34') {
  failures.push('GraphQL schema checksum differs from the approved P1 baseline');
}

const inventoryRun = spawnSync(
  process.execPath,
  ['docs/refactor/p1/scripts/inventory-graphql-operations.mjs'],
  { cwd: root, encoding: 'utf8' },
);
if (inventoryRun.status !== 0) {
  failures.push(`GraphQL inventory script failed: ${inventoryRun.stderr.trim()}`);
} else {
  const current = JSON.parse(inventoryRun.stdout);
  const saved = JSON.parse(read('docs/refactor/p1/reports/graphql-operations.json'));
  delete current.generatedAt;
  delete saved.generatedAt;
  if (JSON.stringify(current) !== JSON.stringify(saved)) failures.push('GraphQL operation inventory is stale');
}

const databaseSchema = read('docs/refactor/p1/baseline/database-schema.sql');
const schemaTables = new Set([...databaseSchema.matchAll(/^CREATE TABLE `([^`]+)`/gm)].map((match) => match[1]));
if (schemaTables.size !== 14) failures.push(`Expected 14 schema tables, found ${schemaTables.size}`);
if (/^INSERT INTO/m.test(databaseSchema)) failures.push('Schema-only database baseline contains INSERT data');

const fixture = read('docs/refactor/p1/baseline/test-fixture.sql');
const fixtureTables = new Set([...fixture.matchAll(/^(?:DELETE FROM|INSERT INTO) `([^`]+)`/gm)].map((match) => match[1]));
for (const table of fixtureTables) {
  if (!schemaTables.has(table)) failures.push(`Fixture references unknown table: ${table}`);
}
for (const required of ['CUSTOMER', 'MERCHANT', 'ADMIN', 'PENDING', 'PAID', 'CANCELLED', 'COMPLETED']) {
  if (!fixture.includes(`'${required}'`)) failures.push(`Fixture does not cover ${required}`);
}
for (const status of [0, 1, 2, 3, 4]) {
  if (!new RegExp(`, ${status}, [0-9]`).test(fixture)) failures.push(`Fixture does not cover hotel status ${status}`);
}

const dumpPath = path.resolve(root, '../yisu_hotel-2026-10-07_152046-dump.sql');
if (fs.existsSync(dumpPath)) {
  const dumpChecksum = sha256(fs.readFileSync(dumpPath));
  if (dumpChecksum !== '2bb52079f4addfe71cf1e8aac9e10da2f66f42847c2a78c4ca4392ee0f36db75') {
    failures.push('Current MySQL dump checksum differs from the approved baseline');
  }
}

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`FAIL: ${failure}\n`);
  process.exit(1);
}

process.stdout.write('P1 baseline validation: OK\n');

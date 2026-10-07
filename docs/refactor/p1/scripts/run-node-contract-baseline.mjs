import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const repositoryRoot = path.resolve(process.cwd());
const database = process.env.P1_DB_NAME ?? 'yisu_p1_contract_20261007';
const host = process.env.P1_DB_HOST ?? 'localhost';
const port = process.env.P1_DB_PORT ?? '3306';
const user = process.env.P1_DB_USER ?? 'root';
const password = process.env.P1_DB_PASSWORD ?? '123456';

if (!/^yisu_p1_contract_[a-z0-9_]+$/.test(database)) {
  process.stderr.write('Refusing to reset a database whose name does not start with yisu_p1_contract_.\n');
  process.exit(2);
}

const mysqlArguments = [
  '--protocol=socket',
  `--host=${host}`,
  `--port=${port}`,
  `--user=${user}`,
  '--default-character-set=utf8mb4',
  '--batch',
];
const mysqlEnvironment = { ...process.env, MYSQL_PWD: password };

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: 'utf8',
    stdio: options.input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'],
    env: options.env ?? process.env,
    input: options.input,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('mysql', mysqlArguments, {
  env: mysqlEnvironment,
  input: `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`,
});

const schema = fs.readFileSync(
  path.join(repositoryRoot, 'docs/refactor/p1/baseline/database-schema.sql'),
  'utf8',
);
const fixture = fs.readFileSync(
  path.join(repositoryRoot, 'docs/refactor/p1/baseline/test-fixture.sql'),
  'utf8',
);
run('mysql', mysqlArguments, {
  env: mysqlEnvironment,
  input: `USE \`${database}\`;\n${schema}\n${fixture}\n`,
});

const jestArguments = [
  '--config',
  './test/jest-e2e.json',
  '--runInBand',
  '--detectOpenHandles',
  '--runTestsByPath',
  'test/p1-contract.e2e-spec.ts',
];
if (process.argv.includes('--update-snapshots')) jestArguments.splice(4, 0, '--updateSnapshot');

run('./node_modules/.bin/jest', jestArguments, {
  cwd: path.join(repositoryRoot, 'server'),
  env: {
    ...process.env,
    P1_DB_HOST: host,
    P1_DB_PORT: port,
    P1_DB_USER: user,
    P1_DB_PASSWORD: password,
    P1_DB_NAME: database,
  },
});
